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
import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {SciToolbarFactory} from '@scion/components/menu';
import {SciTableRowBindingFn, ɵSciTableRowBindings} from './table-row-binding';
import {SciTableColumnFactoryFn} from './table.factory';
import {SciTableColumnFilterMatcherFn, SciTableColumnSortComparatorFn} from './table-column.factory';
import {SciDateValue} from './table-date-column.model';
import {Translatable} from '@scion/components/text';
import {SciEnumValue} from './table-enum-column.model';

/**
 * Represents supported column types of {@link SciTableComponent}.
 */
export type SciTableColumnType = 'string' | 'number' | 'boolean' | 'date' | 'enum' | 'icon' | 'component' | 'template';

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
  selectable?: 'single' | 'multi' | false;
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
   * @example
   * ```ts
   * import {table} from '@scion/components/table';
   *
   * table({
   *   datasource: data,
   *   columns: table => ...,
   *   rowActions: (toolbar, item) => toolbar.addToolbarButton({
   *     icon: 'delete',
   *     onSelect: () => ...,
   *   }),
   * });
   * ```
   *
   * The function:
   * - Is called per item with a {@link SciToolbarFactory} to contribute actions.
   * - Runs in a reactive context and re-evaluates when tracked signals change.
   * - Can call `inject` to get required dependencies.
   */
  rowActions?: SciTableRowActionFactoryFn<T>;
  /**
   * Configures row bindings for table rows.
   *
   * Row bindings enable associating metadata and icons with a row. Metadata includes CSS shadow parts, CSS classes, and HTML attributes.
   *
   * @example
   * ```ts
   * import {table} from '@scion/components/table';
   *
   * table({
   *   datasource: data,
   *   columns: table => ...,
   *   rowBindings: (bindings, item, index) => bindings
   *     .addIconBinding('mail')
   *     .addPartBinding(index % 2 === 0 ? 'row:even' : 'row:odd')
   *     .addAttributeBinding('data-id', item.id)
   *     .addClassBinding(item.inactive ? 'inactive' : undefined),
   * });
   * ```
   *
   * ```scss
   * sci-table::part(row\:even row\:not\:selected) {
   *   background-color: lightgray;
   * }
   * ```
   *
   * The function:
   * - Is called per item with a {@link SciTableRowBindingFactory} to register bindings.
   * - Runs in a reactive context and re-evaluates when tracked signals change.
   * - Can call `inject` to get required dependencies.
   *
   * @param bindings - Factory providing methods to register row bindings.
   * @param item - Item associated with the row.
   * @param index - Index of the row, zero-based.
   */
  rowBindings?: SciTableRowBindingFn<T>;
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
}

export interface SciTableColumn<T = unknown, VALUE = unknown, FILTER = VALUE> {
  type: SciTableColumnType;
  name: `column:${string}`;
  header: {
    icon: string | undefined;
    label: Signal<string> | undefined;
    tooltip: Signal<string> | undefined;
  };
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  padding: boolean;
  width: Signal<string>;
  minWidth: number;
  resizing: WritableSignal<boolean>;
  location: {x: number; width: number};
  compare: SciTableColumnSortComparatorFn<T, VALUE>;
  matches: SciTableColumnFilterMatcherFn<T, VALUE, FILTER>;
}

export interface SciStringColumn<T = unknown> extends SciTableColumn<T, string> {
  type: 'string';
  value: (item: T) => Signal<string | undefined>;
}

export interface SciNumberColumn<T = unknown> extends SciTableColumn<T, number> {
  type: 'number';
  value: (item: T) => Signal<number | undefined>;
  format: Signal<Intl.NumberFormat>;
}

export interface SciDateColumn<T = unknown> extends SciTableColumn<T, SciDateValue, string> {
  type: 'date';
  value: (item: T) => Signal<SciDateValue | undefined>;
}

export interface SciEnumColumn<T = unknown> extends Omit<SciTableColumn<T, SciEnumValue, SciEnumValueLike[] | string>, 'filterable'> { // `string` for table filter
  type: 'enum';
  value: (item: T) => Signal<SciEnumValue | undefined>;
  filterable: Signal<'single' | 'multi' | false>;
  enumeration: Signal<SciEnumColumnValues>;
  format: {
    icon: boolean;
    label: boolean;
    filter: {
      icon: boolean;
    };
  };
  referenceType: SciTableColumnType | undefined;
}

