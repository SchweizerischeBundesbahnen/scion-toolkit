/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciBooleanColumnDescriptor, SciTableColumnDescriptorLike, SciComponentColumnDescriptor, SciNumberColumnDescriptor, SciStringColumnDescriptor, SciTableColumnFactory, SciTemplateColumnDescriptor} from './table-column.factory';
import {SciTableColumnType, SciTableDescriptor} from './table.model';
import {isSignal} from '@angular/core';

export class ɵSciTableColumnFactory<T> implements SciTableColumnFactory<T> {

  public readonly columns = new Array<SciTableColumnDescriptorLike<T> & {type: SciTableColumnType}>();

  constructor(private readonly _descriptor: SciTableDescriptor<T>) {
  }

  public addBooleanColumn(value: (item: T) => boolean): this;
  public addBooleanColumn(header: string, value: (item: T) => boolean): this;
  public addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;
  public addBooleanColumn(valueHeaderDescriptor: ((item: T) => boolean) | string | SciBooleanColumnDescriptor<T>, value?: (item: T) => boolean): this {
    return this.addColumn('boolean', valueHeaderDescriptor, value);
  }

  public addStringColumn(value: (item: T) => string): this;
  public addStringColumn(header: string, value: (item: T) => string): this;
  public addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;
  public addStringColumn(valueHeaderDescriptor: ((item: T) => string) | string | SciStringColumnDescriptor<T>, value?: (item: T) => string): this {
    return this.addColumn('string', valueHeaderDescriptor, value);
  }

  public addNumberColumn(value: (item: T) => number): this;
  public addNumberColumn(header: string, value: (item: T) => number): this;
  public addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;
  public addNumberColumn(valueHeaderDescriptor: ((item: T) => number) | string | SciNumberColumnDescriptor<T>, value?: (item: T) => number): this {
    return this.addColumn('number', valueHeaderDescriptor, value);
  }

  public addComponentColumn(config: SciComponentColumnDescriptor<T>): this {
    // TODO [dwi] Normalize filterable and sortable and add default matcher/comparator to all columns
    if (isSignal(this._descriptor.ɵdatasource) && (config.filterable === true || config.sortable === true)) {
      throw Error('[ColumnDefinitionError] Component columns cannot have a auto filter or auto sort.');
    }
    return this.addColumn('component', config);
  }

  public addTemplateColumn(config: SciTemplateColumnDescriptor<T>): this {
    if (isSignal(this._descriptor.ɵdatasource) && (config.filterable === true || config.sortable === true)) {
      throw Error('[ColumnDefinitionError] Template columns cannot have a auto filter or auto sort.');
    }
    return this.addColumn('template', config);
  }

  private addColumn(type: SciTableColumnType, valueHeaderDescriptor: ((item: T) => unknown) | string | SciTableColumnDescriptorLike<T>, value?: (item: T) => unknown): this {
    const config = (() => {
      switch (typeof valueHeaderDescriptor) {
        case 'string':
          return {header: valueHeaderDescriptor, value: value!} as SciTableColumnDescriptorLike<T>;
        case 'function':
          return {value: valueHeaderDescriptor} as SciTableColumnDescriptorLike<T>;
        default:
          return valueHeaderDescriptor;
      }
    })();

    if (!isSignal(this._descriptor.ɵdatasource) && (typeof config.sortable === 'object' || typeof config.filterable === 'object')) {
      throw Error('[ColumnDefinitionError] Data sources with a loader function cannot define a custom sort or filter function. Sorting and filtering have to be done within the loader function.');
    }

    // Fallback to the column index as the column name.
    const name = config.name ?? `column:${this.columns.length}`;
    if (this.columns.find(column => column.name === name)) {
      throw Error(`[ColumnDefinitionError] Column names have to be unique. "${name}" is defined more than once.`);
    }

    this.columns.push({...config, name, type});
    return this;
  }
}
