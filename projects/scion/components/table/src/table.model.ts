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
import {SciDataLoaderFn, SciSortCriterion} from './table-data-source';
import {MaybeSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {SciToolbarFactory} from '@scion/components/menu';
import {MaybeArray} from '@scion/toolkit/types';

export type SciColumnType = 'string' | 'number' | 'boolean' | 'component' | 'template';
export type SciRowActionFactoryFn<T> = (item: T, toolbar: SciToolbarFactory) => void;

export interface SciTableDescriptor<T> {
  data: Signal<T[]> | SciDataLoaderFn<T>;
  /**
   * Name of the table, used to save and restore view to localStorage.
   */
  name: `table:${string}`;
  sortable?: MaybeSignal<boolean>;
  resizable?: MaybeSignal<boolean>;
  filterable?: MaybeSignal<boolean>;
  selectable?: MaybeSignal<false | 'single' | 'multi'>;
  headerVisible?: MaybeSignal<boolean>;
  gridlinesVisible?: MaybeSignal<boolean>;
  sortBy?: Array<`column:${string}` | SciSortCriterion>;
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
  rowActions?: SciRowActionFactoryFn<T>;
  /**
   * Adds name as part attribute to cell element.
   * This can be used to conditionally style the row.
   *
   * Example usage:
   * ```ts
   * table({ data: persons, rowName: person => !person.active ? 'inactive' : [] }, table => ...);
   * ```
   *
   * ```scss
   * sci-table ::part(row\:inactive) {
   *   background-color: rgba(255, 0, 0, 0.2);
   * }
   * ```
   */
  rowState?: (item: T) => MaybeArray<`row:${string}`>;
  /**
   * Amount of items to render before and after the viewport during virtual scrolling. Defaults to 10.
   */
  bufferSize?: MaybeSignal<number>;
  trackBy?: (item: T) => unknown;
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

  filter(text: string | undefined): void;
}

export interface SciCellContext<T, VALUE> {
  item: T;
  value: VALUE;
}

export interface SciColumn {
  type: SciColumnType;
  name: `column:${string}`;
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  header: Signal<string>;
  width: string;
  isFraction: boolean;
  userWidth: number | undefined;
  minWidth: number;
  maxWidth: number | undefined;
}

export interface SciStringColumn<T> extends SciColumn {
  type: 'string';
  value: (item: T) => MaybeSignal<string>;
  sort: (a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number;
  filter: (text: string, context: SciCellContext<T, string>) => boolean;
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
}

export interface SciComponentColumn<T> extends SciColumn {
  type: 'component';
  component: (item: T) => SciComponentDescriptor;
  sort: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number;
  filter: (text: string, context: SciCellContext<T, void>) => boolean;
}

export interface SciTemplateColumn<T> extends SciColumn {
  type: 'template';
  template: (item: T) => SciTemplateDescriptor;
  sort: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number;
  filter: (text: string, context: SciCellContext<T, void>) => boolean;
}

export type SciColumnLike<T> = SciStringColumn<T> | SciNumberColumn<T> | SciBooleanColumn<T> | SciComponentColumn<T> | SciTemplateColumn<T>;

/**
 * Mapped row, used as display state.
 */
export interface SciRow<T> {
  item?: T;
  id?: unknown;
  cells?: SciCellLike[];
}

/**
 * Mapped cell, used as display state.
 */
export interface SciCell {
  type: SciColumnType;
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
  template: SciTemplateDescriptor;
}

export type SciCellLike = SciStringCell | SciNumberCell | SciBooleanCell | SciComponentCell | SciTemplateCell;
