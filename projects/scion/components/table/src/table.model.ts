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
  addStringColumn(label: ((item: T) => string)): this;
  addStringColumn(header: string, label: ((item: T) => string)): this;
  addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;

  addBooleanColumn(label: ((item: T) => boolean)): this;
  addBooleanColumn(header: string, label: ((item: T) => boolean)): this;
  addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;

  addNumberColumn(label: ((item: T) => number)): this;
  addNumberColumn(header: string, label: ((item: T) => number)): this;
  addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;

  addComponentColumn(descriptor: SciComponentColumnDescriptor<T>): this;

  trackBy(trackByFn: (record: T, index: number) => unknown): this;
  sortable(sortable: boolean): this;
  filterable(filterable: boolean): this;
  resizable(resizable: boolean): this;
  selectable(selectable: boolean): this;
}

export interface SciGetItemsPagination {
  start: number;
  end: number;
  pageSize: number;
}

export interface SciGetItemsOptions {
  sortCriteria: {
    columnName: string;
    direction: 'asc' | 'desc';
  }[];
  filterCriteria: {
    columnName: string;
    text: string;
    // maybe more filter params?
  }[];
}

export interface SciCellContext<T, V> {
  item: T;
  label: V;
}

interface SciColumnDescriptor<ITEM> {
  name?: string;
  header?: MaybeSignal<string>;
  resizable?: MaybeSignal<boolean>;
  width?: MaybeSignal<string>;
  minWidth?: MaybeSignal<string>;
  maxWidth?: MaybeSignal<string>;
  label?: (item: ITEM) => MaybeSignal<ValueType>;
  component?: (item: ITEM) => ComponentWithInputs;
}

export interface SciComponentColumnDescriptor<ITEM> extends SciColumnDescriptor<ITEM> {
  component: (item: ITEM) => ComponentWithInputs; // Muss im InjectionContext aufgerufen werden
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<ITEM, void>, b: SciCellContext<ITEM, void>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<ITEM, void>) => boolean) | boolean;
}

export interface SciStringColumnDescriptor<ITEM> extends SciColumnDescriptor<ITEM> {
  label: (item: ITEM) => MaybeSignal<string>; // Muss im InjectionContext aufgerufen werden
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<ITEM, string>, b: SciCellContext<ITEM, string>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<ITEM, string>) => boolean) | boolean;
}

export interface SciNumberColumnDescriptor<ITEM> extends SciColumnDescriptor<ITEM> {
  label: (item: ITEM) => MaybeSignal<number>; // Muss im InjectionContext aufgerufen werden
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<ITEM, number>, b: SciCellContext<ITEM, number>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<ITEM, number>) => boolean) | boolean;
}

export interface SciBooleanColumnDescriptor<ITEM> extends SciColumnDescriptor<ITEM> {
  label: (item: ITEM) => MaybeSignal<boolean>; // Muss im InjectionContext aufgerufen werden
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<ITEM, boolean>, b: SciCellContext<ITEM, boolean>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<ITEM, boolean>) => boolean) | boolean;
}
export type SciColumnDescriptors<T> = SciStringColumnDescriptor<T> | SciNumberColumnDescriptor<T> | SciBooleanColumnDescriptor<T> | SciComponentColumnDescriptor<T>;

export interface SciBaseColumn {
  type: ColumnType;
  name: string;
  header: Signal<string | undefined>;
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  // order: Signal<number>; // Column order
  width: Signal<string>;
  minWidth: Signal<string | null>;
  maxWidth: Signal<string | null>;
}

export interface SciStringColumn<T> extends SciBaseColumn {
  type: 'string';
  label: (record: T) => MaybeSignal<string>;
  sort: (a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number;
  filter: (text: string, context: SciCellContext<T, string>) => boolean;
}

export interface SciBooleanColumn<T> extends SciBaseColumn {
  type: 'boolean';
  label: (record: T) => MaybeSignal<boolean>;
  sort: (a: SciCellContext<T, boolean>, b: SciCellContext<T, boolean>) => number;
  filter: (text: string, context: SciCellContext<T, boolean>) => boolean;
}

export interface SciNumberColumn<T> extends SciBaseColumn {
  type: 'number';
  label: (record: T) => MaybeSignal<number>;
  sort: (a: SciCellContext<T, number>, b: SciCellContext<T, number>) => number;
  filter: (text: string, context: SciCellContext<T, number>) => boolean;
}

export interface SciComponentColumn<T> extends SciBaseColumn {
  type: 'custom';
  component: (record: T) => ComponentWithInputs;
  sort: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number;
  filter: (text: string, context: SciCellContext<T, void>) => boolean;
}
export type SciColumn<T> = SciStringColumn<T> | SciNumberColumn<T> | SciBooleanColumn<T> | SciComponentColumn<T>;

/**
 * Internally used Row Model
 */
export interface SciRow<T> {
  item: T;
  cells: SciCell<ValueType>[];
}

/**
 * Internally used Cell Model
 */
export interface SciCell<V extends ValueType> {
  type: ColumnType;
  columnId: string;
  label?: Signal<V>;
  component?: ComponentWithInputs;
}
