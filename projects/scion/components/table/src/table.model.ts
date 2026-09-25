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
import {SciTableDataLoaderFn, SciTableSortCriterion} from './table-datasource';
import {MaybeSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {SciToolbarFactory} from '@scion/components/menu';
import {SciTableRowBindingFactoryFn, SciTableRowBindings} from './table-row-binding';
import {SciTableColumnFactoryFn} from './table.factory';

export type SciTableColumnType = 'string' | 'number' | 'boolean' | 'component' | 'template' | 'dynamic';;

export type SciTableRowActionFactoryFn<T> = (toolbar: SciToolbarFactory, item: T, index: number) => void;

export interface SciTableDescriptor<T> {
  datasource: Signal<T[]> | SciTableDatasource<T> | SciPageableTableDatasource<T> | SciHierarchicalTableDatasource<T> | SciPageableHierarchicalTableDatasource<T>;
  /**
   * @docs-private Not public API. For internal use only.
   * @experimental since 22.3.0; API and behavior may change in any version without notice.
   */
  ɵdatasource?: Signal<T[]> | SciTableDataLoaderFn<T>;
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

  filter(text: string | null): void;
}

export interface SciTableCellContext<T, VALUE> {
  item: T;
  value: VALUE;
}

export interface SciTableColumn {
  type: SciTableColumnType;
  name: `column:${string}`;
  header: Signal<string>;
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  width: Signal<string>;
  minWidth: number;
  resizing: WritableSignal<boolean>;
  location: {x: number; width: number};
}

export interface SciStringColumn<T> extends SciTableColumn {
  type: 'string';
  value: (item: T) => MaybeSignal<string>;
  sort: (a: SciTableCellContext<T, string>, b: SciTableCellContext<T, string>) => number;
  filter: (text: string, context: SciTableCellContext<T, string>) => boolean;
}

export interface SciNumberColumn<T> extends SciTableColumn {
  type: 'number';
  value: (item: T) => MaybeSignal<number>;
  sort: (a: SciTableCellContext<T, number>, b: SciTableCellContext<T, number>) => number;
  filter: (text: number, context: SciTableCellContext<T, number>) => boolean;
}

export interface SciBooleanColumn<T> extends SciTableColumn {
  type: 'boolean';
  value: (item: T) => MaybeSignal<boolean>;
  sort: (a: SciTableCellContext<T, boolean>, b: SciTableCellContext<T, boolean>) => number;
  filter: (text: boolean, context: SciTableCellContext<T, boolean>) => boolean;
}

export interface SciComponentColumn<T> extends SciTableColumn {
  type: 'component';
  component: (item: T) => SciComponentDescriptor;
  sort: (a: SciTableCellContext<T, void>, b: SciTableCellContext<T, void>) => number;
  filter: (text: string, context: SciTableCellContext<T, void>) => boolean;
  padding: boolean;
}

export interface SciTemplateColumn<T> extends SciTableColumn {
  type: 'template';
  template: (item: T) => SciTemplateDescriptor;
  sort: (a: SciTableCellContext<T, void>, b: SciTableCellContext<T, void>) => number;
  filter: (text: string, context: SciTableCellContext<T, void>) => boolean;
  padding: boolean;
}

export interface SciDynamicColumn<T> extends SciTableColumn {
  type: 'dynamic';
  value: (item: T) => MaybeSignal<string> | MaybeSignal<number> | MaybeSignal<boolean> | SciComponentDescriptor | SciTemplateDescriptor;
  sort: (a: SciTableCellContext<T, unknown>, b: SciTableCellContext<T, unknown>) => number;
  filter: (text: string, context: SciTableCellContext<T, unknown>) => boolean;
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
  cells?: SciTableCellLike[];
  bindings?: SciTableRowBindings;
  loading: boolean;
  active: Signal<boolean>;
  selected: Signal<boolean>;
  hovered: Signal<boolean>;
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

export class SciTableDatasource<T> {

  constructor(public data: Signal<T[]>) {
  }
}

export class SciHierarchicalTableDatasource<T> {

  constructor(public root: Signal<T[]>, public children: ChildProvider<T>) {
  }
}

export class SciPageableTableDatasource<T> {

  constructor(public data: SciDataLoaderFn<T>) {
  }
}

export class SciPageableHierarchicalTableDatasource<T> {

  constructor(public root: SciDataLoaderFn<T>, public children: PageableChildProvider<T>) {
  }
}

export function provideTableDatasource<T>(data: Signal<T[]>): SciTableDatasource<T> {
  return new SciTableDatasource(data);
}

export function provideHierarchicalTableDatasource<T>(root: Signal<T[]>, children: ChildProvider<T>): SciHierarchicalTableDatasource<T> {
  return new SciHierarchicalTableDatasource(root, children);
}

export function providePageableTableDatasource<T>(loader: SciDataLoaderFn<T>): SciPageableTableDatasource<T> {
  return new SciPageableTableDatasource(loader);
}

export function providePageableHierarchicalTableDatasource<T>(loader: SciDataLoaderFn<T>, children: PageableChildProvider<T>): SciPageableHierarchicalTableDatasource<T> {
  return new SciPageableHierarchicalTableDatasource(loader, children);
}

export interface ChildProvider<T = unknown> {
  getChildren(item: T): T[];
  hasChildren(item: T): boolean;
}

export interface PageableChildProvider<T> {
  getChildren(item: T, request: SciTableRequest): MaybeAsync<SciTableResponse<T>>;
  hasChildren(item: T, request: Pick<SciTableRequest, 'tableFilter' | 'columnFilters'>): MaybeAsync<boolean>;
}

export interface SciPageableTableDatasourceDescriptor<T> {
  getItems(request: SciTableRequest): MaybeAsync<SciTableResponse<T>>;
}

export interface SciPageableTreeDatasourceDescriptor<T> {
  getItems(request: SciTableRequest): MaybeAsync<SciTableResponse<T>>;
}
