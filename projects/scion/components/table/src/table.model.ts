/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Injector, Signal, WritableSignal} from '@angular/core';
import {SciTableDataLoaderFn, SciTablePageRequest, SciTablePageResponse, SciTableSortCriterion} from './table-datasource';
import {MaybeSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {SciToolbarFactory} from '@scion/components/menu';
import {SciTableRowBindingFactoryFn, SciTableRowBindings} from './table-row-binding';
import {SciTableColumnFactoryFn} from './table.factory';
import {MaybeAsync} from './common';
import {SciTableColumnFilterMatcherFn, SciTableColumnSortComparatorFn} from './table-column.factory';
import {arrayDatasource} from './ɵtable-array-datasource';
import {map} from 'rxjs/operators';
import {toObservable} from '@angular/core/rxjs-interop';

export type SciTableColumnType = 'string' | 'number' | 'boolean' | 'component' | 'template' | 'dynamic';

export type SciTableRowActionFactoryFn<T> = (toolbar: SciToolbarFactory, item: T, index: number) => void;

export interface SciTableDescriptor<T> {
  datasource: Signal<T[]>;
  /**
   * @docs-private Not public API. For internal use only.
   * @experimental since 22.3.0; API and behavior may change in any version without notice.
   */
  ɵdatasource?: Signal<T[]> | SciTableDataSourceProvider<T>;
  columns: SciTableColumnFactoryFn<T>;
  sortable?: boolean;
  resizable?: boolean;
  filterable?: boolean;
  selectable?: false | 'single' | 'multi';
  showHeader?: boolean;
  /**
   * Defaults to false.
   */
  wrapHeader?: boolean;
  /**
   * @internal Not Public API yet
   *
   * TODO [dwi] Consider renaming to initialSortOrder
   */
  sortBy?: Array<`column:${string}` | SciTableSortCriterion>;
  /**
   * Configures actions to show when hovering over a row.
   *
   * Example usage:
   * ```ts
   * table({
   *   datasource: data,
   *   rowActions: (toolbar, item) => toolbar.addToolbarButton({
   *     icon: 'delete',
   *     onSelect: () => ...,
   *   }),
   *   columns: table => ...,
   * });
   * ```
   */
  rowActions?: SciTableRowActionFactoryFn<T>;
  /**
   * Adds bindings to a table row, enabling custom styling, HTML attributes, and CSS classes.
   *
   * Example usage:
   * ```ts
   * table({
   *   datasource: data,
   *   rowBindings: (bindings, item, index) => bindings
   *     .addPartBinding(index % 2 === 0 ? 'row:even' : 'row:odd')
   *     .addAttributeBinding('data-id', item.id)
   *     .addClassBinding(item.inactive ? 'inactive' : undefined),
   *   columns: table => ...,
   * });
   * ```
   *
   * ```scss
   * sci-table::part(row\:even) {
   *   background-color: lightgray;
   * }
   * ```
   */
  rowBindings?: SciTableRowBindingFactoryFn<T>;
  /**
   * Specifies the number of items to render before and after the viewport. Defaults to 10.
   */
  bufferSize?: number;
  /**
   * Specifies the number of items to load per page. Defaults to 50.
   */
  pageSize?: number;
  trackBy?: (item: T) => unknown;
  injector?: Injector;
}

export interface SciTable<T> {
  /**
   * Currently active item.
   */
  readonly activeItem: Signal<T | undefined>;

  /**
   * Selected items.
   */
  readonly selectedItems: Signal<Array<T>>;

  readonly filterable: WritableSignal<boolean>;
  readonly showHeader: WritableSignal<boolean>;
  readonly wrapHeader: WritableSignal<boolean>;
  readonly sortable: WritableSignal<boolean>;
  readonly resizable: WritableSignal<boolean>;
  readonly selectable: WritableSignal<'single' | 'multi' | false>;

  /**
   * Filters items cross-column, ignoring {@link SciTableDescriptor.filterable} and {@link SciTableColumnDescriptor.filterable} settings.
   */
  filter(text: string | null): void;

  expand(id: unknown): void;

  collapse(id: unknown): void;

  expandAll(): void;

  collapseAll(): void;
}

export interface SciTableCellContext<T = unknown, VALUE = unknown> {
  item: T;
  value: VALUE;
}

export interface SciTableColumn<T = unknown, VALUE = unknown, FILTER = VALUE> {
  type: SciTableColumnType;
  name: `column:${string}`;
  showExpansionControl: boolean;
  header: Signal<string>;
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  width: Signal<string>;
  minWidth: number;
  resizing: WritableSignal<boolean>;
  location: {x: number; width: number};
  compare: SciTableColumnSortComparatorFn<T, VALUE>;
  matches: SciTableColumnFilterMatcherFn<T, VALUE, FILTER>;
}

export interface SciStringColumn<T> extends SciTableColumn<T, string> {
  type: 'string';
  value: (item: T) => MaybeSignal<string>;
  compare: SciTableColumnSortComparatorFn<T, string>;
  matches: SciTableColumnFilterMatcherFn<T, string>;
}

export interface SciNumberColumn<T> extends SciTableColumn<T, number> {
  type: 'number';
  value: (item: T) => MaybeSignal<number>;
  compare: SciTableColumnSortComparatorFn<T, number>;
  matches: SciTableColumnFilterMatcherFn<T, number>;
}

export interface SciBooleanColumn<T> extends SciTableColumn<T, boolean> {
  type: 'boolean';
  value: (item: T) => MaybeSignal<boolean>;
  compare: SciTableColumnSortComparatorFn<T, boolean>;
  matches: SciTableColumnFilterMatcherFn<T, boolean>;
}

export interface SciComponentColumn<T> extends SciTableColumn<T, void, string> {
  type: 'component';
  component: (item: T) => SciComponentDescriptor;
  compare: SciTableColumnSortComparatorFn<T, void>;
  matches: SciTableColumnFilterMatcherFn<T, void, string>;
  padding: boolean;
}

export interface SciTemplateColumn<T> extends SciTableColumn<T, void, string> {
  type: 'template';
  template: (item: T) => SciTemplateDescriptor;
  compare: SciTableColumnSortComparatorFn<T, void>;
  matches: SciTableColumnFilterMatcherFn<T, void, string>;
  padding: boolean;
}

export interface SciDynamicColumn<T> extends SciTableColumn<T, unknown, string> {
  type: 'dynamic';
  value: (item: T) => MaybeSignal<string> | MaybeSignal<number> | MaybeSignal<boolean> | SciComponentDescriptor | SciTemplateDescriptor;
  compare: SciTableColumnSortComparatorFn<T>;
  matches: SciTableColumnFilterMatcherFn<T, unknown, string>;
  padding: (item: T) => boolean;
}

export type SciTableColumnLike<T = unknown> = SciStringColumn<T> | SciNumberColumn<T> | SciBooleanColumn<T> | SciComponentColumn<T> | SciTemplateColumn<T> | SciDynamicColumn<T>;

/**
 * Mapped row, used as display state.
 */
export interface SciTableRow<T> {
  index: number;
  item?: T;
  id?: unknown;
  level: number;
  parentId?: unknown;
  cells?: SciTableCellLike[];
  bindings?: SciTableRowBindings;
  loading: boolean;
  active: Signal<boolean>;
  selected: Signal<boolean>;
  hovered: Signal<boolean>;
  expanded: Signal<boolean>;
  hasChildren: Signal<boolean>;
}

export interface SciStringCell {
  type: 'string';
  column: SciTableColumnLike;
  value: Signal<string>;
  padding: boolean;
}

export interface SciNumberCell {
  type: 'number';
  column: SciTableColumnLike;
  value: Signal<number>;
  padding: boolean;
}

export interface SciBooleanCell {
  type: 'boolean';
  column: SciTableColumnLike;
  value: Signal<boolean>;
  padding: boolean;
}

export interface SciComponentCell {
  type: 'component';
  column: SciTableColumnLike;
  component: SciComponentDescriptor;
  padding: boolean;
}

export interface SciTemplateCell {
  type: 'template';
  column: SciTableColumnLike;
  template: SciTemplateDescriptor;
  padding: boolean;
}

export type SciTableCellLike = SciStringCell | SciNumberCell | SciBooleanCell | SciComponentCell | SciTemplateCell;

/**
 * Represents an event emitted by {@link SciTableComponent}.
 */
export interface SciTableEvent<T> {
  /**
   * The native browser event (`MouseEvent` or `KeyboardEvent`) that triggered the action.
   */
  sourceEvent: MouseEvent | KeyboardEvent;
  /**
   * The items associated with the action.
   */
  items: T[];
}

export type SciTableDataSourceProvider<T> = (columns: Signal<SciTableColumnLike<T>[]>) => SciTableDataSource<T>;

export interface SciTableDataSource<T> {
  load: SciTableDataLoaderFn<T>;
  hasChildren?(item: T, request: Pick<SciTablePageRequest, 'tableFilter' | 'columnFilters'>): MaybeAsync<boolean>;
  loadChildren?(item: T, request: SciTablePageRequest): MaybeAsync<SciTablePageResponse<T>>;
}

export class SciTableArrayDatasource<T> implements SciTableDataSource<T> {
  public load: SciTableDataLoaderFn<T>;

  constructor(data: Signal<T[]>, columns: Signal<SciTableColumnLike<T>[]>) {
    this.load = arrayDatasource(data, columns);
  }
}

export class SciHierarchicalTableDatasource<T> implements SciTableDataSource<T> {
  public load: SciTableDataLoaderFn<T>;
  public hasChildren: (item: T, request: Pick<SciTablePageRequest, 'tableFilter' | 'columnFilters'>) => MaybeAsync<boolean>;
  public loadChildren: (item: T, request: SciTablePageRequest) => MaybeAsync<SciTablePageResponse<T>>;

  constructor(root: Signal<T[]>, columns: Signal<SciTableColumnLike<T>[]>, public children: ChildProvider<T>) {
    this.load = arrayDatasource(root, columns);
    const root$ = toObservable(root);
    this.hasChildren = this.children.hasChildren;
    this.loadChildren = (item, request) => {
      // Fetch children again as soon as data source changes.
      return root$.pipe(
        map(() => children.getChildren(item)),
        map(children => ({
          items: children.slice(request.start, request.end),
          totalCount: children.length,
        })),
      );
    };
  }
}

export class SciPageableTableDatasource<T> implements SciTableDataSource<T> {

  constructor(public load: SciTableDataLoaderFn<T>) {
  }
}

export class SciPageableHierarchicalTableDatasource<T> implements SciTableDataSource<T> {
  public hasChildren: (item: T, request: Pick<SciTablePageRequest, 'tableFilter' | 'columnFilters'>) => MaybeAsync<boolean>;
  public loadChildren: (item: T, request: SciTablePageRequest) => MaybeAsync<SciTablePageResponse<T>>;

  constructor(public load: SciTableDataLoaderFn<T>, public children: PageableChildProvider<T>) {
    this.hasChildren = children.hasChildren;
    this.loadChildren = children.getChildren;
  }
}

export function provideTableDatasource<T>(data: Signal<T[]>): SciTableDataSourceProvider<T> {
  return columns => new SciTableArrayDatasource(data, columns);
}

export function provideHierarchicalTableDatasource<T>(root: Signal<T[]>, children: ChildProvider<T>): SciTableDataSourceProvider<T> {
  return columns => new SciHierarchicalTableDatasource(root, columns, children);
}

export function providePageableTableDatasource<T>(loader: SciTableDataLoaderFn<T>): SciTableDataSourceProvider<T> {
  return () => new SciPageableTableDatasource(loader);
}

export function providePageableHierarchicalTableDatasource<T>(loader: SciTableDataLoaderFn<T>, children: PageableChildProvider<T>): SciTableDataSourceProvider<T> {
  return () => new SciPageableHierarchicalTableDatasource(loader, children);
}

export interface ChildProvider<T = unknown> {
  getChildren(item: T): T[];
  hasChildren(item: T): boolean;
}

export interface PageableChildProvider<T> {
  getChildren(item: T, request: SciTablePageRequest): MaybeAsync<SciTablePageResponse<T>>;
  hasChildren(item: T, request: Pick<SciTablePageRequest, 'tableFilter' | 'columnFilters'>): MaybeAsync<boolean>;
}

export interface SciPageableTableDatasourceDescriptor<T> {
  getItems(request: SciTablePageRequest): MaybeAsync<SciTablePageResponse<T>>;
}

export interface SciPageableTreeDatasourceDescriptor<T> {
  getItems(request: SciTablePageRequest): MaybeAsync<SciTablePageResponse<T>>;
}
