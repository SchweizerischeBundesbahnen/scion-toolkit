import {computed, Injector, linkedSignal, ResourceRef, runInInjectionContext, Signal, untracked, WritableSignal} from '@angular/core';
import {SciTableColumnFilter, SciTableDatasourceQuery, SciTableSortCriterion, SciTreeTableDatasource, SciTreeTableNode} from './table-datasource';
import {catchError, Observable, of} from 'rxjs';
import {Arrays, Observables} from '@scion/toolkit/util';
import {rxResource} from '@angular/core/rxjs-interop';
import {ɵSingleActiveInjectorFactory} from '@scion/components/common';
import {MaybeArray} from '@scion/toolkit/types';
import {map} from 'rxjs/operators';
import {mapArray} from '@scion/toolkit/operators';

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

  private readonly _datasource: SciTreeTableDatasource<unknown, ID>;
  private readonly _sortCriteria: Signal<SciTableSortCriterion[]>;
  private readonly _columnFilters: Signal<SciTableColumnFilter[]>;
  private readonly _tableFilter: Signal<string | null>;

  private readonly _activeNode = this.computeActiveNode();
  private readonly _selectedNodes = this.computeSelectedNodes();
  private readonly _tree: Signal<ɵSciTree<ID>>;

  public readonly selectedNodes = this._selectedNodes.asReadonly();
  public readonly activeNode = this._activeNode.asReadonly();

  public readonly error = computed(() => this._tree().hasError());
  public readonly loading = computed(() => this._tree().isLoading());
  public readonly nodeById = computed(() => this._tree().nodeById);
  public readonly nodeIndexById = computed(() => this._tree().indexById());
  public readonly visibleNodes = computed(() => this._tree().nodeList.filter(node => node.visible()));

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
    this._tree = this.computeTree();
  }

  public reload(): void {
    untracked(() => this._tree().reload());
  }

  public reloadFailed(): void {
    untracked(() => this._tree().reloadFailed());
  }

  public expand(id: MaybeArray<ID>): void {
    const nodes = untracked(() => this._tree().nodeById);
    Arrays.coerce(id).forEach(id => nodes.get(id)?.expanded.set(true));
  }

  public expandAll(): void {
    const nodes = untracked(() => this._tree().nodeById);
    nodes.forEach(node => node.expanded.set(true));
  }

  public collapse(id: MaybeArray<ID>): void {
    const nodes = untracked(() => this._tree().nodeById);
    Arrays.coerce(id).forEach(id => nodes.get(id)?.expanded.set(false));
  }

  public collapseAll(): void {
    const nodes = untracked(() => this._tree().nodeById);
    nodes.forEach(node => node.expanded.set(false));
  }

  public toggleRow(id: ID): void {
    const node = untracked(() => this._tree().nodeById.get(id));
    if (node) {
      node.expanded.update(expanded => !expanded);
    }
  }

  public setActiveNode(id: ID | undefined): void {
    this._activeNode.set(id);
  }

  public updateSelectedNodes(updateFn: (ids: Set<ID>) => Set<ID>): void {
    this._selectedNodes.update(updateFn);
  }

  public select(ids: MaybeArray<ID>): void {
    const nodes = untracked(() => this._tree().nodeById);

    // Prevent selecting nodes which do not exist.
    const nodeIds = Arrays.coerce(ids).filter(id => nodes.has(id));

    // Expand all nodes before the selected ones.
    // nodeIds.forEach(id => nodes.get(id)?.getPathFromRoot().forEach(node => node.expanded.set(true)));
    nodeIds.forEach(id => nodes.get(id)?.visitParents(node => node.expanded.set(true)));

    // TODO [ask team] Why should the viewport height change?
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

  private computeTree(): Signal<ɵSciTree<ID>> {
    const nodesResource = computeNodes(this._datasource, this._sortCriteria);
    const filteredNodesResource = computeFilteredNodes(this._datasource, this._columnFilters, this._tableFilter);

    return linkedSignal({
      source: () => undefined, // Linked signal to preserve node expansion state across tree updates
      computation: (_source, previous) => {
        let previousTree = previous?.value;
        const nodes = nodesResource.value();

        return untracked(() => {
          const tree: ɵSciTree<ID> = {
            rootNodes: [],
            nodeById: new Map<ID, ɵSciTreeNode<ID>>(),
            indexById: computed(() => tree.visibleNodes().reduce((map, node, index) => map.set(node.id, index), new Map<ID, number>())),
            nodeList: new Array<ɵSciTreeNode<ID>>(),
            visibleNodes: computed(() => tree.nodeList.filter(node => node.visible())),
            expandedNodes: computed(() => new Set(tree.nodeList.filter(node => node.expanded()).map(node => node.id))),
            isLoading: computed(() => nodesResource.isLoading() || filteredNodesResource.isLoading()),
            hasError: computed(() => nodesResource.status() === 'error' || filteredNodesResource.status() === 'error'),
            requiresLevel: false,
            reload: () => nodesResource.reload(),
            reloadFailed: () => {
              if (nodesResource.status() === 'error') {
                nodesResource.reload();
              }
              if (filteredNodesResource.status() === 'error') {
                filteredNodesResource.reload();
              }
            },
          };

          if (tree.hasError()) {
            return tree;
          }

          // Materialize tree.
          console.time('build tree');
          for (const node of nodes) {
            const parentNode: ɵSciTreeNode<ID> | undefined = node.parentId !== undefined ? tree.nodeById.get(node.parentId) ?? createTreeNode(node.parentId, tree) : undefined;
            const treeNode: ɵSciTreeNode<ID> = tree.nodeById.get(node.id) ?? createTreeNode(node.id, tree);
            tree.nodeById.set(treeNode.id, treeNode);

            if (parentNode) {
              parentNode.children.push(treeNode);
              treeNode.parent = parentNode;
              tree.nodeById.set(parentNode.id, parentNode);
              tree.requiresLevel = true;
            }
            else {
              tree.rootNodes.push(treeNode);
            }

            // Preserve expansion state on data change.
            if (previousTree?.expandedNodes().has(treeNode.id)) {
              treeNode.expanded.set(true);
            }
          }
          console.timeEnd('build tree');

          // Compute flat node list.
          console.time('flat list');
          for (const rootNode of tree.rootNodes) {
            rootNode.visitChildren(node => tree.nodeList.push(node), {includeSelf: true});
          }
          console.timeEnd('flat list');

          previousTree = undefined; // free memory
          return tree;
        });

        function createTreeNode(id: ID, tree: ɵSciTree<ID>): ɵSciTreeNode<ID> {
          const treeNode: ɵSciTreeNode<ID> = {
            id,
            children: [],
            visible: computed(() => {
              if (treeNode.parent && !treeNode.parent.visible()) {
                return false;
              }
              if (treeNode.parent && !treeNode.parent.expanded()) {
                return false;
              }
              if (!treeNode.matchesFilter()) {
                return false;
              }
              return true;
            }),
            matchesFilter: computed(() => {
              const filtered = filteredNodesResource.error() ? null : filteredNodesResource.value();
              return !filtered || filtered.has(id) || treeNode.getPathFromRoot().some(node => filtered.has(node.id)) || treeNode.children.some(child => child.matchesFilter());
            }),
            expanded: linkedSignal({
              source: () => filteredNodesResource.error() ? null : filteredNodesResource.value(),
              computation: (filteredNodes, previous): boolean => {
                // Expand node on filter.
                if (filteredNodes) {
                  return true;
                }

                return previous?.value ?? false;
              },
            }),
            level: computed(() => {
              if (!tree.requiresLevel) {
                return undefined;
              }
              return treeNode.parent ? treeNode.parent.level()! + 1 : 0;
            }),
            index: computed(() => tree.indexById().get(id)!),
            getPathFromRoot: () => (treeNode.parent?.getPathFromRoot() ?? []).concat(treeNode),
            visitParents: (visitor, options) => {
              if (options?.includeSelf) {
                visitor(treeNode);
              }
              treeNode.parent?.visitParents(visitor, {includeSelf: true});
            },
            visitChildren: (visitor, options) => {
              if (options?.includeSelf) {
                visitor(treeNode);
              }
              treeNode.children.forEach(child => child.visitChildren(visitor, {includeSelf: true}));
            },
          };
          return treeNode;
        }
      },
    });

    function computeNodes(datasource: SciTreeTableDatasource<unknown, ID>, sortCriteria: Signal<SciTableSortCriterion[]>): ResourceRef<SciTreeTableNode<ID>[]> {
      // Create separate injection context per resource invocation to clean up allocated resources.
      const injectorFactory = new ɵSingleActiveInjectorFactory();

      return rxResource({
        params: () => sortCriteria(),
        stream: ({params: sortCriteria}) => getTreeNodes$(datasource, {sortCriteria}, {injector: injectorFactory.create()}),
        defaultValue: [],
      });
    }

    function computeFilteredNodes(datasource: SciTreeTableDatasource<unknown, ID>, columnFilters: Signal<SciTableColumnFilter[]>, tableFilter: Signal<string | null>): ResourceRef<Set<ID> | null> {
      // Create separate injection context per resource invocation to clean up allocated resources.
      const injectorFactory = new ɵSingleActiveInjectorFactory();

      return rxResource({
        params: () => ({
          columnFilters: columnFilters(),
          tableFilter: tableFilter() ?? undefined,
        }),
        stream: ({params}) => {
          const injector = injectorFactory.create();
          if (params.columnFilters.length === 0 && params.tableFilter === undefined) {
            return of(null);
          }
          return getTreeNodes$(datasource, {columnFilters: params.columnFilters, tableFilter: params.tableFilter}, {injector}).pipe(mapArray(node => node.id), map(nodes => new Set(nodes)));
        },
        defaultValue: null,
      });
    }

    function getTreeNodes$(datasource: SciTreeTableDatasource<unknown, ID>, query: Partial<SciTableDatasourceQuery>, options: {injector: Injector}): Observable<SciTreeTableNode<ID>[]> {
      return runInInjectionContext(options.injector, () => Observables.coerce(datasource.getTreeTableNodes({
        columnFilters: query.columnFilters ?? [],
        sortCriteria: query.sortCriteria ?? [],
        tableFilter: query.tableFilter,
      })).pipe(catchError(error => {
        console.error(error);
        throw error;
      })));
    }
  }

  private computeSelectedNodes(): WritableSignal<Set<ID>> {
    return linkedSignal({
      source: () => this._tree(),
      computation: (tree, previous): Set<ID> => {
        // Wait until resource finished loading before changing the selected nodes.
        if (tree.isLoading()) {
          return previous?.value ?? new Set<ID>();
        }

        const selectedNodeIds = previous?.value ?? new Set<ID>();
        return new Set([...selectedNodeIds].filter(id => tree.nodeById.has(id)));
      },
    });
  }

  private computeActiveNode(): WritableSignal<ID | undefined> {
    return linkedSignal({
      source: () => this._tree(),
      computation: (tree, previous): ID | undefined => {
        // Wait until resource finished loading before changing the active nodes.
        if (tree.isLoading()) {
          return previous?.value;
        }

        return previous?.value !== undefined && tree.nodeById.has(previous.value) ? previous.value : undefined;
      },
    });
  }
}

