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

export type ValueType = string | number | boolean | void;

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
  addStringColumn(label: (item: T) => string): this;
  addStringColumn(header: MaybeSignal<string>, label: (item: T) => string): this;
  addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;

  addBooleanColumn(label: (item: T) => boolean): this;
  addBooleanColumn(header: MaybeSignal<string>, label: (item: T) => boolean): this;
  addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;

  addNumberColumn(label: (item: T) => number): this;
  addNumberColumn(header: MaybeSignal<string>, label: (item: T) => number): this;
  addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;

  addComponentColumn(descriptor: SciComponentColumnDescriptor<T>): this;
  // addTemplateColumn(descriptor: SciComponentColumnDescriptor<T>): this;

  trackBy(trackByFn: (record: T, index: number) => unknown): this;
  sortable(sortable: boolean): this;
  filterable(filterable: boolean): this;
  resizable(resizable: boolean): this;
  selectable(selectable: boolean): this;
}

// TODO remove
export interface SciGetItemsPagination {
  start: number;
  end: number;
  pageSize: number;
}

export interface SciTableResponse<T> {
  items: T[];
  totalCount: number;
}

export interface SciTableRequest {
  start: number;
  end: number;
  limit: number;
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

export interface SciCellContext<T, LABEL> {
  item: T;
  label: LABEL;
}

interface SciColumnDescriptor {
  name?: string;
  header?: MaybeSignal<string>;
  resizable?: boolean;
  width?: MaybeSignal<string>;
  minWidth?: MaybeSignal<string>;
  maxWidth?: MaybeSignal<string>;
}

export interface SciComponentColumnDescriptor<T> extends SciColumnDescriptor {
  component: (item: T) => ComponentWithInputs; // Muss im InjectionContext aufgerufen werden
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<T, void>) => boolean) | boolean;
}

export interface SciStringColumnDescriptor<T> extends SciColumnDescriptor {
  label: (item: T) => MaybeSignal<string>; // Muss im InjectionContext aufgerufen werden
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<T, string>) => boolean) | boolean;
}

export interface SciNumberColumnDescriptor<T> extends SciColumnDescriptor {
  label: (item: T) => MaybeSignal<number>; // Muss im InjectionContext aufgerufen werden
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, number>, b: SciCellContext<T, number>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<T, number>) => boolean) | boolean;
}

export interface SciBooleanColumnDescriptor<T> extends SciColumnDescriptor {
  label: (item: T) => MaybeSignal<boolean>; // Muss im InjectionContext aufgerufen werden
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, boolean>, b: SciCellContext<T, boolean>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<T, boolean>) => boolean) | boolean;
}
export type SciColumnDescriptors<T> = SciStringColumnDescriptor<T> | SciNumberColumnDescriptor<T> | SciBooleanColumnDescriptor<T> | SciComponentColumnDescriptor<T>;

export interface SciColumn {
  type: ColumnType;
  name: string;
  header: Signal<string | undefined>;
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  index: Signal<number>;
  width: Signal<string>;
  minWidth: Signal<string | null>;
  maxWidth: Signal<string | null>;
}

export interface SciStringColumn<T> extends SciColumn {
  type: 'string';
  label: (item: T) => MaybeSignal<string>;
  sort: (a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number;
  filter: (text: string, context: SciCellContext<T, string>) => boolean;
}

export interface SciBooleanColumn<T> extends SciColumn {
  type: 'boolean';
  label: (item: T) => MaybeSignal<boolean>;
  sortRows: (rows: SciRow<T>[]) => SciRow<T>[];
  sort: (a: SciCellContext<T, boolean>, b: SciCellContext<T, boolean>) => number;
  filter: (text: string, context: SciCellContext<T, boolean>) => boolean;
}

export interface SciNumberColumn<T> extends SciColumn {
  type: 'number';
  label: (item: T) => MaybeSignal<number>;
  sortRows: (rows: SciRow<T>[]) => SciRow<T>[];
  sort: (a: SciCellContext<T, number>, b: SciCellContext<T, number>) => number;
  filter: (text: string, context: SciCellContext<T, number>) => boolean;
}

export interface SciComponentColumn<T> extends SciColumn {
  type: 'custom';
  component: (item: T) => ComponentWithInputs;
  sort: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number;
  filter: (text: string, context: SciCellContext<T, void>) => boolean;
}
export type SciColumns<T> = SciStringColumn<T> | SciNumberColumn<T> | SciBooleanColumn<T> | SciComponentColumn<T>;

/**
 * Internally used Row Model
 */
export interface SciRow<T> {
  item: T;
  cells: SciCell[];
}

/**
 * Internally used Cell Model
 */
export interface SciBaseCell {
  type: ColumnType;
  columnName: string;
}

export interface SciStringCell extends SciBaseCell {
  type: 'string';
  label: Signal<string>;
}

export interface SciNumberCell extends SciBaseCell {
  type: 'number';
  label: Signal<number>;
}

export interface SciBooleanCell extends SciBaseCell {
  type: 'boolean';
  label: Signal<boolean>;
}

export interface SciComponentCell extends SciBaseCell {
  type: 'custom';
  component: ComponentWithInputs;
}

export type SciCell = SciStringCell | SciNumberCell | SciBooleanCell | SciComponentCell;
