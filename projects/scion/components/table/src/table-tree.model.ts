import {computed, inject, Injector, linkedSignal, ResourceRef, runInInjectionContext, Signal, untracked, WritableSignal} from '@angular/core';
import {SciTableColumnFilter, SciTableDatasourceQuery, SciTableSortCriterion, SciTreeTableNode, SciTreeTableDatasource} from './table-datasource';
import {catchError, Observable} from 'rxjs';
import {Arrays, Observables} from '@scion/toolkit/util';
import {rxResource, toObservable} from '@angular/core/rxjs-interop';
import {ɵSingleActiveInjectorFactory} from '@scion/components/common';
import {MaybeArray} from '@scion/toolkit/types';

/**
 * Loads and builds the table's hierarchy using item IDs and parent relationships, without loading full items.
 * Only operates on IDs, never full objects and regardless of the viewport / virtual scrolling state.
 * For non-hierarchical datasources, treats each item as a root node and preserves the order from the unfiltered response.
 *
 * Uses two independent requests:
 *  - An unfiltered request loads all nodes initially and whenever the sort criteria change.
 *  - A filtered request loads matching nodes when a filter is present and whenever the filters change.
 *
 * Combines both responses to include matching nodes and their parents and children, preserving the order from the unfiltered response.
 * When no filter is present, uses the unfiltered response directly.
 *
 * @example
 * ```ts
 * const unfilteredNodes = [
 *   {item: 'Downloads'},
 *   {item: 'Desktop'},
 *   {item: 'New Folder', parent: 'Desktop'},
 *   {item: 'notes.txt', parent: 'New Folder'},
 * ];
 *
 * // Filtered by 'notes'
 * const filteredNodes = [{item: 'notes.txt', parent: 'New Folder'}];
 *
 * // Result includes the matching node and its ancestors.
 * const tree = [
 *   {item: 'Desktop'},
 *   {item: 'New Folder', parent: 'Desktop'},
 *   {item: 'notes.txt', parent: 'New Folder'},
 * ];
 * ```
 */
export class SciTableTree<ID> {

  private readonly _injector = inject(Injector);

  private readonly _datasource: SciTreeTableDatasource<unknown, ID>;
  private readonly _sortCriteria: Signal<SciTableSortCriterion[]>;
  private readonly _columnFilters: Signal<SciTableColumnFilter[]>;
  private readonly _tableFilter: Signal<string | null>;

  private readonly _activeNode = this.computeActiveNode();
  private readonly _selectedNodes = this.computeSelectedNodes();
  private readonly _expandedNodes = this.computeExpandedNodes();

  private readonly _unfilteredNodes = this.computeUnfilteredNodes();
  private readonly _filteredNodes = this.computeFilteredNodes();
  private readonly _tree = this.computeTree();

  public readonly expandedNodes = this._expandedNodes.asReadonly();
  public readonly selectedNodes = this._selectedNodes.asReadonly();
  public readonly activeNode = this._activeNode.asReadonly();

  public readonly error = computed(() => this._unfilteredNodes.status() === 'error' || this._filteredNodes.status() === 'error');
  public readonly loading = computed(() => this._unfilteredNodes.isLoading() || this._filteredNodes.isLoading());
  public readonly unfilteredNodesById = computed(() => this._unfilteredNodes.status() === 'error' ? new Map<ID, SciTreeTableNode<ID>>() : this._unfilteredNodes.value().reduce((acc, node) => acc.set(node.id, node), new Map<ID, SciTreeTableNode<ID>>()));
  public readonly nodes = computed(() => this._tree().nodes);
  public readonly nodesById = computed(() => this._tree().nodesById);
  public readonly childrenIdsByParent = computed(() => this._tree().childrenIdsByParent);

  public readonly visibleNodes = this.computeVisibleNodes();
  public readonly nodeIndexById = computed(() => this.visibleNodes().reduce((map, node, index) => map.set(node.id, index), new Map<ID, number>()));
  public readonly visibleNodeCount = computed(() => this.visibleNodes().length);

