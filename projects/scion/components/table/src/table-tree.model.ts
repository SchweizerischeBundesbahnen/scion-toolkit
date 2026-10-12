import {computed, DestroyableInjector, effect, inject, Injector, ResourceRef, runInInjectionContext, signal, Signal, untracked} from '@angular/core';
import {isArrayDatasource, isTreeDatasource, SciTableColumnFilter, SciTableDatasource, SciTableIdsRequest, SciTableSortCriterion, SciTableTreeDatasource, SciTableTreeNode} from './table-datasource';
import {catchError, Observable, of, OperatorFunction} from 'rxjs';
import {Arrays, Observables} from '@scion/toolkit/util';
import {map} from 'rxjs/operators';
import {rxResource} from '@angular/core/rxjs-interop';
import {createDestroyableInjector} from '@scion/components/common';
import {findNodePath} from './ɵtable.model';
import {MaybeArray} from '@scion/toolkit/types';

export class TableTree<ID> {

  private readonly _injector = inject(Injector);

  private readonly _datasource: SciTableDatasource<unknown, ID> | SciTableTreeDatasource<unknown, ID>;
  private readonly _sortCriteria: Signal<SciTableSortCriterion[]>;
  private readonly _columnFilters: Signal<SciTableColumnFilter[]>;
  private readonly _tableFilter: Signal<string | null>;

  // TODO [tree]: Cleanup on new unsortedNodes
  private readonly _expandedNodes = signal(new Set<ID>());
  // private readonly _expandedNodes = linkedSignal({
  //   source: () => this._unfilteredNodes.status() === 'error' ? [] : this._unfilteredNodes.value(),
  //   computation: (source, previous): Set<ID> => {
  //     console.log('previous', previous?.value);
  //     console.log('source', source);
  //
  //     if (!source?.length) {
  //       return new Set<ID>();
  //     }
  //
  //     const expandedNodeIds = previous?.value ?? new Set<ID>();
  //
  //     for (const id of expandedNodeIds.values()) {
  //       if (!source.some(node => node.item === id)) {
  //         expandedNodeIds.delete(id);
  //       }
  //     }
  //
  //     console.log('>>> expandedNodeIds', expandedNodeIds);
  //     return expandedNodeIds;
  //   },
  // });

  private readonly _unfilteredNodes = this.computeUnfilteredNodes();
  private readonly _tree = this.computeTree();

  public readonly expandedNodeIds = this._expandedNodes.asReadonly();
  public readonly nodesById = computed(() => this.error() ? new Map<ID, SciTableTreeNode<ID>>() : this._tree.value().nodesById);
  public readonly visibleNodes = this.computeVisibleNodes();
  public readonly childrenIdsByParent = computed(() => this.error() ? new Map<ID | undefined, ID[]>() : this._tree.value().childrenIdsByParent);

  public readonly error = computed(() => this._tree.status() === 'error');
  public readonly loading = computed(() => this._tree.isLoading());
  public readonly nodeIndexById = computed(() => this.visibleNodes().reduce((map, node, index) => map.set(node.item, index), new Map<ID, number>()));
  public readonly visibleNodeCount = computed(() => this.visibleNodes().length);

  constructor(options: {
    sortCriteria: Signal<SciTableSortCriterion[]>;
    columnFilters: Signal<SciTableColumnFilter[]>;
    tableFilter: Signal<string | null>;
    datasource: SciTableDatasource<unknown, ID> | SciTableTreeDatasource<unknown, ID>;
  }) {
    this._datasource = options.datasource;
    this._columnFilters = options.columnFilters;
    this._tableFilter = options.tableFilter;
    this._sortCriteria = options.sortCriteria;

    effect(() => {
      if (this._unfilteredNodes.status() === 'error') {
        return;
      }

      const nodes = this._unfilteredNodes.value();
      if (!nodes) {
        return;
      }
      untracked(() => {
        const expandedNodeIds = new Set(this._expandedNodes());
        for (const id of expandedNodeIds.values()) {
          if (!nodes.some(node => node.item === id)) {
            expandedNodeIds.delete(id);
          }
        }

        this._expandedNodes.set(expandedNodeIds);
      });
    });
  }

  public reload(): void {
    this._unfilteredNodes.reload();
  }

  public reloadFailed(): void {
    if (this._unfilteredNodes.status() === 'error') {
      this._unfilteredNodes.reload();
      return; // Don't force reload on tree, since they will reload either way because they are dependent on unfilteredNodes.
    }

    if (this._tree.status() === 'error') {
      this._tree.reload();
    }
  }

  public expand(id: MaybeArray<ID>): void {
    const ids = Arrays.coerce(id);
    this._expandedNodes.update(toggledRows => new Set([...toggledRows, ...ids]));
  }