export interface ɵSciTree<ID> {
  rootNodes: ɵSciTreeNode<ID>[];
  nodeById: Map<ID, ɵSciTreeNode<ID>>;
  nodeList: ɵSciTreeNode<ID>[];
  indexById: Signal<Map<ID, number>>;
  visibleNodes: Signal<ɵSciTreeNode<ID>[]>;
  expandedNodes: Signal<Set<ID>>;
  isLoading: Signal<boolean>;
  hasError: Signal<boolean>;
  reload: () => void;
  reloadFailed: () => void;
  requiresLevel: boolean;
}

export interface ɵSciTreeNode<ID> {
  id: ID;
  parent?: ɵSciTreeNode<ID>;
  getPathFromRoot: () => ɵSciTreeNode<ID>[];
  visitParents: (visitor: (node: ɵSciTreeNode<ID>) => void, options?: {includeSelf?: true}) => void;
  visitChildren: (visitor: (node: ɵSciTreeNode<ID>) => void, options?: {includeSelf?: true}) => void;
  children: ɵSciTreeNode<ID>[];
  visible: Signal<boolean>;
  matchesFilter: Signal<boolean>;
  expanded: WritableSignal<boolean>;
  index: Signal<number>;
  level: Signal<number | undefined>;
}

// interface MySignal<T> {
//   (): T;
//
//   set(value: T): void;
// }
//
// export function computedPrimitive<T>(computation: () => T): MySignal<T> {
//   return signalPrimitive(computation());
// }
//
// function signalPrimitive<T>(value: T): MySignal<T> {
//   const fun = (): T => {
//     return value;
//   }
//   fun['set'] = (v: T): void => {
//     value = v;
//   }
//   return fun;
// }

// function signalPrimitive<T>(value: T): MySignal<T> {
//   const fun = (): T => {
//     return value;
//   }
//   fun['set'] = (v: T): void => {
//     value = v;
//   }
//   return fun;
// }
