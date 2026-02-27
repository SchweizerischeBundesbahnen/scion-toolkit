/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {SciBooleanColumnDescriptor, SciColumnDescriptors, SciComponentColumnDescriptor, SciNumberColumnDescriptor, SciStringColumnDescriptor, SciTableFactory, SciTemplateColumnDescriptor} from './table.factory';
import {ColumnType} from './table.model';
import {signal} from '@angular/core';

export class ɵSciTableFactory<T> implements SciTableFactory<T> {

  public readonly columns = signal<(SciColumnDescriptors<T> & {type: ColumnType})[]>([]);

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
    return this.addColumn('component', config);
  }

  public addTemplateColumn(config: SciTemplateColumnDescriptor<T>): this {
    return this.addColumn('template', config);
  }

  private addColumn(type: ColumnType, valueHeaderDescriptor: ((item: T) => unknown) | string | SciColumnDescriptors<T>, value?: (item: T) => unknown): this {
    const config = (() => {
      switch (typeof valueHeaderDescriptor) {
        case 'string':
          return {header: valueHeaderDescriptor, value: value!} as SciColumnDescriptors<T>;
        case 'function':
          return {value: valueHeaderDescriptor} as SciColumnDescriptors<T>;
        default:
          return valueHeaderDescriptor;
      }
    })();

    this.columns.update(c => [...c, {...config, type}]);
    return this;
  }
}
