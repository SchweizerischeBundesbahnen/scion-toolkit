/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciBooleanColumnDescriptor, SciColumnDescriptor, SciColumnValueType, SciComponentColumnDescriptor, SciNumberColumnDescriptor, SciStringColumnDescriptor, SciTableColumnDescriptorLike, SciTableColumnFactory, SciTemplateColumnDescriptor} from './table-column.factory';
import {SciBooleanColumn, SciComponentColumn, SciDynamicColumn, SciNumberColumn, SciStringColumn, SciTableColumn, SciTableColumnLike, SciTemplateColumn} from './table.model';
import {computed, signal} from '@angular/core';
import {ɵSciTable} from './ɵtable.model';
import {coerceSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';

export class ɵSciTableColumnFactory<T, ID> implements SciTableColumnFactory<T> {

  public readonly columns = new Array<SciTableColumnLike<T>>();

  constructor(private readonly _table: ɵSciTable<T, ID>) {
  }

  public addStringColumn(value: (item: T) => string): this;
  public addStringColumn(header: string, value: (item: T) => string): this;
  public addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;
  public addStringColumn(descriptorLike: ((item: T) => string) | string | SciStringColumnDescriptor<T>, value?: (item: T) => string): this {
    const descriptor = coerceColumnDescriptor(descriptorLike, value);
    const column = this.mapToColumn(descriptor);
    const sortable = descriptor.sortable ?? true;
    const filterable = descriptor.filterable ?? true;

    this.columns.push({
      ...column,
      type: 'string',
      value: descriptor.value,
      sortable: computed(() => this._table.sortable() && !!sortable),
      filterable: computed(() => this._table.filterable() && !!filterable),
      compare: typeof sortable === 'object' ? sortable.comparator : (a, b) => a.value.localeCompare(b.value),
      matches: typeof filterable === 'object' ? filterable.matcher : (text, context) => context.value.toLowerCase().includes(text.toLowerCase()),
    } satisfies SciStringColumn<T>);

    return this;
  }

  public addNumberColumn(value: (item: T) => number): this;
  public addNumberColumn(header: string, value: (item: T) => number): this;
  public addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;
  public addNumberColumn(descriptorLike: ((item: T) => number) | string | SciNumberColumnDescriptor<T>, value?: (item: T) => number): this {
    const descriptor = coerceColumnDescriptor(descriptorLike, value);
    const column = this.mapToColumn(descriptor);

    this.columns.push({
      ...column,
      type: 'number',
      value: descriptor.value,
      sortable: computed(() => this._table.sortable() && (descriptor.sortable ?? true)),
      filterable: computed(() => this._table.filterable() && (descriptor.filterable ?? true)),
      compare: (a, b) => a.value - b.value,
      matches: (text, context) => context.value === text,
    } satisfies SciNumberColumn<T>);

    return this;
  }

  public addBooleanColumn(value: (item: T) => boolean): this;
  public addBooleanColumn(header: string, value: (item: T) => boolean): this;
  public addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;
  public addBooleanColumn(descriptorLike: ((item: T) => boolean) | string | SciBooleanColumnDescriptor<T>, value?: (item: T) => boolean): this {
    const descriptor = coerceColumnDescriptor(descriptorLike, value);
    const column = this.mapToColumn(descriptor);

    this.columns.push({
      ...column,
      type: 'boolean',
      value: descriptor.value,
      sortable: computed(() => this._table.sortable() && (descriptor.sortable ?? true)),
      filterable: computed(() => this._table.filterable() && (descriptor.filterable ?? true)),
      compare: (a, b) => a.value === b.value ? 0 : (a.value ? 1 : -1),
      matches: (text, context) => context.value === text,
    } satisfies SciBooleanColumn<T>);

    return this;
  }

  public addComponentColumn(descriptor: SciComponentColumnDescriptor<T>): this {
    // Require a filter matcher if filterable on an array datasource.
    if (this._table.isArrayDatasource() && descriptor.filterable === true) {
      throw Error('[ColumnDefinitionError] Component column requires a filter matcher in order to be filterable.');
    }

    // Require a sort comparator if sortable on an array datasource.
    if (this._table.isArrayDatasource() && descriptor.sortable === true) {
      throw Error('[ColumnDefinitionError] Component column requires a sort comparator in order to be sortable.');
    }

    const column = this.mapToColumn(descriptor);
    this.columns.push({
      ...column,
      type: 'component',
      component: descriptor.component,
      sortable: computed(() => this._table.sortable() && !!descriptor.sortable),
      filterable: computed(() => this._table.filterable() && !!descriptor.filterable),
      compare: typeof descriptor.sortable === 'object' ? descriptor.sortable.comparator : () => 0,
      matches: typeof descriptor.filterable === 'object' ? descriptor.filterable.matcher : () => true,
      padding: descriptor.padding ?? true,
    } satisfies SciComponentColumn<T>);

    return this;
  }

  public addTemplateColumn(descriptor: SciTemplateColumnDescriptor<T>): this {
    // Require a filter matcher if filterable on an array datasource.
    if (this._table.isArrayDatasource() && descriptor.filterable === true) {
      throw Error('[ColumnDefinitionError] Template column requires a filter matcher in order to be filterable.');
    }

    // Require a sort comparator if sortable on an array datasource.
    if (this._table.isArrayDatasource() && descriptor.sortable === true) {
      throw Error('[ColumnDefinitionError] Template column requires a sort comparator in order to be sortable.');
    }

    const column = this.mapToColumn(descriptor);
    this.columns.push({
      ...column,
      type: 'template',
      template: descriptor.template,
      sortable: computed(() => this._table.sortable() && !!descriptor.sortable),
      filterable: computed(() => this._table.filterable() && !!descriptor.filterable),
      compare: typeof descriptor.sortable === 'object' ? descriptor.sortable.comparator : () => 0,
      matches: typeof descriptor.filterable === 'object' ? descriptor.filterable.matcher : () => true,
      padding: descriptor.padding ?? true,
    } satisfies SciTemplateColumn<T>);

    return this;
  }

  public addColumn(value: (item: T) => SciColumnValueType): this;
  public addColumn(label: string, value: (item: T) => SciColumnValueType): this;
  public addColumn(descriptor: SciColumnDescriptor<T>): this;
  public addColumn(descriptorLike: ((item: T) => SciColumnValueType) | string | SciColumnDescriptor<T>, value?: (item: T) => string | number | boolean | SciComponentDescriptor | SciTemplateDescriptor): this {
    const descriptor = coerceColumnDescriptor(descriptorLike, value);
    const column = this.mapToColumn(descriptor);
    const sortable = descriptor.sortable ?? true;
    const filterable = descriptor.filterable ?? true;

    this.columns.push({
      ...column,
      type: 'dynamic',
      value: descriptor.value,
      sortable: computed(() => this._table.sortable() && !!descriptor.sortable),
      filterable: computed(() => this._table.filterable() && !!descriptor.filterable),
      compare: typeof sortable === 'object' ? sortable.comparator : (a, b) => String(a.value).localeCompare(String(b.value)),
      matches: typeof filterable === 'object' ? filterable.matcher : (text, context) => context.value === text,
      padding: descriptor.padding ?? (() => true),
    } satisfies SciDynamicColumn<T>);

    return this;
  }

  /**
   * Maps given column descriptor to a {@link SciTableColumn}.
   */
  private mapToColumn(descriptor: SciTableColumnDescriptorLike<T>): Omit<SciTableColumn, 'type' | 'sortable' | 'filterable' | 'compare' | 'matches'> {
    // Require a unique column name.
    const name = descriptor.name ?? `column:${this.columns.length}`;
    if (this.columns.find(column => column.name === name)) {
      throw Error(`[ColumnDefinitionError] Column names must be unique. "${name}" is defined more than once.`);
    }

    // Disallow a filter matcher if using a custom datasource.
    if (!this._table.isArrayDatasource() && typeof descriptor.filterable === 'object') {
      throw Error('[ColumnDefinitionError] Configuring a filter matcher is not supported for tables using a datasource. Filtering must be done by the datasource.');
    }

    // Disallow a sort comparator if using a custom datasource.
    if (!this._table.isArrayDatasource() && typeof descriptor.sortable === 'object') {
      throw Error('[ColumnDefinitionError] Configuring a sort comparator is not supported for tables using a datasource. Sorting must be done by the datasource.');
    }

    const isHierarchical = this._table.isTreeDatasource();
    const isFirst = this.columns.length === 0;
    const showExpansionControl = isHierarchical && (descriptor.showExpansionControl ?? isFirst);
    if (showExpansionControl) {
      // A later explicitly selected column replaces the default (or previously selected) column.
      this.columns.forEach(column => column.showExpansionControl = false);
    }

    return {
      name: name,
      header: coerceSignal(descriptor.header ?? ''),
      resizable: computed(() => this._table.resizable() && (descriptor.resizable ?? true)),
      width: computed(() => {
        const userSettings = this._table.userSettings().columns?.find(column => column.name === name);
        return userSettings?.width ? `${userSettings.width}px` : descriptor.width ?? '1fr';
      }),
      minWidth: descriptor.minWidth ?? 100,
      resizing: signal(false),
      showExpansionControl,
      location: {x: 0, width: 0}, // set in `SciTableColumnComponent`
    };
  }
}

/**
 * Coerces given column factory arguments to a {@link SciTableColumnDescriptorLike}.
 */
function coerceColumnDescriptor<T>(descriptorLike: ((item: T) => SciColumnValueType) | string | SciColumnDescriptor<T>, value?: (item: T) => SciColumnValueType): SciColumnDescriptor<T>;
function coerceColumnDescriptor<T>(descriptorLike: ((item: T) => string) | string | SciStringColumnDescriptor<T>, value?: (item: T) => string): SciStringColumnDescriptor<T>;
function coerceColumnDescriptor<T>(descriptorLike: ((item: T) => number) | string | SciNumberColumnDescriptor<T>, value?: (item: T) => number): SciNumberColumnDescriptor<T>;
function coerceColumnDescriptor<T>(descriptorLike: ((item: T) => boolean) | string | SciBooleanColumnDescriptor<T>, value?: (item: T) => boolean): SciBooleanColumnDescriptor<T>;
function coerceColumnDescriptor(argument1: unknown, argument2?: unknown): unknown {
  switch (typeof argument1) {
    case 'string':
      return {header: argument1, value: argument2};
    case 'function':
      return {value: argument1};
    default:
      return argument1;
  }
}
