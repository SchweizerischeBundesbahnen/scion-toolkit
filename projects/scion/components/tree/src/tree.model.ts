import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Signal, WritableSignal} from '@angular/core';
import {Translatable} from '@scion/components/text';
import {SciTableRowActionFactoryFn} from '../../table/src/table.model';
import {SciTableDataSourceProvider, SciTableIdsRequest, SciTableRowBindingFactoryFn, SciTableTreeNode} from '@scion/components/table';
import {SciAsyncTableTreeDatasource, SciTableTreeDatasource} from '../../table/src/table-datasource';
import {MaybeAsync} from '../../table/src/common';

export interface SciTreeDescriptor<T, ID> {
  label: (item: T) => string | number | boolean | SciComponentDescriptor | SciTemplateDescriptor;
  datasource: SciTableDataSourceProvider<T, ID>;
  header?: Translatable;
  filterable?: boolean | {matcher: (text: string, context: SciTreeNodeContext<T>) => boolean};
  sortable?: boolean | {comparator: (a: SciTreeNodeContext<T>, b: SciTreeNodeContext<T>) => number};
  selectable?: false | 'single' | 'multi';
  wrapHeader?: boolean;
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
  readonly header: WritableSignal<Translatable | undefined>;
  readonly wrapHeader: WritableSignal<boolean>;
  readonly sortable: WritableSignal<boolean>;
  readonly selectable: WritableSignal<'single' | 'multi' | false>;

  filter(text: string | null): void;

  expand(id: unknown): void;

  collapse(id: unknown): void;

  expandAll(): void;

  collapseAll(): void;
}

export type SciTreeDataSource<T, ID> = SciTableTreeDatasource<T, ID>;
export type SciPageableTreeDataSource<T, ID> = SciAsyncTableTreeDatasource<T, ID>;

export function provideTreeDatasource<T, ID>(root: Signal<T[]>, getChildren: (item: T) => T[]): SciTableDataSourceProvider<T, ID> {
  return (columns, trackBy) => new SciTableTreeDatasource(root, {columns, trackBy, getChildren});
}

export function providePageableTreeDatasource<T, ID>(getIds: (request: SciTableIdsRequest) => MaybeAsync<SciTableTreeNode<ID>[]>, getItems: (ids: ID[]) => MaybeAsync<T[]>): SciTableDataSourceProvider<T, ID> {
  return () => new SciAsyncTableTreeDatasource(getIds, getItems);
}