  constructor(options: {
    sortCriteria: Signal<SciTableSortCriterion[]>;
    columnFilters: Signal<SciTableColumnFilter[]>;
    tableFilter: Signal<string | null>;
    datasource: SciTreeTableDatasource<unknown, ID>;
  }) {
    this._datasource = options.datasource;
    this._columnFilters = options.columnFilters;
    this._tableFilter = options.tableFilter;
    this._sortCriteria = options.sortCriteria;
  }

  public reload(): void {
    this._unfilteredNodes.reload();
  }

  public reloadFailed(): void {
    if (this._unfilteredNodes.status() === 'error') {
      this._unfilteredNodes.reload();
    }

    if (this._filteredNodes.status() === 'error') {
      this._filteredNodes.reload();
    }
  }

  public expand(id: MaybeArray<ID>): void {
    const ids = Arrays.coerce(id);
    this._expandedNodes.update(toggledRows => new Set([...toggledRows, ...ids]));
  }

  public expandAll(): void {
    this._expandedNodes.set(new Set([...this.childrenIdsByParent().keys()].filter((id): id is ID => id !== undefined)));
  }

  public collapse(id: MaybeArray<ID>): void {
    const ids = Arrays.coerce(id);
    this._expandedNodes.update(toggledRows => {
      const newToggledRows = new Set(toggledRows);
      ids.forEach(id => newToggledRows.delete(id));
      return newToggledRows;
    });
  }

  public collapseAll(): void {
    this._expandedNodes.set(new Set());
  }

  public toggleRow(id: ID): void {
    this._expandedNodes.update(toggledRows => {
      if (toggledRows.has(id)) {
        const newToggledRows = new Set(toggledRows);
        newToggledRows.delete(id);
        return newToggledRows;
      }
      else {
        return new Set(toggledRows).add(id);
      }
    });
  }

  public setActiveNode(id: ID | undefined): void {
    this._activeNode.set(id);
  }

  public updateSelectedNodes(updateFn: (ids: Set<ID>) => Set<ID>): void {
    this._selectedNodes.update(updateFn);
  }

  public select(ids: MaybeArray<ID>): void {
    // Prevents selecting nodes which do not exist.
    // Check against unfiltered nodes, to allow selecting nodes, which are filtered out.
    const nodesById = this.unfilteredNodesById();
    const nodeIds = Arrays.coerce(ids).filter(id => nodesById.has(id));

    // Expand nodes.
    nodeIds.forEach(id => {
      const node = nodesById.get(id);

      if (node?.parentId !== undefined && nodesById.has(node.parentId)) {
        // Expand all nodes before the selected ones.
        this.expand(getPathFromRoot(nodesById.get(node.parentId)!, nodesById));
      }
    });

    // Wait for viewport height to update after expanding nodes.
    // Else scrollActiveRowIntoViewport operates on an old viewport height.
    requestAnimationFrame(() => {
      this._selectedNodes.set(new Set(nodeIds));

      // Find and activate last item based on the visual index.
      const lastItemIndex = Math.max(...nodeIds.map(id => this.nodeIndexById().get(id) ?? -1));
      const lastItem = this.visibleNodes()[lastItemIndex]?.id;
      this._activeNode.set(lastItem);
    });
  }

  private getIds$(query: Partial<SciTableDatasourceQuery>, options: {injector: Injector}): Observable<SciTreeTableNode<ID>[]> {
    return runInInjectionContext(options.injector, () => Observables.coerce(this._datasource.getTreeTableNodes({
      columnFilters: query.columnFilters ?? [],
      sortCriteria: query.sortCriteria ?? [],
      tableFilter: query.tableFilter,
    })).pipe(catchError(error => {
      console.error(error);
      throw error;
    })));
  }

