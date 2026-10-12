/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciTableColumnFilter, SciTableIdsRequest, SciTableSortCriterion, SciTableTreeNode} from './table-datasource';
import {SciTableColumn, SciTableColumnLike} from './table.model';
import {computed, inject, runInInjectionContext, Signal, untracked} from '@angular/core';
import {Observable} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {SciTableCellValuePreloader} from './table-cell-value-preloader';
import {Arrays} from '@scion/toolkit/util';
import {SciDateValue} from './table-date-column.model';
import {SciEnumValue} from './table-enum-column.model';
import {ɵSingleActiveInjectorFactory} from '@scion/components/common';
import {mapArray} from '@scion/toolkit/operators';

export function treeDatasource<T, ID>(data: Signal<Map<ID, SciTableTreeNode<T, ID>>>, columns: Signal<SciTableColumnLike<T>[]>): ((request: SciTableIdsRequest) => Observable<SciTableTreeNode<ID>[]>) {
  const dataset = new Dataset(data, columns);

  return (request: SciTableIdsRequest) => toObservable(dataset.getDataview(request));
}

export function arrayDatasource<T, ID>(data: Signal<Map<ID, T>>, columns: Signal<SciTableColumnLike<T>[]>): ((request: SciTableIdsRequest) => Observable<ID[]>) {
  const dataset = new Dataset(computed(() => new Map([...data().entries()].map(([id, item]) => [id, {item}]))), columns);

  return (request: SciTableIdsRequest) => toObservable(dataset.getDataview(request)).pipe(mapArray(node => node.item));
}

/**
 * Provides a filtered and sorted view on given data.
 */
class Dataset<T, ID> {

  private readonly _dataset: Signal<DatasetRow<T, ID>[]>;

  constructor(data: Signal<Map<ID, SciTableTreeNode<T, ID>>>, columns: Signal<SciTableColumnLike<T>[]>) {
    const tableCellValuePreloader = inject(SciTableCellValuePreloader);

    // Create a factory to instantiate a new injector per dataset run, releasing resources allocated in column value functions.
    const injectorFactory = new ɵSingleActiveInjectorFactory();

    this._dataset = computed((): DatasetRow<T, ID>[] => {
      const injector = injectorFactory.create();

      return [...data().entries()].map(([id, node]) => ({
        id,
        parent: node.parent,
        item: node.item,
        cells: columns().reduce((cells, column) => untracked(() => {
          // PERF: Cell values are computed lazily (on idle or first use) to defer expensive computations like date formatting.
          const tableCellValue = 'value' in column ? new eSciTableCellValue(tableCellValuePreloader, () => runInInjectionContext(injector, () => column.value(node.item)())) : undefined;
          return cells.set(column.name, {
            column: column as SciTableColumn,
            value: () => tableCellValue?.value(),
          });
        }), new Map<`column:${string}`, DatasetCell>()),
      }));
    });
  }

  public getDataview({columnFilters, tableFilter, sortCriteria}: SciTableIdsRequest): Signal<SciTableTreeNode<ID>[]> {
    return computed(() => {
      const rows = this._dataset();

      // PERF: Do not track signals inside `Array.sort` to avoid Angular signal tracking overhead as the comparator runs repeatedly, degrading performance otherwise.
      return untracked(() => rows
        .filter(row => matchesRow(row, columnFilters, {coerceEnumValueToArray: true}) && matchesGlobalFilter(row, tableFilter, {coerceEnumValueToArray: false}))
        .sort((a, b) => compareRows(a, b, sortCriteria))
        .map(row => ({item: row.id, parent: row.parent})));
    });
  }
}

interface DatasetRow<T, ID> {
  id: ID;
  parent?: ID;
  item: T;
  cells: Map<`column:${string}`, DatasetCell>;
}

interface DatasetCell {
  column: SciTableColumn;
  value: () => string | number | boolean | SciDateValue | SciEnumValue | undefined;
}

/**
 * Tests whether a row matches the given global filter.
 */
function matchesGlobalFilter<T, ID>(row: DatasetRow<T, ID>, filter: string | undefined, options: {coerceEnumValueToArray: boolean}): boolean {
  if (!filter?.trim()) {
    return true;
  }

  for (const cell of row.cells.values()) {
    const text = cell.column.type === 'number' ? toNumber(filter) : filter;
    if (text === undefined) {
      continue;
    }

    if (matchesRow(row, [{text, columnName: cell.column.name} satisfies SciTableColumnFilter], options)) {
      return true;
    }
  }

  return false;
}

/**
 * Tests whether a row matches the given column filters.
 */
function matchesRow<T, ID>(row: DatasetRow<T, ID>, columnFilters: SciTableColumnFilter[], options: {coerceEnumValueToArray: boolean}): boolean {
  if (!columnFilters.length) {
    return true;
  }

  for (const columnFilter of columnFilters) {
    const cell = row.cells.get(columnFilter.columnName)!;
    if ('value' in cell.column && cell.value() === undefined) { // Component and template columns have no value.
      return false;
    }

    const filter = cell.column.type === 'enum' && options.coerceEnumValueToArray ? Arrays.coerce(columnFilter.text) : columnFilter.text;
    if (!cell.column.matches(filter, {item: row.item, value: cell.value()})) {
      return false;
    }
  }

  return true;
}

/**
 * Compares two rows based on the given sort criteria.
 */
function compareRows<T, ID>(row1: DatasetRow<T, ID>, row2: DatasetRow<T, ID>, sortCriteria: SciTableSortCriterion[]): number {
  if (!sortCriteria.length) {
    return 0;
  }

  for (const criterion of sortCriteria) {
    const cell1 = row1.cells.get(criterion.columnName)!;
    const cell2 = row2.cells.get(criterion.columnName)!;
    const value1 = cell1.value();
    const value2 = cell2.value();

    // Always place `undefined` values at the end, independent of the sort direction. Note that component and template columns have no value.
    if (value1 === undefined && value2 !== undefined) {
      return 1;
    }
    if (value2 === undefined && value1 !== undefined) {
      return -1;
    }

    // Prevent calling comparator for value columns where both values are undefined. Note that component and template columns have no value.
    if (value1 === undefined && value2 === undefined && 'value' in cell1.column) {
      return 0;
    }

    const comparison = cell1.column.compare({item: row1.item, value: value1}, {item: row2.item, value: value2});
    if (comparison !== 0) {
      return criterion.direction === 'asc' ? comparison : -comparison;
    }
  }

  return 0;
}

/**
 * Converts the given string to a number, or `undefined` if it cannot be parsed.
 */
function toNumber(numberLike: string): number | undefined {
  const number = Number.parseFloat(numberLike);
  return !Number.isNaN(number) ? number : undefined;
}

/**
 * Provides lazy loading for the cell's value, preloading it when idle for better sort/filter performance.
 *
 * The value is computed at most once, whether it gets preloaded during idle time or requested synchronously via {@link value()}.
 */
class eSciTableCellValue<V> {

  private _value: V | undefined;

  constructor(preloader: SciTableCellValuePreloader, private _valueFn: () => V) {
    preloader.queue(() => {
      this._value ??= this._valueFn();
    });
  }

  public value(): V {
    return this._value ??= untracked(() => this._valueFn());
  }
}
