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
import {SciDataLoaderFn, SciSortCriterion, SciTableRequest, SciTableResponse} from './table-data-source';
import {MaybeSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {SciToolbarFactory} from '@scion/components/menu';
import {SciRowBindings, SciTableRowBinding} from './table-row-binding';
import {MaybeAsync} from './common';

export type SciColumnType = 'string' | 'number' | 'boolean' | 'component' | 'template';
export type SciRowActionFactoryFn<T> = (item: T, toolbar: SciToolbarFactory) => void;

export interface SciTableDescriptor<T> {
  // datasource: Signal<T[]> | SciTableDatasource<T> | SciTreeDatasource | SciPageableTableDatasource<T> | SciPageableTreeDatasource;
  // datasource: Signal<T[]> | SciTableDatasource<T> | SciPageableTableDatasource<T>;
  data: Signal<T[]> | SciDataLoaderFn<T>;
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

/**
 * Mapped cell, used as display state.
 */
export interface SciCell {
  type: SciColumnType;
  columnName: `column:${string}`;
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

export class SciTableDatasource<T> {

  constructor(public data: Signal<T[]>) {
  }
}

export class SciTreeDatasource {
}

export class SciPageableTableDatasource<T> {

}

export class SciPageableTreeDatasource {
}

export function provideTableDatasource<T>(data: Signal<T[]>): SciTableDatasource<T> {
  return new SciTableDatasource<T>(data);
}

export function provideTreeDatasource(data: Signal<unknown[]>, children: ChildProvider): SciTreeDatasource {
  return new SciTreeDatasource();
}

export function providePageableTableDatasource<T>(descriptor: SciPageableTableDatasourceDescriptor<T>): SciPageableTableDatasource<T> {
  return new SciPageableTableDatasource();
}

export function providePageableTreeDatasource(descriptor: SciPageableTreeDatasourceDescriptor): SciPageableTreeDatasource {
  return new SciPageableTreeDatasource();
}

interface ChildProvider {
  getChildren(item: unknown): MaybeAsync<unknown[]>;

  hasChildren(item: unknown): MaybeAsync<boolean>;
}

export interface SciPageableTableDatasourceDescriptor<T> {
  getItems(request: SciTableRequest): MaybeAsync<SciTableResponse<T>>;
}

interface SciPageableTreeDatasourceDescriptor {
  getItems(request: SciTableRequest): MaybeAsync<SciTableResponse<unknown>>;

  getChildren(item: unknown, request: SciTableRequest): MaybeAsync<SciTableResponse<unknown>>;

  hasChildren(item: unknown): MaybeAsync<boolean>;
}
