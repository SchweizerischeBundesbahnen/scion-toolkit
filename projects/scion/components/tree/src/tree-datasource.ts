import {ɵSciTableTreeDatasource, ɵSciAsyncTableTreeDatasource, SciTableDatasourceFactory, SciTableTreeNode} from '@scion/components/table';
import {MaybeAsync} from '@scion/toolkit/types';
import {Signal} from '@angular/core';

export type SciTreeDatasourceFactory<T, ID> = SciTableDatasourceFactory<T, ID>;

/**
 * Provides a datasource for a tree.
 *
 * Materializes the entire tree using `getChildren` during initialization and on updates of the root signal or signals read by `getChildren`.
 *
 * @example
 * ```ts
 * const filesystem = signal([
 *   {name: 'Desktop', children: [{name: 'notes.txt'}]},
 *   {name: 'Downloads', children: [{name: 'images', children: [{name: 'pic.jpg'}]}]}
 * ]);
 *
 * this.tree = tree({
 *   provideTreeDatasource(filesystem, item => item.children),
 *   label: item => item.name,
 * });
 * ```
 *
 * @param root - Signal containing the root items of the tree.
 * @param getChildren - Function returning a node's children, or an empty array or `undefined` if the node has no children.
 */
export function provideTreeDatasource<T, ID>(root: Signal<T[]>, getChildren: (item: T) => T[] | undefined): SciTreeDatasourceFactory<T, ID> {
  return (columns, trackBy) => new ɵSciTableTreeDatasource(root, {columns, trackBy, getChildren});
}

/**
 * Provides a datasource for a tree that loads items on demand.
 *
 * Separates loading item IDs from loading the full items, allowing large datasets to be displayed without loading all items upfront.
 * If the entire dataset is available locally, use {@link provideTreeDatasource}.
 *
 * This datasource uses two kinds of request:
 *  1. Initially and each time the filter changes, `getIds` is called with optional filters.
 *  2. `getItems` is then called, with the ids which are needed to be displayed in the viewport.
 *
 * @example
 * ```ts
 * this.tree = tree({
 *   provideAsyncTreeDatasource(request => fetchIds(request), ids => fetchItems(request)),
 *   label: item => item.name,
 *   trackBy: item => item.id,
 * });
 * ```
 *
 * @param getIds - Specifies the function, which loads all matching ids based on optional filters.
 * @param getChildren - Specifies the function, which loads the full objects belonging to the passed ids.
 */
export function provideAsyncTreeDatasource<T, ID>(getIds: (request: SciTreeIdsRequest) => MaybeAsync<SciTableTreeNode<ID>[]>, getItems: (ids: ID[]) => MaybeAsync<T[]>): SciTreeDatasourceFactory<T, ID> {
  return () => new ɵSciAsyncTableTreeDatasource(request => {
    const columnFilter = request.columnFilters[0];
    const filter = [String(columnFilter?.text ?? ''), request.tableFilter ?? ''].filter(Boolean);
    return getIds({filter});
  }, getItems);
}

export interface SciTreeIdsRequest {
  filter: string[];
}
