import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Signal, WritableSignal} from '@angular/core';
import {SciTableRowActionFactoryFn} from '../../table/src/table.model';
import {SciTableDataSourceProvider, SciTableRowBindingFactoryFn, SciTableTreeNode} from '@scion/components/table';
import {SciAsyncTableTreeDatasource, SciTableTreeDatasource} from '../../table/src/table-datasource';
import {MaybeAsync} from '../../table/src/common';
import {MaybeArray} from '@scion/toolkit/types';

export interface SciTreeDescriptor<T, ID> {
  label: (item: T) => string | number | boolean | SciComponentDescriptor | SciTemplateDescriptor;
  datasource: SciTableDataSourceProvider<T, ID>;
  filterable?: boolean | {matcher: (text: string, context: SciTreeNodeContext<T>) => boolean};
  selectable?: false | 'single' | 'multi';
  initialSort?: 'asc' | 'desc';
  nodeActions?: SciTableRowActionFactoryFn<T>;
  nodeBindings?: SciTableRowBindingFactoryFn<T>;
  /**
   * Amount of items to render before and after the viewport during virtual scrolling. Defaults to 10.
   */
  bufferSize?: number;
  pageSize?: number;
  trackBy?: (item: T) => ID;
}

export interface SciTreeNodeContext<T> {
  item: T;
  label: unknown;
}

export interface SciTree<ID> {
  /**
   * Currently active item.
   */
  readonly activeItem: Signal<ID | undefined>;

  /**
   * Selected items.
   */
  readonly selectedItems: Signal<Array<ID>>;

  readonly filterable: WritableSignal<boolean>;
  readonly selectable: WritableSignal<'single' | 'multi' | false>;

  filter(text: string | null): void;

  select(id: MaybeArray<ID>): void;

  expand(id: ID): void;

  collapse(id: ID): void;

  expandAll(): void;

  collapseAll(): void;
}

export type SciTreeDataSource<T, ID> = SciTableTreeDatasource<T, ID>;
export type SciPageableTreeDataSource<T, ID> = SciAsyncTableTreeDatasource<T, ID>;

export function provideTreeDatasource<T, ID>(root: Signal<T[]>, getChildren: (item: T) => T[]): SciTableDataSourceProvider<T, ID> {
  return (columns, trackBy) => new SciTableTreeDatasource(root, {columns, trackBy, getChildren});
}

export function provideAsyncTreeDatasource<T, ID>(getIds: (request: SciTreeIdsRequest) => MaybeAsync<SciTableTreeNode<ID>[]>, getItems: (ids: ID[]) => MaybeAsync<T[]>): SciTableDataSourceProvider<T, ID> {
  return () => new SciAsyncTableTreeDatasource(request => {
    const columnFilter = request.columnFilters.find(columnFilter => columnFilter.columnName === 'column:tree');
    const filter = [columnFilter?.text ? String(columnFilter?.text) : '', request.tableFilter ?? ''].filter(Boolean);
    return getIds({filter});
  }, getItems);
}

export interface SciTreeIdsRequest {
  filter: string[];
}
