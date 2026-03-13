/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Binding, Signal, TemplateRef} from '@angular/core';
import {MaybeSignal} from './common';
import {ComponentType} from '@angular/cdk/portal';
import {SciDataSource} from './table-data-source';

export type ColumnType = 'component' | 'template' | 'string' | 'number' | 'boolean';

export interface SciTable<T> {
  dataSource: SciDataSource<T> | SciDataSource<SciRow<T>>;
  columns: SciColumns<T>[];
  trackBy: (item: T, index: number) => unknown;
  name?: string;
  itemSize: number;
  filterable: Signal<boolean>;
  selectable: Signal<boolean>;
  resizable: Signal<boolean>;
  sortable: Signal<boolean>;
  rowPart?: (item: T) => string;
}

export interface SciCellContext<T, VALUE> {
  item: T;
  value: VALUE;
}

export interface ComponentWithBindings {
  component: ComponentType<unknown>;
  bindings?: Binding[];
}

export interface TemplateWithContext {
  template: TemplateRef<unknown>;
  context?: {[key: string]: unknown};
}

export interface SciColumn<T> {
  type: ColumnType;
  name: string;
  header: Signal<string | undefined>;
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  index: Signal<number>;
  width: Signal<string>;
  minWidth: Signal<string>;
  maxWidth: Signal<string | null>;
  part?: (item: T) => string;
}

export interface SciStringColumn<T> extends SciColumn<T> {
  type: 'string';
  value: (item: T) => MaybeSignal<string>;
  sort: (a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number;
  filter: (text: string, context: SciCellContext<T, string>) => boolean;
}

export interface SciBooleanColumn<T> extends SciColumn<T> {
  type: 'boolean';
  value: (item: T) => MaybeSignal<boolean>;
  sortRows: (rows: SciRow<T>[]) => SciRow<T>[];
  sort: (a: SciCellContext<T, boolean>, b: SciCellContext<T, boolean>) => number;
  filter: (text: boolean, context: SciCellContext<T, boolean>) => boolean;
}

export interface SciNumberColumn<T> extends SciColumn<T> {
  type: 'number';
  value: (item: T) => MaybeSignal<number>;
  sortRows: (rows: SciRow<T>[]) => SciRow<T>[];
  sort: (a: SciCellContext<T, number>, b: SciCellContext<T, number>) => number;
  filter: (text: number, context: SciCellContext<T, number>) => boolean;
}

export interface SciComponentColumn<T> extends SciColumn<T> {
  type: 'component';
  component: (item: T) => ComponentWithBindings;
  sort: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number;
  filter: (text: string, context: SciCellContext<T, void>) => boolean;
}

export interface SciTemplateColumn<T> extends SciColumn<T> {
  type: 'template';
  template: (item: T) => MaybeSignal<TemplateWithContext>;
  sort: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number;
  filter: (text: string, context: SciCellContext<T, void>) => boolean;
}

export type SciColumns<T> = SciStringColumn<T> | SciNumberColumn<T> | SciBooleanColumn<T> | SciComponentColumn<T> | SciTemplateColumn<T>;

/**
 * Mapped row, used as display state.
 */
export interface SciRow<T> {
  item: T;
  cells: SciCells[];
}

/**
 * Mapped cell, used as display state.
 */
export interface SciCell {
  type: ColumnType;
  columnName: string;
  part: string;
}

export interface SciStringCell extends SciCell {
  type: 'string';
  value: Signal<string>;
}

export interface SciNumberCell extends SciCell {
  type: 'number';
  value: Signal<number>;
}

export interface SciBooleanCell extends SciCell {
  type: 'boolean';
  value: Signal<boolean>;
}

export interface SciComponentCell extends SciCell {
  type: 'component';
  component: ComponentWithBindings;
}

export interface SciTemplateCell extends SciCell {
  type: 'template';
  template: Signal<TemplateWithContext>;
}

export type SciCells = SciStringCell | SciNumberCell | SciBooleanCell | SciComponentCell | SciTemplateCell;
