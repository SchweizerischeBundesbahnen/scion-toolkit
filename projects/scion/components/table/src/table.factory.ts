/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciCellContext} from './table.model';
import {MaybeSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Translatable} from '@scion/components/text';

export interface SciTableFactory<T> {
  addStringColumn(value: (item: T) => string): this;
  addStringColumn(header: Translatable, value: (item: T) => string): this;
  addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;

  addBooleanColumn(value: (item: T) => boolean): this;
  addBooleanColumn(header: Translatable, value: (item: T) => boolean): this;
  addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;

  addNumberColumn(value: (item: T) => number): this;
  addNumberColumn(header: Translatable, value: (item: T) => number): this;
  addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;

  addComponentColumn(descriptor: SciComponentColumnDescriptor<T>): this;
  addTemplateColumn(descriptor: SciTemplateColumnDescriptor<T>): this;
}

export interface SciColumnDescriptor {
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
  /**
   * Max column width in px.
   */
  maxWidth?: number;
}

export interface SciComponentColumnDescriptor<T> extends SciColumnDescriptor {
  component: (item: T) => SciComponentDescriptor;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sortable?: boolean | {comparator: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number};
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filterable?: boolean | {matcher: (text: string, context: SciCellContext<T, void>) => boolean};
}

export interface SciTemplateColumnDescriptor<T> extends SciColumnDescriptor {
  template: (item: T) => SciTemplateDescriptor;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sortable?: boolean | {comparator: (a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number};
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filterable?: boolean | {matcher: (text: string, context: SciCellContext<T, void>) => boolean};
}

export interface SciStringColumnDescriptor<T> extends SciColumnDescriptor {
  value: (item: T) => MaybeSignal<string>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sortable?: boolean | {comparator: (a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number};
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filterable?: boolean | {matcher: (text: string, context: SciCellContext<T, string>) => boolean};
}

export interface SciNumberColumnDescriptor<T> extends SciColumnDescriptor {
  value: (item: T) => MaybeSignal<number>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sortable?: boolean | {comparator: (a: SciCellContext<T, number>, b: SciCellContext<T, number>) => number};
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filterable?: boolean | {matcher: (text: string, context: SciCellContext<T, number>) => boolean};
}

export interface SciBooleanColumnDescriptor<T> extends SciColumnDescriptor {
  value: (item: T) => MaybeSignal<boolean>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sortable?: boolean | {comparator: (a: SciCellContext<T, boolean>, b: SciCellContext<T, boolean>) => number};
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filterable?: boolean | {matcher: (text: string, context: SciCellContext<T, boolean>) => boolean};

  // TODO: Label Provider umsetzen
  labelProvider?: (value: boolean) => Translatable;
}
export type SciColumnDescriptors<T> = SciStringColumnDescriptor<T> | SciNumberColumnDescriptor<T> | SciBooleanColumnDescriptor<T> | SciComponentColumnDescriptor<T> | SciTemplateColumnDescriptor<T>;