  private computeUnfilteredNodes(): ResourceRef<SciTreeTableNode<ID>[]> {
    // Create separate injection context per resource invocation to clean up allocated resources.
    const injectorFactory = new ɵSingleActiveInjectorFactory({parent: this._injector});

    return rxResource({
      params: () => this._sortCriteria(),
      stream: ({params: sortCriteria}) => this.getIds$({sortCriteria}, {injector: injectorFactory.create()}),
      defaultValue: [],
    });
  }

  private computeFilteredNodes(): ResourceRef<SciTreeTableNode<ID>[]> {
    // Create separate injection context per resource invocation to clean up allocated resources.
    const injectorFactory = new ɵSingleActiveInjectorFactory({parent: this._injector});

    return rxResource({
      params: () => ({
        columnFilters: this._columnFilters(),
        tableFilter: this._tableFilter() ?? undefined,
      }),
      stream: ({params}) => {
        const injector = injectorFactory.create();
        if (params.columnFilters.length === 0 && params.tableFilter === undefined) {
          return runInInjectionContext(injector, () => toObservable(this._unfilteredNodes.value));
        }
        return this.getIds$({columnFilters: params.columnFilters, tableFilter: params.tableFilter}, {injector});
      },
      defaultValue: [],
    });
  }

  private computeTree(): Signal<TreeData<ID>> {
    return computed(() => {
      if (this.error()) {
        return {
          nodes: [],
          nodesById: new Map(),
          childrenIdsByParent: new Map(),
        };
      }

      const filteredNodes = this._filteredNodes.value();
      const unfilteredNodes = this._unfilteredNodes.value();

      return untracked(() => createTree(filteredNodes, unfilteredNodes));
    });
  }

  private computeExpandedNodes(): WritableSignal<Set<ID>> {
    return linkedSignal({
      source: () => ({unfilteredNodesById: this.unfilteredNodesById(), loading: this._unfilteredNodes.isLoading(), columnFilters: this._columnFilters(), tableFilter: this._tableFilter()}),
      computation: ({unfilteredNodesById, loading, tableFilter, columnFilters}, previous): Set<ID> => {
        // Wait until resource finished loading before changing the expanded nodes.
        if (loading) {
          return previous?.value ?? new Set<ID>();
        }

        // Expand all items if filter is set.
        if (columnFilters.length > 0 || tableFilter?.trim()) {
          return new Set(unfilteredNodesById.keys());
        }

        const expandedNodeIds = previous?.value ?? new Set<ID>();
        return new Set([...expandedNodeIds].filter(id => unfilteredNodesById.has(id)));
      },
    });
  }

  private computeSelectedNodes(): WritableSignal<Set<ID>> {
    return linkedSignal({
      source: () => ({unfilteredNodesById: this.unfilteredNodesById(), loading: this._unfilteredNodes.isLoading()}),
      computation: ({unfilteredNodesById, loading}, previous): Set<ID> => {
        // Wait until resource finished loading before changing the selected nodes.
        if (loading) {
          return previous?.value ?? new Set<ID>();
        }

        const selectedNodeIds = previous?.value ?? new Set<ID>();
        return new Set([...selectedNodeIds].filter(id => unfilteredNodesById.has(id)));
      },
    });
  }

  private computeActiveNode(): WritableSignal<ID | undefined> {
    return linkedSignal({
      source: () => ({unfilteredNodesById: this.unfilteredNodesById(), loading: this._unfilteredNodes.isLoading()}),
      computation: ({unfilteredNodesById, loading}, previous): ID | undefined => {
        // Wait until resource finished loading before changing the active nodes.
        if (loading) {
          return previous?.value;
        }

        return previous?.value !== undefined && unfilteredNodesById.has(previous.value) ? previous.value : undefined;
      },
    });
  }

  private computeVisibleNodes(): Signal<SciTreeTableNode<ID>[]> {
    return computed(() => {
      if (this.error()) {
        return [];
      }

      const expandedNodes = this._expandedNodes();
      const nodesById = this.nodesById();
      const nodes = this.nodes();

      const allAncestorsExpanded = (node?: SciTreeTableNode<ID>): boolean => {
        if (node?.parentId === undefined) {
          return true;
        }

        if (!expandedNodes.has(node.parentId)) {
          return false;
        }

        return allAncestorsExpanded(nodesById.get(node.parentId));
      };

      return untracked(() => nodes.filter(allAncestorsExpanded));
    });
  }
}

