/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MaybeAsync} from './common';
import {SciCellContext, TemplateWithContext} from './table.model';
import {MaybeSignal, SciComponentDescriptor} from '@scion/components/common';
import {Translatable} from '@scion/components/text';

export interface SciTableFactory<T> {
  addStringColumn(value: (item: T) => string): this;
  addStringColumn(header: string, value: (item: T) => string): this;
  addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;

  addBooleanColumn(value: (item: T) => boolean): this;
  addBooleanColumn(header: string, value: (item: T) => boolean): this;
  addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;

  addNumberColumn(value: (item: T) => number): this;
  addNumberColumn(header: string, value: (item: T) => number): this;
  addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;

  addComponentColumn(descriptor: SciComponentColumnDescriptor<T>): this;
  addTemplateColumn(descriptor: SciTemplateColumnDescriptor<T>): this;
}

export interface SciColumnDescriptor {
  name?: string;
  header?: MaybeSignal<Translatable>;
  resizable?: boolean;
  /**
   * Preferred column size.
   * Value which can be used inside `grid-template-columns` definition.
   * Examples: `1fr`, `max-content`, `100px`
   */
  width?: MaybeSignal<string>; // TODO [eg]: do we need a signal here, maybe plain value is enough
  /**
   * Min column width in px. Defaults to 100.
   */
  minWidth?: MaybeSignal<number>; // TODO [eg]: do we need a signal here, maybe plain value is enough
  /**
   * Max column width in px.
   */
  maxWidth?: MaybeSignal<number>; // TODO [eg]: do we need a signal here, maybe plain value is enough
}

export interface SciComponentColumnDescriptor<T> extends SciColumnDescriptor {
  component: (item: T) => SciComponentDescriptor;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<T, void>) => boolean) | boolean;
  filterValues?: MaybeAsync<unknown[]>;
}

export interface SciTemplateColumnDescriptor<T> extends SciColumnDescriptor {
  template: (item: T) => MaybeSignal<TemplateWithContext>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, void>, b: SciCellContext<T, void>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<T, void>) => boolean) | boolean;
  filterValues?: MaybeAsync<unknown[]>;
}

export interface SciStringColumnDescriptor<T> extends SciColumnDescriptor {
  value: (item: T) => MaybeSignal<string>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, string>, b: SciCellContext<T, string>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: string, context: SciCellContext<T, string>) => boolean) | boolean;
  filterValues?: MaybeAsync<string[]>;
}

export interface SciNumberColumnDescriptor<T> extends SciColumnDescriptor {
  value: (item: T) => MaybeSignal<number>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, number>, b: SciCellContext<T, number>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: number, context: SciCellContext<T, number>) => boolean) | boolean;
  filterValues?: MaybeAsync<number[]>;
}

export interface SciBooleanColumnDescriptor<T> extends SciColumnDescriptor {
  value: (item: T) => MaybeSignal<boolean>;
  /**
   * Toggle sorting, optionally provide custom sort function. Defaults to default sort based on column type.
   */
  sort?: ((a: SciCellContext<T, boolean>, b: SciCellContext<T, boolean>) => number) | boolean;
  /**
   * Toggle filtering, optionally provide custom filter function. Defaults to default filter based on column type.
   */
  filter?: ((text: boolean, context: SciCellContext<T, boolean>) => boolean) | boolean;
}
export type SciColumnDescriptors<T> = SciStringColumnDescriptor<T> | SciNumberColumnDescriptor<T> | SciBooleanColumnDescriptor<T> | SciComponentColumnDescriptor<T> | SciTemplateColumnDescriptor<T>;
