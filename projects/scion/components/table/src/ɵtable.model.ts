/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {signal} from '@angular/core';
import {UUID} from '@scion/toolkit/uuid';
import {ColumnType, SciBooleanColumnDescriptor, SciColumn, SciColumnDescriptors, SciNumberColumnDescriptor, SciCellContext, SciStringColumnDescriptor, SciTable, ValueType, SciComponentColumnDescriptor} from './table.model';
import {coerceSignal} from './common';
import {SciDataSource} from './data-source.model';

function defaultFilter<T>(text: string, {label}: SciCellContext<T, ValueType>): boolean {
  switch (typeof label) {
    case 'string':
      return label.toLowerCase().includes(text.toLowerCase());
    case 'number':
      return isNaN(+text) ? false : +text === label;
    case 'boolean':
      return text === String(label);
    default:
      return false;
  }
}

function defaultSort<T>(a: SciCellContext<T, ValueType>, b: SciCellContext<T, ValueType>): number {
  // TODO: improve default sort for non matching types (maybe pass columntype?)
  if (a.label === undefined || b.label === undefined || typeof a !== typeof b) {
    return 0;
  }

  switch (typeof a.label) {
    case 'string':
      return a.label.localeCompare(b.label as string);
    case 'number':
      return a.label - (b.label as number);
    case 'boolean':
      return a.label === b.label ? 0 : (a.label ? -1 : 1);
    default:
      return 0;
  }
}

export class ɵSciTable<T> implements SciTable<T> {
  private readonly _columns = signal<SciColumn<T>[]>([]);
  private readonly _isSortable = signal(true);
  private readonly _isFilterable = signal(true);
  private readonly _isResizable = signal(true);
  private readonly _isSelectable = signal(true);

  public readonly columns = this._columns.asReadonly();
  public readonly isSortable = this._isSortable.asReadonly();
  public readonly isFilterable = this._isFilterable.asReadonly();
  public readonly isResizable = this._isResizable.asReadonly();
  public readonly isSelectable = this._isSelectable.asReadonly();

  constructor(public readonly dataSource: SciDataSource<T>) {
    // DataSource from data (paging, filtering, sorting) evtl. ArrayDataSource
  }

  // public addBooleanColumn(valueAccessorOrConfig: ((record: T) => boolean) | SciBooleanColumnDescriptor<T>): this {
  //   return this.addColumnWithType(typeof valueAccessorOrConfig === 'function' ? {label: valueAccessorOrConfig} : valueAccessorOrConfig, 'boolean');
  // }

  public addBooleanColumn(label: (item: T) => boolean): this;
  public addBooleanColumn(header: string, label: (item: T) => boolean): this;
  public addBooleanColumn(descriptor: SciBooleanColumnDescriptor<T>): this;
  public addBooleanColumn(labelHeaderDescriptor: ((item: T) => boolean) | string | SciBooleanColumnDescriptor<T>, label?: (item: T) => boolean): this {
    switch (typeof labelHeaderDescriptor) {
      case 'string':
        return this.addColumnWithType({header: labelHeaderDescriptor, label: label!}, 'boolean');
      case 'function':
        return this.addColumnWithType({label: labelHeaderDescriptor}, 'boolean');
      default:
        return this.addColumnWithType(labelHeaderDescriptor, 'boolean');
    }
  }

  public addStringColumn(label: (item: T) => string): this;
  public addStringColumn(header: string, label: (item: T) => string): this;
  public addStringColumn(descriptor: SciStringColumnDescriptor<T>): this;
  public addStringColumn(labelHeaderDescriptor: ((item: T) => string) | string | SciStringColumnDescriptor<T>, label?: (item: T) => string): this {
    switch (typeof labelHeaderDescriptor) {
      case 'string':
        return this.addColumnWithType({header: labelHeaderDescriptor, label: label!}, 'string');
      case 'function':
        return this.addColumnWithType({label: labelHeaderDescriptor}, 'string');
      default:
        return this.addColumnWithType(labelHeaderDescriptor, 'string');
    }
  }

  public addNumberColumn(label: (item: T) => number): this;
  public addNumberColumn(header: string, label: (item: T) => number): this;
  public addNumberColumn(descriptor: SciNumberColumnDescriptor<T>): this;
  public addNumberColumn(labelHeaderDescriptor: ((item: T) => number) | string | SciNumberColumnDescriptor<T>, label?: (item: T) => number): this {
    switch (typeof labelHeaderDescriptor) {
      case 'string':
        return this.addColumnWithType({header: labelHeaderDescriptor, label: label!}, 'number');
      case 'function':
        return this.addColumnWithType({label: labelHeaderDescriptor}, 'number');
      default:
        return this.addColumnWithType(labelHeaderDescriptor, 'number');
    }
  }

  public addComponentColumn(config: SciComponentColumnDescriptor<T>): this {
    return this.addColumnWithType(config, 'custom');
  }

  public filterable(filterable: boolean): this {
    this._isFilterable.set(filterable);
    return this;
  }

  public resizable(resizable: boolean): this {
    this._isResizable.set(resizable);
    return this;
  }

  public selectable(selectable: boolean): this {
    this._isSelectable.set(selectable);
    return this;
  }

  public sortable(sortable: boolean): this {
    this._isSortable.set(sortable);
    return this;
  }

  private _trackByFn = (_: T, index: number): unknown => index;
  public trackBy(trackByFn: (row: T, index: number) => unknown): this {
    this._trackByFn = trackByFn;
    return this;
  }

  public trackByFn(index: number, row: T): unknown {
    return this._trackByFn(row, index);
  }

  private addColumnWithType(config: SciColumnDescriptors<T>, type: ColumnType): this {
    // columns with a custom component must provide a sort function to be sortable, because the default sort function does not work.
    const sortable = typeof config.label === 'function' ?
      config.sort !== false :
      !!config.sort;

    // columns with a custom component must provide a filter function to be filterable, because the default filter function does not work.
    const filterable = typeof config.label === 'function' ?
      config.filter !== false :
      !!config.filter;

    this._columns.update(columns => [
      ...columns,
      {
        type,
        name: config.name ?? UUID.randomUUID(),
        label: config.label,
        component: config.component,
        filter: typeof config.filter === 'function' ? config.filter : defaultFilter,
        sort: typeof config.sort === 'function' ? config.sort : defaultSort,
        header: coerceSignal(config.header, {defaultValue: ''}),
        sortable: signal(sortable),
        filterable: signal(filterable),
        resizable: coerceSignal(config.resizable, {defaultValue: true}),
        // order: signal(columns.length),
        width: coerceSignal(config.width, {defaultValue: '1fr'}),
        minWidth: coerceSignal(config.minWidth, {defaultValue: null}),
        maxWidth: coerceSignal(config.maxWidth, {defaultValue: null}),
      } as SciColumn<T>,
    ]);
    return this;
  }

}
