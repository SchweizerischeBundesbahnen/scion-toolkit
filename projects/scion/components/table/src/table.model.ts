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
import {MaybeAsync} from './common';
import {SciDataLoaderFn, SciFilterCriterion, SciSortCriterion} from './table-data-source';
import {MaybeSignal, SciComponentDescriptor} from '@scion/components/common';
import {SciToolbarFactory} from '@scion/components/menu';
import {SciTableStorage} from './table-storage';

export type ColumnType = 'component' | 'template' | 'string' | 'number' | 'boolean';
export type SelectionType = 'single' | 'multi' | 'disabled';
export type RowActionFn<T> = (item: T, toolbar: SciToolbarFactory) => void;

export interface SciTableDescriptor<T, ID> {
  data: Signal<T[]> | SciDataLoaderFn<T>;
  /**
   * Size of row items in px. Defaults to 30px.
   */
  itemSize?: MaybeSignal<number>;
  /**
   * Amount of items to render before and after the viewport during virtual scrolling. Defaults to 10.
   */
  overscan?: MaybeSignal<number>;
  /**
   * Name of the table, used to save and restore view to localStorage.
   */
  name?: MaybeSignal<string>;
  sortable?: MaybeSignal<boolean>;
  filterable?: MaybeSignal<boolean>;
  resizable?: MaybeSignal<boolean>;
  showHeader?: MaybeSignal<boolean>;
  selectionType?: MaybeSignal<'single' | 'multi' | 'disabled'>;
  /**
   * Row actions shown at the end of a row.
   *
   * Example usage:
   * ```ts
   * table({
   *   data: persons,
   *   rowActions: (person, toolbar) => {
   *     toolbar.addToolbarButton({
   *       icon: 'delete',
   *       onSelect: () => this.delete(person),
   *     });
   *   }
   * });
   * ```
   *
   */
  rowActions?: RowActionFn<T>;
  tableStorage?: SciTableStorage;
  identity?: (item: T) => ID;
  /**
   * Adds name as part attribute to cell element.
   * This can be used to conditionally style the row.
   *
   * Example usage:
   * ```ts
   * table({ data: persons, rowName: person => !person.active ? 'inactive' : null }, table => ...);
   * ```
   *
   * ```scss
   * sci-table ::part(inactive) {
   *   background-color: rgba(255, 0, 0, 0.2);
   * }
   * ```
   */
  rowName?: (item: T) => string | string[] | undefined;
}

export interface SciTable<T, ID = T> {
  readonly columns: Signal<SciColumnLike<T>[]>;
  readonly name: Signal<string | undefined>;
  readonly sortable: Signal<boolean>;
  readonly filterable: Signal<boolean>;
  readonly resizable: Signal<boolean>;
  readonly selectionType: Signal<SelectionType>;
  readonly identity?: (item: T) => ID;

  readonly rowActions?: RowActionFn<T>;

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
  readonly focusedItem: Signal<ID | undefined>;

  /**
   * Selected item ids.
   */
  readonly selectedItems: Signal<Set<ID>>;

  /**
   * True if all items are selected.
   */
  readonly allSelected: Signal<boolean>;

  sort(columnName: string, multi: boolean): void;
  resetSort(): void;
  filter(columnName: string, text: string | number | boolean | null): void;
  resetFilter(): void;
  dispose(): void;
}

export interface SciCellContext<T, VALUE> {
  item: T;
  value: VALUE;
}

export interface TemplateWithContext {
  template: TemplateRef<unknown>;
  context?: {[key: string]: unknown};
}

export interface SciColumn {
  type: ColumnType;
  name: string;
  named: boolean;
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  header: Signal<string>;
  width: Signal<string>;
  minWidth: Signal<number>;
  maxWidth: Signal<number | undefined>;
}

export interface SciStringColumn<T> extends SciColumn {
  type: 'string';
  value: (item: T) => MaybeSignal<string>;
  sort: (a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number;
  filter: (text: string, context: SciCellContext<T, string>) => boolean;
  filterValues?: MaybeAsync<string[]>;
}

export interface SciBooleanColumn<T> extends SciColumn {
  type: 'boolean';
  value: (item: T) => MaybeSignal<boolean>;
  sort: (a: SciCellContext<T, boolean>, b: SciCellContext<T, boolean>) => number;
  filter: (text: boolean, context: SciCellContext<T, boolean>) => boolean;
}

export interface SciNumberColumn<T> extends SciColumn {
  type: 'number';
  value: (item: T) => MaybeSignal<number>;
  sort: (a: SciCellContext<T, number>, b: SciCellContext<T, number>) => number;
  filter: (text: number, context: SciCellContext<T, number>) => boolean;
  // TODO [eg]: remove filter values for now
  filterValues?: MaybeAsync<number[]>;
}

export interface SciComponentColumn<T> extends SciColumn {
  type: 'component';
  component: (item: T) => SciComponentDescriptor;
  sort: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number;
  filter: (text: string, context: SciCellContext<T, void>) => boolean;
  filterValues?: MaybeAsync<unknown[]>;
}

export interface SciTemplateColumn<T> extends SciColumn {
  type: 'template';
  template: (item: T) => MaybeSignal<TemplateWithContext>;
  sort: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number;
  filter: (text: string, context: SciCellContext<T, void>) => boolean;
  filterValues?: MaybeAsync<unknown[]>;
}

export type SciColumnLike<T> = SciStringColumn<T> | SciNumberColumn<T> | SciBooleanColumn<T> | SciComponentColumn<T> | SciTemplateColumn<T>;

/**
 * Mapped row, used as display state.
 */
export interface SciRow<T, ID = T> {
  item?: T;
  id?: ID;
  cells?: SciCellLike[];
}

/**
 * Mapped cell, used as display state.
 */
export interface SciCell {
  type: ColumnType;
  columnName: string;
  name: string[];
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

export type SciCellLike = SciStringCell | SciNumberCell | SciBooleanCell | SciComponentCell | SciTemplateCell;