export interface SciComponentColumn<T = unknown> extends SciTableColumn<T, void, string> {
  type: 'component';
  component: (item: T) => SciComponentDescriptor;
}

export interface SciTemplateColumn<T = unknown> extends SciTableColumn<T, void, string> {
  type: 'template';
  template: (item: T) => SciTemplateDescriptor;
}

export type SciTableColumnLike<T = unknown> = SciStringColumn<T> | SciNumberColumn<T> | SciDateColumn<T> | SciEnumColumn<T> | SciComponentColumn<T> | SciTemplateColumn<T>;

/**
 * Mapped row, used as display state.
 */
export interface SciTableRow<T> {
  index: number;
  item?: T;
  id?: unknown;
  cells?: SciTableCellLike[];
  bindings?: ɵSciTableRowBindings;
  loading: boolean;
  active: Signal<boolean>;
  selected: Signal<boolean>;
  hovered: Signal<boolean>;
}

export interface SciStringCell {
  type: 'string';
  column: SciStringColumn;
  value: Signal<string | undefined>;
}

export interface SciNumberCell {
  type: 'number';
  column: SciNumberColumn;
  value: Signal<number | undefined>;
}

export interface SciDateCell {
  type: 'date';
  column: SciDateColumn;
  value: Signal<SciDateValue | undefined>;
}

export interface SciEnumCell {
  type: 'enum';
  column: SciEnumColumn;
  value: Signal<SciEnumValue | undefined>;
}

export interface SciComponentCell {
  type: 'component';
  column: SciComponentColumn;
  component: SciComponentDescriptor;
}

export interface SciTemplateCell {
  type: 'template';
  column: SciTemplateColumn;
  template: SciTemplateDescriptor;
}

export type SciTableCellLike = SciStringCell | SciNumberCell | SciDateCell | SciEnumCell | SciComponentCell | SciTemplateCell;

export interface SciTableCellContext<T = unknown, VALUE = unknown> {
  item: T;
  value: VALUE;
}

/**
 * Signature of a function to contribute row actions.
 *
 * Called per item with a {@link SciToolbarFactory} to contribute actions.
 *
 * The function:
 * - Runs in a reactive context and re-evaluates when tracked signals change.
 * - Can call `inject` to get required dependencies.
 */
export type SciTableRowActionFactoryFn<T> = (toolbar: SciToolbarFactory, item: T, index: number) => void;

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

/**
 * Represents the header of a table column, defined as a {@link Translatable} or an object with an optional icon, label, and tooltip.
 *
 * The label can be text or a translation key. A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
 * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
 *
 * SCION uses icon providers to render icons. An icon provider can be registered using {@link provideIconProvider}.
 *
 * Defaults to a Material icon provider if the application has not registered an icon provider, interpreting the icon as a Material Icon font ligature.
 * Refer to https://fonts.google.com/icons for available Material icons and instructions on including the Material icon font.
 */
export type SciColumnHeaderLike = Translatable | {icon?: string; label?: Translatable; tooltip?: Translatable};

/**
 * An ISO 8601 date/time string, milliseconds since the UTC epoch, or a {@link Date} object.
 */
export type SciDateLike = string | number | Date;

/**
 * Supported data types for enumeration values used in an enum column.
 */
export type SciEnumValueLike = string | number | boolean;

/**
 * Defines the enumeration entries for an enum column. Enumeration entries are displayed in array order in the column filter.
 *
 * A label can be text or a translation key. A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
 *
 * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
 *
 * SCION uses icon providers to render icons. An icon provider can be registered using {@link provideIconProvider}.
 *
 * Defaults to a Material icon provider if the application has not registered an icon provider, interpreting the icon as a Material Icon font ligature.
 * Refer to https://fonts.google.com/icons for available Material icons and instructions on including the Material icon font.
 */
export type SciEnumColumnValues = {value: SciEnumValueLike; label: Translatable; icon?: string; tooltip?: Translatable | null}[];

/**
 * Defines available icons for an icon column. Icons are displayed in array order in the column filter.
 *
 * A label can be text or a translation key. A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
 *
 * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
 *
 * SCION uses icon providers to render icons. An icon provider can be registered using {@link provideIconProvider}.
 *
 * Defaults to a Material icon provider if the application has not registered an icon provider, interpreting the icon as a Material Icon font ligature.
 * Refer to https://fonts.google.com/icons for available Material icons and instructions on including the Material icon font.
 */
export type SciIconColumnValues = {value: string | number; label: Translatable; icon: string; tooltip?: Translatable | null}[];
