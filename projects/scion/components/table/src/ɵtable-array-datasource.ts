/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciTableColumnFilter, SciTableDataLoaderFn, SciTablePageRequest, SciTablePageResponse, SciTableSortCriterion} from './table-datasource';
import {SciTableColumn, SciTableColumnLike, SciTableColumnType} from './table.model';
import {computed, signal, Signal, untracked} from '@angular/core';
import {coerceSignal} from '@scion/components/common';
import {Observable} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {Objects} from '@scion/toolkit/util';

export function arrayDatasource<T>(data: Signal<T[]>, columns: Signal<SciTableColumnLike<T>[]>): SciTableDataLoaderFn<T> {
  const dataset = new Dataset(data, columns);

  return markAsArrayDatasource((request: SciTablePageRequest): Observable<SciTablePageResponse<T>> => {
    dataset.columnFilters.set(request.columnFilters);
    dataset.tableFilter.set(request.tableFilter);
    dataset.sortCriteria.set(request.sortCriteria);

    const totalCount = dataset.count;
    const items = dataset.slice(request.start, request.end);

    return toObservable(computed(() => ({
      totalCount: totalCount(),
      items: items(),
    })));
  });
}

/**
 * Provides a filtered and sorted view on given data.
 */
class Dataset<T> {

  private readonly _dataview: Signal<DatasetRow<T>[]>;

  public readonly columnFilters = signal<SciTableColumnFilter[]>([], {equal: Objects.isEqual});
  public readonly sortCriteria = signal<SciTableSortCriterion[]>([], {equal: Objects.isEqual});
  public readonly tableFilter = signal<string | undefined>(undefined);

  /**
   * Returns the total count of items matching the current filters and search criteria.
   */
  public readonly count = computed(() => this._dataview().length);

  constructor(data: Signal<T[]>, columns: Signal<SciTableColumnLike<T>[]>) {
    const dataset = computed((): DatasetRow<T>[] => data().map(item => ({
      item,
      cells: columns().reduce((cells, column) => {
        const value = 'value' in column ? untracked(() => column.value(item)) : undefined;

        if (column.type === 'dynamic') {
          const isComponent = typeof value === 'object' && 'component' in value;
          const isTemplate = typeof value === 'object' && 'template' in value;

          return cells.set(column.name, {
            column: column as SciTableColumn,
            value: isComponent || isTemplate ? undefined : coerceSignal(value, {coerceUndefined: true})(),
          });
        }

        return cells.set(column.name, {
          column: column as SciTableColumn,
          value: 'value' in column ? coerceSignal(untracked(() => column.value(item)), {coerceUndefined: true})() : undefined,
        });
      }, new Map<`column:${string}`, DatasetCell>()),
    })));

    // Memoize filtered/sorted view; recomputes only when dataset or criteria change, not when scrolling through the view, as sorting is an expensive operation.
    this._dataview = computed(() => {
      const rows = dataset();
      const columnFilters = this.columnFilters();
      const tableFilter = this.tableFilter();
      const sortCriteria = this.sortCriteria();

      // PERF: Do not track signals inside `Array.sort` to avoid Angular signal tracking overhead as the comparator runs repeatedly, degrading performance otherwise.
      return untracked(() => rows
        .filter(row => matchesRow(row, columnFilters) && matchesGlobalFilter(row, tableFilter ?? undefined))
        .sort((a, b) => compareRows(a, b, sortCriteria)));
    });
  }

  /**
   * Returns a slice of the filtered and sorted data within the given range (start inclusive, end exclusive).
   */
  public slice(start: number, end: number): Signal<T[]> {
    return computed(() => this._dataview().slice(start, end).map(row => row.item));
  }
}

interface DatasetRow<T> {
  item: T;
  cells: Map<`column:${string}`, DatasetCell>;
}

interface DatasetCell {
  column: SciTableColumn;
  value: string | number | boolean | undefined;
}

/**
 * Tests whether a row matches the given global filter.
 */
function matchesGlobalFilter<T>(row: DatasetRow<T>, filter?: string): boolean {
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
function matchesRow<T>(row: DatasetRow<T>, columnFilters: SciTableColumnFilter[]): boolean {
  if (!columnFilters.length) {
    return true;
  }

  for (const columnFilter of columnFilters) {
    const cell = row.cells.get(columnFilter.columnName)!;
    if (!cell.column.matches(columnFilter.text, {item: row.item, value: cell.value})) { // component and template columns have no value
      return false;
    }
  }

  return true;
}

/**
 * Compares two rows based on the given sort criteria.
 */
function compareRows<T>(row1: DatasetRow<T>, row2: DatasetRow<T>, sortCriteria: SciTableSortCriterion[]): number {
  if (!sortCriteria.length) {
    return 0;
  }

  for (const criterion of sortCriteria) {
    const cell1 = row1.cells.get(criterion.columnName)!;
    const cell2 = row2.cells.get(criterion.columnName)!;

    const comparison = cell1.column.compare({item: row1.item, value: cell1.value}, {item: row2.item, value: cell2.value});
    if (comparison !== 0) {
      const signum = criterion.direction === 'asc' ? 1 : -1;
      return signum * comparison;
    }
  }

  return 0;
}

/**
 * Checks whether given {@link SciTableDataLoaderFn} represents an {@link arrayDatasource}.
 */
export function isArrayDatasource(loader: SciTableDataLoaderFn<unknown>): boolean {
  return ARRAY_DATASOURCE_MARKER in loader;
}

/**
 * Marks given {@link SciTableDataLoaderFn} as an array data source.
 */
function markAsArrayDatasource<TABLE_DATA_LOADER extends SciTableDataLoaderFn<unknown>>(loader: TABLE_DATA_LOADER): TABLE_DATA_LOADER {
  Object.defineProperty(loader, ARRAY_DATASOURCE_MARKER, {value: true, writable: false, enumerable: false, configurable: false});
  return loader;
}

/**
 * Identifies a {@link SciTableDataLoaderFn} as an {@link arrayDatasource}.
 */
const ARRAY_DATASOURCE_MARKER = Symbol('ARRAY_DATASOURCE_HINT');

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