  public expandAll(): void {
    this._expandedNodes.set(new Set([...this.nodesById().values()].map(node => node.item)));
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

  private getIds$(request: Partial<SciTableIdsRequest>, options: {injector: Injector}): Observable<SciTableTreeNode<ID>[]> {
    const getIdsRequest: SciTableIdsRequest = {
      columnFilters: request.columnFilters ?? [],
      sortCriteria: request.sortCriteria ?? [],
      tableFilter: request.tableFilter,
    };

    return runInInjectionContext(options.injector, () => Observables.coerce(this._datasource.getIds(getIdsRequest)).pipe(
      map((ids): SciTableTreeNode<ID>[] => {
        if (isTreeDatasource(this._datasource)) {
          return ids as SciTableTreeNode<ID>[];
        }

        return ids.map(id => ({item: id as ID}));
      }),
      catchError(error => {
        console.error(error);
        throw error;
      }),
    ));
  }

  private computeUnfilteredNodes(): ResourceRef<SciTableTreeNode<ID>[] | undefined> {
    // Create separate injection context per resource invocation to clean up allocated resources.
    let injector: DestroyableInjector | undefined;

    return rxResource({
      params: () => this._sortCriteria(),
      stream: ({params: sortCriteria}) => {
        injector?.destroy();
        injector = createDestroyableInjector({parent: this._injector});

        return this.getIds$({sortCriteria}, {injector});
      },
    });
  }

  private computeTree(): ResourceRef<ITree<ID>> {
    // Create separate injection context per resource invocation to clean up allocated resources.
    let injector: DestroyableInjector | undefined;

    return rxResource({
      params: ({chain}) => ({
        columnFilters: this._columnFilters(),
        tableFilter: this._tableFilter() ?? undefined,
        unfilteredNodes: chain(this._unfilteredNodes)!,
      }),
      stream: ({params}) => {
        const {columnFilters, tableFilter, unfilteredNodes} = params;
        injector?.destroy();
        injector = createDestroyableInjector({parent: this._injector});

        const nodes$ = (tableFilter || columnFilters.length) ? this.getIds$({columnFilters, tableFilter}, {injector: injector}) : of(unfilteredNodes);
        return nodes$.pipe(
          includeParentsAndChildren(unfilteredNodes),
          createTree(unfilteredNodes, isArrayDatasource(this._datasource)),
        );
      },
      defaultValue: {nodes: [], nodesById: new Map<ID, SciTableTreeNode<ID>>(), childrenIdsByParent: new Map<ID | undefined, ID[]>()},
    });
  }

  private computeVisibleNodes(): Signal<SciTableTreeNode<ID>[]> {
    return computed(() => {
      if (this.error()) {
        return [];
      }

      const expandedNodes = this._expandedNodes();
      const nodesById = this._tree.value().nodesById;
      const nodes = this._tree.value().nodes;

      const allAncestorsExpanded = (node?: SciTableTreeNode<ID>): boolean => {
        if (node?.parent === undefined) {
          return true;
        }

        if (!expandedNodes.has(node.parent)) {
          return false;
        }

        return allAncestorsExpanded(nodesById.get(node.parent));
      };

      return untracked(() => nodes.filter(allAncestorsExpanded));
    });
  }
}

export interface ITree<ID> {
  nodes: SciTableTreeNode<ID>[];
  nodesById: Map<ID, SciTableTreeNode<ID>>;
  childrenIdsByParent: Map<ID | undefined, ID[]>;
}

function includeParentsAndChildren<ID>(unfilteredNodes: SciTableTreeNode<ID>[]): OperatorFunction<SciTableTreeNode<ID>[], Set<ID>> {
  return map(filteredNodes => {
    const nodesById = new Map(unfilteredNodes.map(node => [node.item, node]));
    const filteredIds = new Set(filteredNodes.map(node => node.item));

    return unfilteredNodes.reduce((acc, node) => {
      const path = findNodePath(nodesById, node);

      // Include the full path (parents and children) of any filtered node.
      // This ensures that all parents and children are displayed, even if they don't match the filter.
      if (path.some(id => filteredIds.has(id))) {
        path.forEach(id => acc.add(id));
      }

      return acc;
    }, new Set<ID>());
  });
}

function createTree<ID>(unfilteredNodes: SciTableTreeNode<ID>[], isArrayDatasource: boolean): OperatorFunction<Set<ID>, ITree<ID>> {
  return map(nodeIds => {
    const sortedNodes = unfilteredNodes.filter(node => nodeIds.has(node.item));
    const nodesById = sortedNodes.reduce((acc, node) => acc.set(node.item, node), new Map<ID, SciTableTreeNode<ID>>());
    const childrenIdsByParent = groupChildrenByParent(sortedNodes);

    // Only place the children in correct order for tree datasource.
    const nodes = isArrayDatasource ? [...nodesById.values()] : flattenTree(nodesById, childrenIdsByParent);

    return ({nodes, nodesById, childrenIdsByParent});
  });
}

function groupChildrenByParent<ID>(nodes: SciTableTreeNode<ID>[]): Map<ID | undefined, ID[]> {
  const childrenIdsByParent = new Map<ID | undefined, ID[]>();

  for (const node of nodes) {
    const values = childrenIdsByParent.get(node.parent) ?? [];
    values.push(node.item);
    childrenIdsByParent.set(node.parent, values);
  }
  return childrenIdsByParent;
}

/**
 * Flattens the tree in depth-first order, placing each parent before its descendants and preserving sibling order.
 * Includes all nodes regardless of expansion state.
 *
 * Example:
 * ```
 * [
 *   {item: '1'},
 *   {item: '1.1', parent: '1'},
 *   {item: '1.2', parent: '1'},
 *   {item: '1.2.1', parent: '1.2'},
 *   {item: '1.3', parent: '1'},
 *   {item: '2'},
 * ]
 * ```
 */
function flattenTree<ID>(nodesById: Map<ID, SciTableTreeNode<ID>>, childrenIdsByParent: Map<ID | undefined, ID[]>): SciTableTreeNode<ID>[] {
  const getChildren = (parentId?: ID): SciTableTreeNode<ID>[] => {
    const children = (childrenIdsByParent.get(parentId) ?? []).flatMap(id => getChildren(id));
    const parent = parentId !== undefined ? nodesById.get(parentId) : undefined;

    if (parent) {
      return [parent, ...children];
    }

    return children;
  };

  return getChildren(undefined);
}
