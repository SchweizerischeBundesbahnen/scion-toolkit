/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciTableCellContext} from './table.model';
import {MaybeSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Translatable} from '@scion/components/text';
import {SciDateLike} from './table-date-column.model';

export interface SciTableColumnFactory<T> {

  addStringColumn(header: Translatable, value: (item: T) => string): this;

  addStringColumn(value: (item: T) => string): this;

  addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;

  // TODO [dwie] Move after number column
  addBooleanColumn(header: Translatable, value: (item: T) => boolean): this;

  addBooleanColumn(value: (item: T) => boolean): this;

  addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;

  addNumberColumn(header: Translatable, value: (item: T) => number): this;

  addNumberColumn(value: (item: T) => number): this;

  addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;

  // TODO [dwie] Rename to addTemporalColumn because can be used to display date, time, or date-time
  addDateColumn(header: Translatable, value: (item: T) => SciDateLike): this;

  addDateColumn(value: (item: T) => SciDateLike): this;

  addDateColumn(descriptor: SciDateColumnDescriptor<T>): this;

  addComponentColumn(descriptor: SciComponentColumnDescriptor<T>): this;

  addTemplateColumn(descriptor: SciTemplateColumnDescriptor<T>): this;
}

export interface SciTableColumnDescriptor {
  name?: `column:${string}`;
  header?: Translatable;
  resizable?: boolean;
  /**
   * Preferred column size.
   * Value which can be used inside `grid-template-columns` definition. Defaults to 1fr.
   * Examples: `1fr`, `max-content`, `100px`.
   */
  width?: string;
  /**
   * Min column width in px. Defaults to 100.
   */
  minWidth?: number;
}

export interface SciStringColumnDescriptor<T> extends SciTableColumnDescriptor {
  value: (item: T) => MaybeSignal<string>;
  sortable?: boolean | {comparator: SciTableColumnSortComparatorFn<T, string>};
  filterable?: boolean | {matcher: SciTableColumnFilterMatcherFn<T, string>};
}

export interface SciNumberColumnDescriptor<T> extends SciTableColumnDescriptor {
  value: (item: T) => MaybeSignal<number>;
  sortable?: boolean;
  filterable?: boolean;
}

export interface SciBooleanColumnDescriptor<T> extends SciTableColumnDescriptor {
  value: (item: T) => MaybeSignal<boolean>;
  sortable?: boolean;
  filterable?: boolean;
}

export interface SciDateColumnDescriptor<T> extends SciTableColumnDescriptor {
  /**
   * @return string in ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ), or ISO 8601 Date-only (YYYY-MM-DD), number as milliseconds since UTC epoch, or {@link Date}
   */
  value: (item: T) => MaybeSignal<SciDateLike>;
  sortable?: boolean;
  filterable?: boolean;
  /**
   * The date-time components to include. See Angular {@link DatePipe} for details.
   * https://angular.dev/api/common/DatePipe#pre-defined-format-options
   *
   * Defaults to mediumDate.
   *
   */
  format?: 'shortDate' | 'mediumDate' | 'longDate' | 'fullDate' | 'shortTime' | 'mediumTime' | 'longTime' | 'fullTime' | 'short' | 'medium' | 'long' | 'full' | string;
  /**
   * A locale code for the locale format rules to use.
   *
   * If not specified, uses the value of {@link LOCALE_ID}, which is `en-US` by default.
   */
  locale?: string;
  /**
   * The time zone. A time zone offset from GMT (such as '+0430'). If not specified, uses local system timezone.
   */
  timezone?: string;
}

export interface SciComponentColumnDescriptor<T> extends SciTableColumnDescriptor {
  component: (item: T) => SciComponentDescriptor;
  sortable?: boolean | {comparator: SciTableColumnSortComparatorFn<T, void>};
  filterable?: boolean | {matcher: SciTableColumnFilterMatcherFn<T, void, string>};
  /**
   * Controls whether cell padding is applied. Set to `false` to let content fill the entire cell (render to cell bounds).
   *
   * Defaults to `true`.
   */
  padding?: boolean;
}

export interface SciTemplateColumnDescriptor<T> extends SciTableColumnDescriptor {
  template: (item: T) => SciTemplateDescriptor;
  sortable?: boolean | {comparator: SciTableColumnSortComparatorFn<T, void>};
  filterable?: boolean | {matcher: SciTableColumnFilterMatcherFn<T, void, string>};
  /**
   * Controls whether cell padding is applied. Set to `false` to let content fill the entire cell (render to cell bounds).
   *
   * Defaults to `true`.
   */
  padding?: boolean;
}

/**
 * Represents a {@link SciStringColumnDescriptor}, {@link SciNumberColumnDescriptor}, {@link SciBooleanColumnDescriptor}, {@link SciComponentColumnDescriptor}, or {@link SciTemplateColumnDescriptor}.
 */
export type SciTableColumnDescriptorLike<T> = SciStringColumnDescriptor<T> | SciNumberColumnDescriptor<T> | SciBooleanColumnDescriptor<T> | SciDateColumnDescriptor<T> | SciComponentColumnDescriptor<T> | SciTemplateColumnDescriptor<T>;

/**
 * Signature of a function used to configure a comparator for sorting a table column.
 */
export type SciTableColumnSortComparatorFn<T = unknown, VALUE = unknown> = (a: SciTableCellContext<T, VALUE>, b: SciTableCellContext<T, VALUE>) => number;

/**
 * Signature of a function used to configure a matcher for filtering a table column.
 */
export type SciTableColumnFilterMatcherFn<T = unknown, VALUE = unknown, FILTER = VALUE> = (filter: FILTER, context: SciTableCellContext<T, VALUE>) => boolean;
