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

export type SciTableColumnType = 'string' | 'number' | 'boolean' | 'component' | 'template';

export type SciTableRowActionFactoryFn<T> = (toolbar: SciToolbarFactory, item: T, index: number) => void;

export interface SciTableDescriptor<T> {
  datasource: Signal<T[]>;
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
  padding: boolean;
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
}

export interface SciTemplateColumn<T> extends SciTableColumn {
  type: 'template';
  template: (item: T) => SciTemplateDescriptor;
  sort: (a: SciTableCellContext<T, void>, b: SciTableCellContext<T, void>) => number;
  filter: (text: string, context: SciTableCellContext<T, void>) => boolean;
}

export type SciTableColumnLike<T = unknown> = SciStringColumn<T> | SciNumberColumn<T> | SciBooleanColumn<T> | SciComponentColumn<T> | SciTemplateColumn<T>;

/**
 * Mapped row, used as display state.
 */
export interface SciTableRow<T> {
  index: number;
  item?: T;
  id?: unknown;
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
}

export interface SciNumberCell {
  type: 'number';
  column: SciTableColumnLike;
  value: Signal<number>;
}

export interface SciBooleanCell {
  type: 'boolean';
  column: SciTableColumnLike;
  value: Signal<boolean>;
}

export interface SciComponentCell {
  type: 'component';
  column: SciTableColumnLike;
  component: SciComponentDescriptor;
}

export interface SciTemplateCell {
  type: 'template';
  column: SciTableColumnLike;
  template: SciTemplateDescriptor;
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
