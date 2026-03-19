/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, signal, untracked} from '@angular/core';
import {UUID} from '@scion/toolkit/uuid';
import {coerceSignal} from './common';
import {SciBooleanColumnDescriptor, SciColumnDescriptors, SciComponentColumnDescriptor, SciNumberColumnDescriptor, SciStringColumnDescriptor, SciTableFactory, SciTemplateColumnDescriptor} from './table.factory';
import {ColumnType, SciCellContext, SciColumns} from './table.model';
import {DefaultSciTableStorage, SciTableStorage} from './table-storage';

function defaultFilter<T>(text: string | boolean | number, {value}: SciCellContext<T, string | boolean | number>): boolean {
  if (typeof value !== typeof text) {
    return false;
  }

  switch (typeof value) {
    case 'string':
      return value.toLowerCase().includes((text as string).toLowerCase());
    default:
      return text === value;
  }
}

function defaultSort<T>(a: SciCellContext<T, string | boolean | number>, b: SciCellContext<T, string | boolean | number>): number {
  if (typeof a !== typeof b) {
    return 0;
  }

  switch (typeof a.value) {
    case 'string':
      return a.value.localeCompare(b.value as string);
    case 'number':
      return a.value - (b.value as number);
    case 'boolean':
      return a.value === b.value ? 0 : (a.value ? 1 : -1);
    default:
      return 0;
  }
}

export class ɵSciTableFactory<T> implements SciTableFactory<T> {

  public readonly columns: SciColumns<T>[] = [];
  public tableName: string | undefined = undefined;
  public tableStorage: SciTableStorage = new DefaultSciTableStorage();
  public rowItemSize = 28;
  public isSortable = signal(true);
  public isFilterable = signal(true);
  public isResizable = signal(true);
  public isSelectable = signal(true);
  public isHeaderVisible = signal(true);
  public rowPartFn?: (item: T) => string;
  public trackByFn = (_: T, index: number): unknown => index;

  public name(name: string): this {
    this.tableName = name;
    return this;
  }

  public addBooleanColumn(value: (item: T) => boolean): this;
  public addBooleanColumn(header: string, value: (item: T) => boolean): this;
  public addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;
  public addBooleanColumn(valueHeaderDescriptor: ((item: T) => boolean) | string | SciBooleanColumnDescriptor<T>, value?: (item: T) => boolean): this {
    return this.addColumnWithType('boolean', valueHeaderDescriptor, value);
  }

  public addStringColumn(value: (item: T) => string): this;
  public addStringColumn(header: string, value: (item: T) => string): this;
  public addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;
  public addStringColumn(valueHeaderDescriptor: ((item: T) => string) | string | SciStringColumnDescriptor<T>, value?: (item: T) => string): this {
    return this.addColumnWithType('string', valueHeaderDescriptor, value);
  }

  public addNumberColumn(value: (item: T) => number): this;
  public addNumberColumn(header: string, value: (item: T) => number): this;
  public addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;
  public addNumberColumn(valueHeaderDescriptor: ((item: T) => number) | string | SciNumberColumnDescriptor<T>, value?: (item: T) => number): this {
    return this.addColumnWithType('number', valueHeaderDescriptor, value);
  }

  public addComponentColumn(config: SciComponentColumnDescriptor<T>): this {
    return this.addColumnWithType('component', config);
  }

  public addTemplateColumn(config: SciTemplateColumnDescriptor<T>): this {
    return this.addColumnWithType('template', config);
  }

  public disableFilter(): this {
    untracked(() => this.isFilterable.set(false));
    return this;
  }

  public disableResize(): this {
    untracked(() => this.isResizable.set(false));
    return this;
  }

  public disableSelection(): this {
    untracked(() => this.isSelectable.set(false));
    return this;
  }

  public disableSort(): this {
    untracked(() => this.isSortable.set(false));
    return this;
  }

  public itemSize(itemSize: number): this {
    this.rowItemSize = itemSize;
    return this;
  }

  public rowPart(cssClassFn: (item: T) => string): this {
    this.rowPartFn = cssClassFn;
    return this;
  }

  public trackBy(trackByFn: (row: T, index: number) => unknown): this {
    this.trackByFn = trackByFn;
    return this;
  }

  public hideHeader(): this {
    untracked(() => this.isHeaderVisible.set(false));
    return this;
  }

  public setTableStorage(tableStorage: SciTableStorage): this {
    this.tableStorage = tableStorage;
    return this;
  }

  private addColumnWithType(type: ColumnType, valueHeaderDescriptor: ((item: T) => unknown) | string | SciColumnDescriptors<T>, value?: (item: T) => unknown): this {
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

    // columns with a custom component or template must provide a sort function to be sortable, because the default sort function does not work.
    const sortable = type === 'component' || type === 'template' ?
      !!config.sort :
      config.sort !== false;

    // columns with a custom component or template must provide a filter function to be filterable, because the default filter function does not work.
    const filterable = type === 'component' || type === 'template' ?
      !!config.filter :
      config.filter !== false;

    this.columns.push({
      ...config,
      type,
      name: config.name ?? UUID.randomUUID(),
      named: !!config.name,
      filter: typeof config.filter === 'function' ? config.filter : defaultFilter,
      sort: typeof config.sort === 'function' ? config.sort : defaultSort,
      header: coerceSignal(config.header, {defaultValue: ''}),
      sortable: computed(() => this.isSortable() && sortable),
      filterable: computed(() => this.isFilterable() && filterable),
      resizable: computed(() => this.isResizable() && (config.resizable ?? true)),
      index: signal(this.columns.length),
      width: coerceSignal(config.width, {defaultValue: 'min-content'}),
      minWidth: coerceSignal(config.minWidth, {defaultValue: '100px'}),
      maxWidth: coerceSignal(config.maxWidth, {defaultValue: null}),
    } as SciColumns<T>);
    return this;
  }

}
