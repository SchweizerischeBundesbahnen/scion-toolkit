import {ChildProvider, PageableChildProvider, SciHierarchicalTableDatasource, SciPageableHierarchicalTableDatasource, SciTableDataLoaderFn, SciTableRowActionFactoryFn, SciTableRowBindingFactoryFn} from '@scion/components/table';
import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Signal, WritableSignal} from '@angular/core';
import {Translatable} from '@scion/components/text';

export interface SciTreeDescriptor<T> {
  label: (item: T) => string | number | boolean | SciComponentDescriptor | SciTemplateDescriptor;
  datasource: SciTreeDataSource<T> | SciPageableTreeDataSource<T>;
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

export type SciTreeDataSource<T> = SciHierarchicalTableDatasource<T>;
export type SciPageableTreeDataSource<T> = SciPageableHierarchicalTableDatasource<T>;

export function provideTreeDatasource<T>(root: Signal<T[]>, children: ChildProvider<T>): SciTreeDataSource<T> {
  return new SciHierarchicalTableDatasource(root, children);
}

export function providePageableTreeDatasource<T>(loader: SciTableDataLoaderFn<T>, children: PageableChildProvider<T>): SciPageableTreeDataSource<T> {
  return new SciPageableHierarchicalTableDatasource(loader, children);
}
