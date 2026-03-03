/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Binding, Signal} from '@angular/core';
import {MaybeSignal} from './common';
import {ComponentType} from '@angular/cdk/portal';

export type ValueType = string | number | boolean | undefined;

export type ColumnType = 'custom' | 'string' | 'number' | 'boolean';

export interface ComponentWithBindings {
  component: ComponentType<unknown>;
  bindings: Binding[];
}

/**
 * Table Model fluent API
 */
export interface SciTable<T> {
  addStringColumn(valueAccessorOrConfig: ((record: T) => string) | SciStringColumnDescriptor<T>): this;
  addBooleanColumn(valueAccessorOrConfig: ((record: T) => boolean) | SciBooleanColumnDescriptor<T>): this;
  addNumberColumn(valueAccessorOrConfig: ((record: T) => number) | SciNumberColumnDescriptor<T>): this;
  addColumn(descriptor: SciCustomColumnDescriptor<T>): this;

  trackBy(trackByFn: (record: T, index: number) => unknown): this;
  sortable(sortable: boolean): this;
  filterable(filterable: boolean): this;
  resizable(resizable: boolean): this;
  selectable(selectable: boolean): this;
}

interface BaseSciColumnDescriptor {
  id?: string;
  header?: MaybeSignal<string>;
  resizable?: MaybeSignal<boolean>;
  width?: MaybeSignal<string>;
  minWidth?: MaybeSignal<string>;
  maxWidth?: MaybeSignal<string>;
}

export interface SciCustomColumnDescriptor<T> extends BaseSciColumnDescriptor {
  label: (record: T) => ComponentWithBindings;
  sort?: ((a: {record: T}, b: {record: T}) => number) | boolean;
  filter?: ((filter: {text: string; record: T}) => boolean) | boolean;
}

/**
 * Column Config options
 */
export interface SciStringColumnDescriptor<T> extends BaseSciColumnDescriptor {
  label: (record: T) => string; // Muss im InjectionContext aufgerufen werden
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: {record: T; label: string}, b: {record: T; label: string}) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((filter: {text: string; label: string; record: T}) => boolean) | boolean;
}

export interface SciNumberColumnDescriptor<T> extends BaseSciColumnDescriptor {
  label: (record: T) => number;
  sort?: ((a: {record: T; label: number}, b: {record: T; label: number}) => number) | boolean;
  filter?: ((filter: {text: string; label: number; record: T}) => boolean) | boolean;
}

export interface SciBooleanColumnDescriptor<T> extends BaseSciColumnDescriptor {
  label: (record: T) => boolean;
  sort?: ((a: {record: T; label: boolean}, b: {record: T; label: boolean}) => number) | boolean;
  filter?: ((filter: {text: string; label: boolean; record: T}) => boolean) | boolean;
}

export type SciColumnDescriptor<T> = SciStringColumnDescriptor<T> | SciNumberColumnDescriptor<T> | SciBooleanColumnDescriptor<T> | SciCustomColumnDescriptor<T>;

interface SciBaseColumn {
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
}

export interface SciStringColumn<T> extends SciBaseColumn {
  label: (record: T) => string;
  sort: (a: {record: T; label: string}, b: {record: T; label: string}) => number;
  filter: (filter: {text: string; record: T; label: string}) => boolean;
}

export interface SciNumberColumn<T> extends SciBaseColumn {
  label: (record: T) => number;
  sort: (a: {record: T; label: number}, b: {record: T; label: number}) => number;
  filter: (filter: {text: string; record: T; label: number}) => boolean;
}

export interface SciBooleanColumn<T> extends SciBaseColumn {
  label: (record: T) => boolean;
  sort: (a: {record: T; label: boolean}, b: {record: T; label: boolean}) => number;
  filter: (filter: {text: string; record: T; label: boolean}) => boolean;
}

export interface SciCustomColumn<T> extends SciBaseColumn {
  label: (record: T) => ComponentWithBindings;
  sort: (a: {record: T}, b: {record: T}) => number;
  filter: (filter: {text: string; record: T}) => boolean;
}

export type SciColumn<T> = SciStringColumn<T> | SciNumberColumn<T> | SciBooleanColumn<T> | SciCustomColumn<T>;

/**
 * Internally used Row Model
 */
export interface SciRow<T> {
  record: T;
  cells: SciCell<ValueType>[];
}

/**
 * Internally used Cell Model
 */
export interface SciCell<V extends ValueType> {
  type: ColumnType;
  columnId: string;
  label: V | ComponentWithBindings;
}
