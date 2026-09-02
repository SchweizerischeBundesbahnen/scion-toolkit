/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {SciBooleanColumnDescriptor, SciColumnDescriptorLike, SciComponentColumnDescriptor, SciNumberColumnDescriptor, SciStringColumnDescriptor, SciTableFactory, SciTemplateColumnDescriptor} from './table.factory';
import {SciColumnType, SciTableDescriptor} from './table.model';
import {isSignal} from '@angular/core';

export class ɵSciTableFactory<T> implements SciTableFactory<T> {

  public readonly columns = new Array<SciColumnDescriptorLike<T> & {type: SciColumnType}>();

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
    // TODO [dwie] Normalize filterable and sortable and add default matcher/comparator to all columns
    if (isSignal(this._descriptor.data) && (config.filterable === true || config.sortable === true)) {
      throw Error('[ColumnDefinitionError] Component columns cannot have a auto filter or auto sort.');
    }
    return this.addColumn('component', config);
  }

  public addTemplateColumn(config: SciTemplateColumnDescriptor<T>): this {
    if (isSignal(this._descriptor.data) && (config.filterable === true || config.sortable === true)) {
      throw Error('[ColumnDefinitionError] Template columns cannot have a auto filter or auto sort.');
    }
    return this.addColumn('template', config);
  }

  private addColumn(type: SciColumnType, valueHeaderDescriptor: ((item: T) => unknown) | string | SciColumnDescriptorLike<T>, value?: (item: T) => unknown): this {
    const config = (() => {
      switch (typeof valueHeaderDescriptor) {
        case 'string':
          return {header: valueHeaderDescriptor, value: value!} as SciColumnDescriptorLike<T>;
        case 'function':
          return {value: valueHeaderDescriptor} as SciColumnDescriptorLike<T>;
        default:
          return valueHeaderDescriptor;
      }
    })();

    if (!isSignal(this._descriptor.data) && (typeof config.sortable === 'object' || typeof config.filterable === 'object')) {
      throw Error('[ColumnDefinitionError] Data sources with a loader function cannot define a custom sort or filter function. Sorting and filtering have to be done within the loader function.');
    }

    this.columns.push({...config, type});
    return this;
  }
}
