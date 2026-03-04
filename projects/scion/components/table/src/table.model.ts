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

export interface ComponentWithInputs {
  component: ComponentType<unknown>;
  inputs?: Record<string, unknown>;
  bindings?: Binding[];
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

export interface SciRowContext<T, V> {
  record: T;
  label: V;
}

interface BaseSciColumnDescriptor<T, TLabel = unknown, TValue = TLabel> {
  id?: string;
  header?: MaybeSignal<string>;
  resizable?: MaybeSignal<boolean>;
  width?: MaybeSignal<string>;
  minWidth?: MaybeSignal<string>;
  maxWidth?: MaybeSignal<string>;
  label: (record: T) => MaybeSignal<TLabel>; // Muss im InjectionContext aufgerufen werden
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciRowContext<T, TValue>, b: SciRowContext<T, TValue>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciRowContext<T, TValue>) => boolean) | boolean;
}
export type SciCustomColumnDescriptor<T> = BaseSciColumnDescriptor<T, ComponentWithInputs, undefined>;
export type SciStringColumnDescriptor<T> = BaseSciColumnDescriptor<T, string>;
export type SciNumberColumnDescriptor<T> = BaseSciColumnDescriptor<T, number>;
export type SciBooleanColumnDescriptor<T> = BaseSciColumnDescriptor<T, boolean>;
export type SciColumnDescriptor<T> = SciStringColumnDescriptor<T> | SciNumberColumnDescriptor<T> | SciBooleanColumnDescriptor<T> | SciCustomColumnDescriptor<T>;

export interface SciBaseColumn<T, TLabel = unknown, TValue = TLabel> {
  type: ColumnType;
  id: string;
  header: Signal<string | undefined>;
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  // order: Signal<number>; // Column order
  width: Signal<string>;
  minWidth: Signal<string | null>;
  maxWidth: Signal<string | null>;
  label: (record: T) => MaybeSignal<TLabel>;
  sort: (a: SciRowContext<T, TValue>, b: SciRowContext<T, TValue>) => number;
  filter: (text: string, context: SciRowContext<T, TValue>) => boolean;
}
export type SciStringColumn<T> = SciBaseColumn<T, string>;
export type SciNumberColumn<T> = SciBaseColumn<T, number>;
export type SciBooleanColumn<T> = SciBaseColumn<T, boolean>;
export type SciCustomColumn<T> = SciBaseColumn<T, ComponentWithInputs, undefined>;
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
  label: Signal<V> | Signal<ComponentWithInputs>;
}
