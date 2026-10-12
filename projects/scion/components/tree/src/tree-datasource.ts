import {ɵSciTableTreeDatasource, ɵSciAsyncTableTreeDatasource, SciTableDatasourceFactory, SciTableTreeNode} from '@scion/components/table';
import {MaybeAsync} from '@scion/toolkit/types';
import {Signal} from '@angular/core';

export type SciTreeDatasourceFactory<T, ID> = SciTableDatasourceFactory<T, ID>;

/**
 * Provides a datasource for a tree.
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
 * @param root - Specifies the roots (top level nodes) of the tree.
 * @param getChildren - Specifies the function to get children based on an item. The function is called during initialization and when the root nodes change for each item in the tree.
 */
export function provideTreeDatasource<T, ID>(root: Signal<T[]>, getChildren: (item: T) => T[] | undefined): SciTreeDatasourceFactory<T, ID> {
  return (columns, trackBy) => new ɵSciTableTreeDatasource(root, {columns, trackBy, getChildren});
}

/**
 * Provides an asynchronous datasource for a tree.
 *
 * An asynchronous datasource creates the provides a way to create large trees without loading all the data upfront.
 * If your whole dataset is small enough to be fetched at once, it is recommended to use {@link provideTreeDatasource}.
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
