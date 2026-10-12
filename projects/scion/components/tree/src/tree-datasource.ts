import {ɵSciTableTreeDatasource, ɵSciAsyncTableTreeDatasource, SciTableDatasourceFactory, SciTableTreeNode} from '@scion/components/table';
import {MaybeAsync} from '@scion/toolkit/types';
import {Signal} from '@angular/core';

export type SciTreeDatasourceFactory<T, ID> = SciTableDatasourceFactory<T, ID>;

export function provideTreeDatasource<T, ID>(root: Signal<T[]>, getChildren: (item: T) => T[] | undefined): SciTreeDatasourceFactory<T, ID> {
  return (columns, trackBy) => new ɵSciTableTreeDatasource(root, {columns, trackBy, getChildren});
}

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
