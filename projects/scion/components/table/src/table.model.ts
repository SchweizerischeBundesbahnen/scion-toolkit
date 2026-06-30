/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Signal, TemplateRef} from '@angular/core';
import {MaybeAsync, MaybeSignal} from './common';
import {SciFilterCriterion, SciSortCriterion} from './table-data-source';
import {SciComponentDescriptor} from '@scion/components/common';

export type ColumnType = 'component' | 'template' | 'string' | 'number' | 'boolean';

export interface SciTable<T, ID = T> {
  readonly columns: SciColumns<T>[];
  readonly name?: string;
  readonly filterable: boolean;
  readonly selectable: boolean;
  readonly resizable: boolean;
  readonly sortable: boolean;

  /**
   * Active sort criteria, one criterion per column.
   */
  readonly sortCriteria: Signal<SciSortCriterion[]>;

  /**
   * Active filter criteria, one criterion per column.
   */
  readonly filterCriteria: Signal<SciFilterCriterion[]>;

  /**
   * Currently active (focused) item id.
   */
  readonly activeItem: Signal<ID | undefined>;

  /**
   * Selected item ids.
   */
  readonly selectedItems: Signal<Set<ID>>;

  sort(columnName: string, multi: boolean): void;
  resetSort(): void;
  filter(columnName: string, text: string | number | boolean | null): void;
  resetFilter(): void;
}

export interface SciCellContext<T, VALUE> {
  item: T;
  value: VALUE;
}

export interface TemplateWithContext {
  template: TemplateRef<unknown>;
  context?: {[key: string]: unknown};
}

export interface SciColumn<T> {
  type: ColumnType;
  name: string;
  named: boolean;
  index: number;
  sortable: boolean;
  filterable: boolean;
  resizable: boolean;
  header: Signal<string | undefined>;
  width: Signal<string>;
  minWidth: Signal<string>;
  maxWidth: Signal<string | null>;
  part?: (item: T) => string | null;
}

export interface SciStringColumn<T> extends SciColumn<T> {
  type: 'string';
  value: (item: T) => MaybeSignal<string>;
  sort: (a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number;
  filter: (text: string, context: SciCellContext<T, string>) => boolean;
  filterValues?: MaybeAsync<string[]>;
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
  filterValues?: MaybeAsync<number[]>;
}

export interface SciComponentColumn<T> extends SciColumn<T> {
  type: 'component';
  component: (item: T) => SciComponentDescriptor;
  sort: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number;
  filter: (text: string, context: SciCellContext<T, void>) => boolean;
  filterValues?: MaybeAsync<unknown[]>;
}

export interface SciTemplateColumn<T> extends SciColumn<T> {
  type: 'template';
  template: (item: T) => MaybeSignal<TemplateWithContext>;
  sort: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number;
  filter: (text: string, context: SciCellContext<T, void>) => boolean;
  filterValues?: MaybeAsync<unknown[]>;
}

export type SciColumns<T> = SciStringColumn<T> | SciNumberColumn<T> | SciBooleanColumn<T> | SciComponentColumn<T> | SciTemplateColumn<T>;

/**
 * Mapped row, used as display state.
 */
export interface SciRow<T, ID = T> {
  item?: T;
  id?: ID;
  cells?: SciCells[];
}

/**
 * Mapped cell, used as display state.
 */
export interface SciCell {
  type: ColumnType;
  columnName: string;
  part: string | null;
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
  component: SciComponentDescriptor;
}

export interface SciTemplateCell extends SciCell {
  type: 'template';
  template: Signal<TemplateWithContext>;
}

export type SciCells = SciStringCell | SciNumberCell | SciBooleanCell | SciComponentCell | SciTemplateCell;
