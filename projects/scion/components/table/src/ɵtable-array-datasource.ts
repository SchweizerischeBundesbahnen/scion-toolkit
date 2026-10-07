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
import {SciTableColumn, SciTableColumnLike, SciTableColumnType} from './table.model';
import {computed, inject, isSignal, Signal, signal, untracked} from '@angular/core';
import {Observable} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {Objects} from '@scion/toolkit/util';
import {SciTableCellValuePreloader} from './table-cell-value-preloader';
import {SciDateValue} from './table-date-column.model';

export function treeDatasource<T, ID>(data: Signal<Map<ID, SciTableTreeNode<T, ID>>>, columns: Signal<SciTableColumnLike<T>[]>): ((request: SciTableIdsRequest) => Observable<SciTableTreeNode<ID>[]>) {
  const dataset = new Dataset(data, columns);

  return (request: SciTableIdsRequest): Observable<SciTableTreeNode<ID>[]> => {
    return toObservable(computed(() => dataset.getDataview(request)().map(node => ({
      item: node.id,
      parent: node.id,
    }))));
  };
}

export function arrayDatasource<T, ID>(data: Signal<Map<ID, T>>, columns: Signal<SciTableColumnLike<T>[]>): ((request: SciTableIdsRequest) => Observable<ID[]>) {
  const dataset = new Dataset(computed(() => {
    const d = data();
    return new Map([...d.entries()].map(([id, item]) => [id, {item}]));
  }), columns);

  return (request: SciTableIdsRequest): Observable<ID[]> => {
    return toObservable(computed(() => dataset.getDataview(request)().map(node => node.id)));
  };
}

/**
 * Provides a filtered and sorted view on given data.
 */
class Dataset<T, ID> {

  private readonly _dataset: Signal<DatasetRow<T, ID>[]>;

  constructor(data: Signal<Map<ID, SciTableTreeNode<T, ID>>>, columns: Signal<SciTableColumnLike<T>[]>) {
    const tableCellValuePreloader = inject(SciTableCellValuePreloader);

    this._dataset = computed((): DatasetRow<T, ID>[] => [...data().entries()].map(([id, node]) => ({
      id,
      parent: node.parent,
      item: node.item,
      cells: columns().reduce((cells, column) => untracked(() => {
        // PERF: Cell values are computed lazily (on idle or first use) to defer expensive computations like date formatting.
        const cellValue = ((): Signal<string | number | boolean | SciDateValue | undefined> | undefined => {
          if ('value' in column) {
            const value = column.value(node.item);
            if (isSignal(value)) {
              return value;
            }
          }
          return undefined;
        })();

        const tableCellValue = cellValue ? new eSciTableCellValue(tableCellValuePreloader, () => cellValue()) : undefined;
        return cells.set(column.name, {
          column: column as SciTableColumn,
          value: () => tableCellValue?.value(),
        });
      }), new Map<`column:${string}`, DatasetCell>()),
    })));
  }

  public getDataview({columnFilters, tableFilter, sortCriteria}: SciTableIdsRequest): Signal<DatasetRow<T, ID>[]> {
    return computed(() => {
      const rows = this._dataset();

      // PERF: Do not track signals inside `Array.sort` to avoid Angular signal tracking overhead as the comparator runs repeatedly, degrading performance otherwise.
      return untracked(() => rows
        .filter(row => matchesRow(row, columnFilters) && matchesGlobalFilter(row, tableFilter))
        .sort((a, b) => compareRows(a, b, sortCriteria)));
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
  value: () => string | number | boolean | SciDateValue | undefined;
}

/**
 * Tests whether a row matches the given global filter.
 */
function matchesGlobalFilter<T, ID>(row: DatasetRow<T, ID>, filter?: string): boolean {
  if (!filter?.trim()) {
    return true;
  }

  for (const cell of row.cells.values()) {
    const text = coerceFilterText(filter, {to: cell.column.type});
    if (text === undefined) {
      continue;
    }

    if (matchesRow(row, [{text, columnName: cell.column.name} satisfies SciTableColumnFilter])) {
      return true;
    }
  }

  return false;
}

/**
 * Tests whether a row matches the given column filters.
 */
function matchesRow<T, ID>(row: DatasetRow<T, ID>, columnFilters: SciTableColumnFilter[]): boolean {
  if (!columnFilters.length) {
    return true;
  }

  for (const columnFilter of columnFilters) {
    const cell = row.cells.get(columnFilter.columnName)!;
    if ('value' in cell.column && cell.value() === undefined) { // Component and template columns have no value.
      return false;
    }

    if (!cell.column.matches(columnFilter.text, {item: row.item, value: cell.value()})) {
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

    const comparison = cell1.column.compare({item: row1.item, value: value1}, {item: row2.item, value: value2});
    if (comparison !== 0) {
      return criterion.direction === 'asc' ? comparison : -comparison;
    }
  }

  return 0;
}

/**
 * Coerces the given filter text into the specified column data type.
 */
function coerceFilterText(text: string, options: {to: SciTableColumnType}): string | number | boolean | undefined {
  switch (options.to) {
    case 'number': {
      const number = Number.parseFloat(text);
      return !Number.isNaN(number) ? number : undefined;
    }
    case 'boolean': {
      if (text === 'true' || text === '1') {
        return true;
      }
      if (text === 'false' || text === '0') {
        return false;
      }
      return undefined;
    }
    default: {
      return text;
    }
  }
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
