/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Signal, WritableSignal} from '@angular/core';
import {SciDataLoaderFn, SciSortCriterion} from './table-data-source';
import {MaybeSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {SciToolbarFactory} from '@scion/components/menu';
import {SciRowBindings, SciTableRowBinding} from './table-row-binding';

export type SciColumnType = 'string' | 'number' | 'boolean' | 'component' | 'template';
export type SciRowActionFactoryFn<T> = (item: T, toolbar: SciToolbarFactory) => void;

export interface SciTableDescriptor<T> {
  data: Signal<T[]> | SciDataLoaderFn<T>; // TODO [egob] consider renaming to datasource
  sortable?: boolean;
  resizable?: boolean;
  filterable?: boolean;
  selectable?: false | 'single' | 'multi';
  showHeader?: boolean;
  /**
   * Defaults to false.
   */
  wrapHeader?: boolean;
  // TODO [egob] Consider renaming to initialSortOrder
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
  rowBindings?: SciTableRowBinding<T>[];
  /**
   * Amount of items to render before and after the viewport during virtual scrolling. Defaults to 10.
   */
  bufferSize?: number;
  pageSize?: number;
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

  readonly filterable: WritableSignal<boolean>;
  readonly showHeader: WritableSignal<boolean>;
  readonly wrapHeader: WritableSignal<boolean>;
  readonly sortable: WritableSignal<boolean>;
  readonly resizable: WritableSignal<boolean>;
  readonly selectable: WritableSignal<'single' | 'multi' | false>;

  filter(text: string | null): void;
}

export interface SciCellContext<T, VALUE> {
  item: T;
  value: VALUE;
}

export interface SciColumn {
  type: SciColumnType;
  name: `column:${string}`;
  label: Signal<string>;
  sortable: Signal<boolean>;
  filterable: Signal<boolean>;
  resizable: Signal<boolean>;
  padding: boolean;
  width: Signal<string>;
  minWidth: number;
  resizing: WritableSignal<boolean>;
  location: {x: number; width: number};
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

export type SciColumnLike<T = unknown> = SciStringColumn<T> | SciNumberColumn<T> | SciBooleanColumn<T> | SciComponentColumn<T> | SciTemplateColumn<T>;

/**
 * Mapped row, used as display state.
 */
export interface SciRow<T> {
  index: number;
  item?: T;
  id?: unknown;
  cells?: SciCellLike[];
  bindings?: SciRowBindings;
}

export interface SciStringCell {
  type: 'string';
  column: SciColumnLike;
  value: Signal<string>;
}

export interface SciNumberCell {
  type: 'number';
  column: SciColumnLike;
  value: Signal<number>;
}

export interface SciBooleanCell {
  type: 'boolean';
  column: SciColumnLike;
  value: Signal<boolean>;
}

export interface SciComponentCell {
  type: 'component';
  column: SciColumnLike;
  component: SciComponentDescriptor;
}

export interface SciTemplateCell {
  type: 'template';
  column: SciColumnLike;
  template: SciTemplateDescriptor;
}

export type SciCellLike = SciStringCell | SciNumberCell | SciBooleanCell | SciComponentCell | SciTemplateCell;
