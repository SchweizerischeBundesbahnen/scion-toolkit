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
import {computed, linkedSignal, Signal} from '@angular/core';
import {coerceSignal} from '@scion/components/common';
import {toObservable} from '@angular/core/rxjs-interop';
import {map, Observable, shareReplay} from 'rxjs';

export function arrayDatasource<T>(data: Signal<T[]>, columns: Signal<SciTableColumnLike<T>[]>): SciTableDataLoaderFn<T> {
  const cache = linkedSignal({
    source: () => ({data: data(), columns: columns()}),
    computation: () => new Map<string, Observable<MappedRow<T>[]>>(),
  });

  const items$ = toObservable(computed(() => {
    const resolvedColumns = columns();
    const items: MappedRow<T>[] = data().map(item => ({
      item,
      cells: resolvedColumns.reduce((acc, column) => acc.set(column.name, {
        column,
        value: column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item))() : undefined,
      }), new Map<`column:${string}`, MappedCell<T>>()),
    }));

    return {
      items,
      columns: resolvedColumns,
    };
  }));

  return markAsArrayDatasource((request: SciTablePageRequest): Observable<SciTablePageResponse<T>> => {
    const sortHash = request.sortCriteria.map(sc => `${sc.columnName}_${sc.direction}`).join('-');
    const filterHash = request.columnFilters.map(fc => `${fc.columnName}_${fc.text}`).join('-');
    const hash = `${sortHash}-${filterHash}-${request.tableFilter ?? ''}`;

    if (!cache().has(hash)) {
      const sortedAndFiltered$ = items$.pipe(
        map(({items, columns}) => {
          const sortCols = mapCriteria(request.sortCriteria, columns);
          const filterCols = mapCriteria(request.columnFilters, columns);

          return items
            .filter(item => matchesColumnFilters(item, filterCols) && matchesGlobalFilter(item, request.tableFilter))
            .sort((a, b) => sort(a, b, sortCols));
        }),
        shareReplay({bufferSize: 1, refCount: true}), // as soon as there are no subscribers left unsubscribe from the source.
      );

      // Only store one item in the cache.
      // The cache is used for scrolling and multipage selection.
      // It caches the data based on the current filter and sort.
      cache.set(new Map<string, Observable<MappedRow<T>[]>>().set(hash, sortedAndFiltered$));
    }

    return cache().get(hash)!.pipe(
      map(items => ({
        totalCount: items.length,
        items: items.slice(request.start, request.end).map(i => i.item),
      })),
    );
  });
}

type Criterion = SciTableSortCriterion | SciTableColumnFilter;
type MappedCriterion<T, CRIT extends Criterion = Criterion> = CRIT & {
  column: SciTableColumnLike<T>;
};

interface MappedCell<T> {
  column: SciTableColumnLike<T>;
  value: string | number | boolean | undefined;
}

interface MappedRow<T> {
  item: T;
  cells: Map<`column:${string}`, MappedCell<T>>;
}

function mapCriteria<T, CRIT extends Criterion>(criteria: CRIT[], columns: SciTableColumnLike<T>[]): MappedCriterion<T, CRIT>[] {
  return criteria.map(sc => {
    const column = columns.find(c => sc.columnName === c.name);

    return ({
      ...sc,
      column,
    });
  }).filter((sc): sc is MappedCriterion<T, CRIT> => sc.column !== undefined);
}

function matchesGlobalFilter<T>(row: MappedRow<T>, filter?: string): boolean {
  if (!filter?.trim()) {
    return true;
  }

  for (const cell of row.cells.values()) {
    const text = coerceFilterText(filter, {to: cell.column.type});
    if (text === undefined) {
      continue;
    }

    if (matchesColumnFilters(row, [{text, columnName: cell.column.name, column: cell.column}])) {
      return true;
    }
  }

  return false;
}

function matchesColumnFilters<T>(row: MappedRow<T>, filterCriteria: MappedCriterion<T, SciTableColumnFilter>[]): boolean {
  if (filterCriteria.length === 0) {
    return true;
  }

  for (const criterion of filterCriteria) {
    const value = row.cells.get(criterion.columnName)?.value;
    const column = criterion.column as SciTableColumn;
    if (!column.matches(criterion.text, {item: row.item, value: value})) {
      return false;
    }
  }

  return true;
}

function sort<T>(a: MappedRow<T>, b: MappedRow<T>, sortCriteria: MappedCriterion<T, SciTableSortCriterion>[]): number {
  if (sortCriteria.length === 0) {
    return 0;
  }

  for (const criterion of sortCriteria) {
    const aValue = a.cells.get(criterion.columnName)?.value;
    const bValue = b.cells.get(criterion.columnName)?.value;

    const column = criterion.column as SciTableColumn;
    const comparison = column.compare({item: a.item, value: aValue}, {item: b.item, value: bValue});
    if (comparison !== 0) {
      const signum = criterion.direction === 'asc' ? 1 : -1;
      return signum * comparison;
    }
  }

  return 0;
}

/**
 * Checks whether given {@link SciTableDataLoaderFn} is an {@link arrayDatasource}.
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
