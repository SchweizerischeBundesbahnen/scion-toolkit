/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Signal} from '@angular/core';
import {MaybeSignal} from './common';

export type ValueType = string | number | boolean;
export type ValueAccessorFn<T, V extends ValueType> = (record: T) => V;

export type ColumnType = 'custom' | 'string' | 'number' | 'boolean';

/**
 * Table Model fluent API
 */
export interface SciTable<T> {
  addStringColumn(valueAccessorOrConfig: ValueAccessorFn<T, string> | SciColumnDescriptor<T, string>): this;
  addBooleanColumn(valueAccessorOrConfig: ValueAccessorFn<T, boolean> | SciColumnDescriptor<T, boolean>): this;
  addNumberColumn(valueAccessorOrConfig: ValueAccessorFn<T, number> | SciColumnDescriptor<T, number>): this;
  addColumn(valueAccessorOrConfig: SciColumnDescriptor<T, ValueType>): this;

  trackBy(trackByFn: (record: T, index: number) => unknown): this;
  sortable(sortable: boolean): this;
  filterable(filterable: boolean): this;
  resizable(resizable: boolean): this;
  selectable(selectable: boolean): this;
}

/**
 * Column Config options
 */
export interface SciColumnDescriptor<T, V extends ValueType> {
  label: ValueAccessorFn<T, V>; // | ComponentRef<unknown> / DirectiveWithBindings naming: text / label / displayValue / content
  id?: string;
  header?: MaybeSignal<string>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: V, b: V) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, value: V, row: T) => boolean) | boolean;
  resizable?: MaybeSignal<boolean>;
  width?: MaybeSignal<string>;
  minWidth?: MaybeSignal<string>;
  maxWidth?: MaybeSignal<string>;
}

/**
 * Column Model
 */
export interface SciColumn<T, V extends ValueType> {
  type: ColumnType;
  id: string;

  header: Signal<string | undefined>;
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  order: Signal<number>; // Column order
  width: Signal<string>;
  minWidth: Signal<string | null>;
  maxWidth: Signal<string | null>;

  label: ValueAccessorFn<T, V>;
  sort: (a: V, b: V) => number;
  filter: (text: string, value: V, record: T) => boolean;
}

/**
 * Internally used Row Model
 */
export interface SciRow<T> {
  data: T;
  cells: SciCell<ValueType>[];
}

/**
 * Internally used Cell Model
 */
export interface SciCell<V extends ValueType> {
  type: ColumnType;
  columnId: string;
  label: V;
}
