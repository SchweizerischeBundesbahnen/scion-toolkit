/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciTableCellContext} from './table.model';
import {MaybeSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Translatable} from '@scion/components/text';

export interface SciTableColumnFactory<T> {

  addStringColumn(header: Translatable, value: (item: T) => string): this;

  addStringColumn(value: (item: T) => string): this;

  addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;

  addBooleanColumn(header: Translatable, value: (item: T) => boolean): this;

  addBooleanColumn(value: (item: T) => boolean): this;

  addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;

  addNumberColumn(header: Translatable, value: (item: T) => number): this;

  addNumberColumn(value: (item: T) => number): this;

  addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;

  addComponentColumn(descriptor: SciComponentColumnDescriptor<T>): this;

  addTemplateColumn(descriptor: SciTemplateColumnDescriptor<T>): this;

  addColumn(value: (item: T) => string | number | boolean | SciComponentDescriptor | SciTemplateDescriptor): this;

  addColumn(label: Translatable, value: (item: T) => string | number | boolean | SciComponentDescriptor | SciTemplateDescriptor): this;

  addColumn(descriptor: SciColumnDescriptor<T>): this;
}

export interface SciTableColumnDescriptor {
  name?: `column:${string}`;
  header?: Translatable;
  resizable?: boolean;
  /**
   * Preferred column size.
   * Value which can be used inside `grid-template-columns` definition. Defaults to 1fr.
   * Examples: `1fr`, `max-content`, `100px`.
   */
  width?: string;
  /**
   * Min column width in px. Defaults to 100.
   */
  minWidth?: number;
}

export interface SciColumnDescriptor<T> extends SciTableColumnDescriptor {
  value: (item: T) => string | number | boolean | SciComponentDescriptor | SciTemplateDescriptor;
  sortable?: boolean | {comparator: (a: SciTableCellContext<T, void | string | number | boolean>, b: SciTableCellContext<T, unknown>) => number};
  filterable?: boolean | {matcher: (text: string, context: SciTableCellContext<T, unknown>) => boolean};
  padding?: (item: T) => boolean;
}

export interface SciStringColumnDescriptor<T> extends SciTableColumnDescriptor {
  value: (item: T) => MaybeSignal<string>;
  sortable?: boolean | {comparator: (a: SciTableCellContext<T, string>, b: SciTableCellContext<T, string>) => number};
  filterable?: boolean | {matcher: (text: string, context: SciTableCellContext<T, string>) => boolean};
}

export interface SciNumberColumnDescriptor<T> extends SciTableColumnDescriptor {
  value: (item: T) => MaybeSignal<number>;
  sortable?: boolean;
  filterable?: boolean;
}

export interface SciBooleanColumnDescriptor<T> extends SciTableColumnDescriptor {
  value: (item: T) => MaybeSignal<boolean>;
  sortable?: boolean;
  filterable?: boolean;
}

export interface SciComponentColumnDescriptor<T> extends SciTableColumnDescriptor {
  component: (item: T) => SciComponentDescriptor;
  sortable?: boolean | {comparator: (a: SciTableCellContext<T, void>, b: SciTableCellContext<T, void>) => number};
  filterable?: boolean | {matcher: (text: string, context: SciTableCellContext<T, void>) => boolean};
  /**
   * Controls whether cell padding is applied. Set to `false` to let content fill the entire cell (render to cell bounds).
   *
   * Defaults to `true`.
   */
  padding?: boolean;
}

export interface SciTemplateColumnDescriptor<T> extends SciTableColumnDescriptor {
  template: (item: T) => SciTemplateDescriptor;
  sortable?: boolean | {comparator: (a: SciTableCellContext<T, void>, b: SciTableCellContext<T, void>) => number};
  filterable?: boolean | {matcher: (text: string, context: SciTableCellContext<T, void>) => boolean};
  /**
   * Controls whether cell padding is applied. Set to `false` to let content fill the entire cell (render to cell bounds).
   *
   * Defaults to `true`.
   */
  padding?: boolean;
}

export type SciTableColumnDescriptorLike<T> = SciStringColumnDescriptor<T> | SciNumberColumnDescriptor<T> | SciBooleanColumnDescriptor<T> | SciComponentColumnDescriptor<T> | SciTemplateColumnDescriptor<T> | SciColumnDescriptor<T>;
