/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {SciDataLoaderFn, SciColumnFilter, SciSortCriterion, SciTableRequest, SciTableResponse} from './table-data-source';
import {SciColumnLike} from './table.model';
import {computed, Signal} from '@angular/core';
import {coerceSignal} from '@scion/components/common';
import {toObservable} from '@angular/core/rxjs-interop';
import {map, Observable} from 'rxjs';

type MappedCriterion<T, CRIT extends {columnName: string}> = CRIT & {
  column: SciColumnLike<T>;
  columnIndex: number;
};

interface ItemWithValues<T> {
  item: T;
  values: Array<string | number | boolean | undefined>;
}

function mapCriteria<T, CRIT extends {columnName: string}>(criteria: CRIT[], columns: SciColumnLike<T>[]): MappedCriterion<T, CRIT>[] {
  return criteria.map(sc => {
    const columnIndex = columns.findIndex(c => sc.columnName === c.name);

    return ({
      ...sc,
      columnIndex,
      column: columns[columnIndex],
    });
  }).filter((sc): sc is MappedCriterion<T, CRIT> => sc.columnIndex >= 0);
}

function globalFilter<T>(row: ItemWithValues<T>, filter?: string): boolean {
  if (!filter?.trim()) {
    return true;
  }

  for (const value of row.values) {
    const result = (() => {
      switch (typeof value) {
        case 'string':
          return value.trim().toLocaleLowerCase().includes(filter.toLocaleLowerCase());
        case 'boolean':
        case 'number':
          return value.toString().includes(filter.toLocaleLowerCase());
        default:
          return false;
      }
    })();

    // If any value includes the filter, it matches the filter.
    if (result) {
      return true;
    }
  }

  return false;
}

function columnFilter<T>(row: ItemWithValues<T>, filterCriteria: MappedCriterion<T, SciColumnFilter>[]): boolean {
  if (filterCriteria.length === 0) {
    return true;
  }

  for (const criterion of filterCriteria) {
    const value = row.values[criterion.columnIndex];

    const filter = (() => {
      switch (criterion.column.type) {
        case 'string':
          return criterion.column.filter(criterion.text as string, {item: row.item, value: value as string});
        case 'number':
          return criterion.column.filter(criterion.text as number, {item: row.item, value: value as number});
        case 'boolean':
          return criterion.column.filter(criterion.text as boolean, {item: row.item, value: value as boolean});
        case 'component':
        case 'template':
          return criterion.column.filter(criterion.text as string, {item: row.item, value: undefined});
        default:
          return true;
      }
    })();

    // all filters must match (for now)
    if (!filter) {
      return false;
    }
  }

  return true;
}

function sort<T>(a: ItemWithValues<T>, b: ItemWithValues<T>, sortCriteria: MappedCriterion<T, SciSortCriterion>[]): number {
  if (sortCriteria.length === 0) {
    return 0;
  }

  for (const criterion of sortCriteria) {
    const aValue = a.values[criterion.columnIndex];
    const bValue = b.values[criterion.columnIndex];

    const sort = (() => {
      switch (criterion.column.type) {
        case 'string':
          return criterion.column.sort({item: a.item, value: aValue as string}, {item: b.item, value: bValue as string});
        case 'number':
          return criterion.column.sort({item: a.item, value: aValue as number}, {item: b.item, value: bValue as number});
        case 'boolean':
          return criterion.column.sort({item: a.item, value: aValue as boolean}, {item: b.item, value: bValue as boolean});
        case 'component':
        case 'template':
          return criterion.column.sort({item: a.item, value: undefined}, {item: b.item, value: undefined});
        default:
          return 0;
      }
    })();

    if (sort !== 0) {
      const dir = criterion.direction === 'asc' ? 1 : -1;
      return sort * dir;
    }
  }

  return 0;
}

export function arrayDataSource<T>(data: Signal<T[]>, columns: Signal<SciColumnLike<T>[]>): SciDataLoaderFn<T> {
  const items$ = toObservable(computed(() => {
    const resolveColumns = columns();
    const items = data();
    return items.map(item => ({
      item,
      values: resolveColumns.map(column => column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item))() : undefined),
    }));
  }));

  return (request: SciTableRequest): Observable<SciTableResponse<T>> => {
    const sortCols = mapCriteria(request.sortCriteria, columns());
    const filterCols = mapCriteria(request.columnFilters, columns());

    return items$.pipe(
      map(items => items
        .filter(item => columnFilter(item, filterCols) && globalFilter(item, request.globalFilter))
        .sort((a, b) => sort(a, b, sortCols))),
      map(items => ({
        totalCount: items.length,
        items: items.slice(request.start, request.end).map(i => i.item),
      })),
    );
  };
}
