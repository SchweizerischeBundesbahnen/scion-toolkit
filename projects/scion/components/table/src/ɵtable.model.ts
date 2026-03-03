/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {signal, Signal} from '@angular/core';
import {UUID} from '@scion/toolkit/uuid';
import {ColumnType, SciColumn, SciColumnDescriptor, SciTable, ValueAccessorFn, ValueType} from './table.model';
import {coerceSignal} from './common';

function defaultFilter(text: string, value: ValueType): boolean {
  switch (typeof value) {
    case 'string':
      return value.toLowerCase().includes(text.toLowerCase());
    case 'number':
      return isNaN(+text) ? false : +text === value;
    case 'boolean':
      return text === String(value);
    default:
      return false;
  }
}

function defaultSort(a: ValueType, b: ValueType): number {
  // TODO: improve default sort for non matching types (maybe pass columntype?)
  if (typeof a !== typeof b) {
    return 0;
  }

  switch (typeof a) {
    case 'string':
      return a.localeCompare(b as string);
    case 'number':
      return a - (b as number);
    case 'boolean':
      return a === b ? 0 : (a ? -1 : 1);
    default:
      return 0;
  }
}

export class ɵSciTable<T> implements SciTable<T> {
  private readonly _columns = signal<SciColumn<T, ValueType>[]>([]);
  private readonly _isSortable = signal(true);
  private readonly _isFilterable = signal(true);
  private readonly _isResizable = signal(true);
  private readonly _isSelectable = signal(true);

  public readonly columns = this._columns.asReadonly();
  public readonly isSortable = this._isSortable.asReadonly();
  public readonly isFilterable = this._isFilterable.asReadonly();
  public readonly isResizable = this._isResizable.asReadonly();
  public readonly isSelectable = this._isSelectable.asReadonly();

  constructor(public readonly data: Signal<T[]>) {}

  public addBooleanColumn(valueAccessorOrConfig: ValueAccessorFn<T, boolean> | SciColumnDescriptor<T, boolean>): this {
    return this.addColumnWithType(valueAccessorOrConfig as ValueAccessorFn<T, ValueType> | SciColumnDescriptor<T, ValueType>, 'boolean');
  }

  public addNumberColumn(valueAccessorOrConfig: ValueAccessorFn<T, number> | SciColumnDescriptor<T, number>): this {
    return this.addColumnWithType(valueAccessorOrConfig as ValueAccessorFn<T, ValueType> | SciColumnDescriptor<T, ValueType>, 'number');
  }

  public addStringColumn(valueAccessorOrConfig: ValueAccessorFn<T, string> | SciColumnDescriptor<T, string>): this {
    return this.addColumnWithType(valueAccessorOrConfig as ValueAccessorFn<T, ValueType> | SciColumnDescriptor<T, ValueType>, 'string');
  }

  public addColumn(valueAccessorOrConfig: SciColumnDescriptor<T, ValueType>): this {
    return this.addColumnWithType(valueAccessorOrConfig as ValueAccessorFn<T, ValueType> | SciColumnDescriptor<T, ValueType>, 'custom');
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

  private addColumnWithType(valueAccessorOrConfig: ValueAccessorFn<T, ValueType> | SciColumnDescriptor<T, ValueType>, type: ColumnType): this {
    const config = typeof valueAccessorOrConfig === 'function' ? {label: valueAccessorOrConfig} : valueAccessorOrConfig;
    this._columns.update(columns => [
      ...columns,
      {
        type,
        id: config.id ?? UUID.randomUUID(),
        label: config.label,
        filter: typeof config.filter === 'function' ? config.filter : defaultFilter,
        sort: typeof config.sort === 'function' ? config.sort : defaultSort,
        header: coerceSignal(config.header, {defaultValue: ''}),
        sortable: coerceSignal(config.sort !== false, {defaultValue: true}),
        filterable: coerceSignal(config.filter !== false, {defaultValue: true}),
        resizable: coerceSignal(config.resizable, {defaultValue: true}),
        order: signal(columns.length),
        width: coerceSignal(config.width, {defaultValue: '1fr'}),
        minWidth: coerceSignal(config.minWidth, {defaultValue: null}),
        maxWidth: coerceSignal(config.maxWidth, {defaultValue: null}),
      },
    ]);
    return this;
  }
}
