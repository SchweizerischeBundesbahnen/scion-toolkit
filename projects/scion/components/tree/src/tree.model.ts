import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Signal, WritableSignal} from '@angular/core';
import {Translatable} from '@scion/components/text';
import {SciTableRowActionFactoryFn} from '../../table/src/table.model';
import {SciTableDataSourceProvider, SciTableIdsRequest, SciTableRowBindingFactoryFn, SciTableTreeNode} from '@scion/components/table';
import {SciAsyncTableTreeDatasource, SciTableTreeDatasource} from '../../table/src/table-datasource';
import {MaybeAsync} from '../../table/src/common';

export interface SciTreeDescriptor<T> {
  label: (item: T) => string | number | boolean | SciComponentDescriptor | SciTemplateDescriptor;
  datasource: SciTableDataSourceProvider<T>;
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
  trackBy?: (item: T) => unknown;
}

export interface SciTreeNodeContext<T> {
  item: T;
  label: unknown;
}

export interface SciTree<T> {
  /**
   * Currently active item.
   */
  readonly activeItem: Signal<T | undefined>;

  /**
   * Selected items.
   */
  readonly selectedItems: Signal<Array<T>>;

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

export type SciTreeDataSource<T> = SciTableTreeDatasource<T>;
export type SciPageableTreeDataSource<T> = SciAsyncTableTreeDatasource<T>;

export function provideTreeDatasource<T>(root: Signal<T[]>, getChildren: (item: T) => T[]): SciTableDataSourceProvider<T> {
  return (columns, trackBy) => new SciTableTreeDatasource(root, {columns, trackBy, getChildren});
}

export function providePageableTreeDatasource<T>(getIds: (request: SciTableIdsRequest) => MaybeAsync<SciTableTreeNode<unknown>[]>, getItems: (ids: unknown[], meta?: {parent?: T}) => MaybeAsync<T[]>): SciTableDataSourceProvider<T> {
  return () => new SciAsyncTableTreeDatasource(getIds, getItems);
}