export interface TreeData<ID> {
  nodes: SciTreeTableNode<ID>[];
  nodesById: Map<ID, SciTreeTableNode<ID>>;
  childrenIdsByParent: Map<ID | undefined, ID[]>;
}

function createTree<ID>(filteredNodes: SciTreeTableNode<ID>[], unfilteredNodes: SciTreeTableNode<ID>[]): TreeData<ID> {
  const nodesById = includeParentsAndChildren(unfilteredNodes, filteredNodes);
  const sortedNodes = unfilteredNodes.filter(node => nodesById.has(node.id));

  const childrenIdsByParent = groupChildrenByParent(sortedNodes);
  const nodes = flattenTree(nodesById, childrenIdsByParent);

  return ({nodes, nodesById, childrenIdsByParent});
}

function includeParentsAndChildren<ID>(unfilteredNodes: SciTreeTableNode<ID>[], filteredNodes: SciTreeTableNode<ID>[]): Map<ID, SciTreeTableNode<ID>> {
  const nodesById = new Map(unfilteredNodes.map(node => [node.id, node]));
  const filteredIds = new Set(filteredNodes.map(node => node.id));

  return unfilteredNodes.reduce((acc, node) => {
    const path = getPathFromRoot(node, nodesById);

    // Include the full path (parents and children) of any filtered node.
    // This ensures that all parents and children are displayed, even if they don't match the filter.
    if (path.some(id => filteredIds.has(id))) {
      path.forEach(id => acc.set(id, nodesById.get(id)!));
    }

    return acc;
  }, new Map<ID, SciTreeTableNode<ID>>());
}

function groupChildrenByParent<ID>(nodes: SciTreeTableNode<ID>[]): Map<ID | undefined, ID[]> {
  return nodes.reduce((acc, node) => {
    const values = acc.get(node.parentId) ?? [];
    values.push(node.id);
    return acc.set(node.parentId, values);
  }, new Map<ID | undefined, ID[]>());
}

/**
 * Flattens the tree in depth-first order, placing each parent before its descendants and preserving sibling order.
 * Includes all nodes regardless of expansion state.
 *
 * Example:
 * ```
 * [
 *   {id: '1'},
 *   {id: '1.1', parentId: '1'},
 *   {id: '1.2', parentId: '1'},
 *   {id: '1.2.1', parentId: '1.2'},
 *   {id: '1.3', parentId: '1'},
 *   {id: '2'},
 * ]
 * ```
 */
function flattenTree<ID>(nodesById: Map<ID, SciTreeTableNode<ID>>, childrenIdsByParent: Map<ID | undefined, ID[]>): SciTreeTableNode<ID>[] {
  const nodes: SciTreeTableNode<ID>[] = [];
  const roots = childrenIdsByParent.get(undefined) ?? [];
  const stack = roots.slice().reverse();

  // Don't use recursion, to avoid stack overflow on large amount of root nodes (e.g. flat table).
  while (stack.length > 0) {
    const id = stack.pop()!;

    nodes.push(nodesById.get(id)!);

    // Push children in reverse order so the first child is visited next.
    const children = childrenIdsByParent.get(id) ?? [];
    for (let i = children.length - 1; i >= 0; i--) {
      if (children[i] !== undefined) {
        stack.push(children[i]!);
      }
    }
  }

  return nodes;
}

export function getPathFromRoot<ID>(node: SciTreeTableNode<ID>, nodesById: Map<ID, SciTreeTableNode<ID>>): ID[] {
  const parent = node.parentId !== undefined ? nodesById.get(node.parentId) : undefined;
  const pathFromRoot = parent ? getPathFromRoot(parent, nodesById) : [];
  return pathFromRoot.concat(node.id);
}
