/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciTableColumnFilter, SciTableDataLoaderFn, SciTableSortCriterion, SciTablePageRequest, SciTablePageResponse} from './table-datasource';
import {SciTableColumnLike} from './table.model';
import {SciColumnFilter, SciDataLoaderFn, SciSortCriterion, SciTableRequest, SciTableResponse} from './table-data-source';
import {SciColumnLike} from './table.model';
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
      cells: resolvedColumns.reduce((acc, column) => {
        if (column.type === 'dynamic') {
          const value = column.value(item);
          const isComponent = typeof value === 'object' && 'component' in value;
          const isTemplate = typeof value === 'object' && 'template' in value;

          return acc.set(column.name, {
            column,
            value: isComponent || isTemplate ? undefined : coerceSignal(value)() as string | number | boolean,
          });
        }
        else {
          return acc.set(column.name, {
            column,
            value: column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item))() : undefined,
          });
        }
      }, new Map<`column:${string}`, MappedCell<T>>()),
    }));

    return {
      items,
      columns: resolvedColumns,
    };
  }));

  return (request: SciTablePageRequest): Observable<SciTablePageResponse<T>> => {
    const sortHash = request.sortCriteria.map(sc => `${sc.columnName}_${sc.direction}`).join('-');
    const filterHash = request.columnFilters.map(fc => `${fc.columnName}_${fc.text}`).join('-');
    const hash = `${sortHash}-${filterHash}-${request.tableFilter ?? ''}`;

    if (!cache().has(hash)) {
      const sortedAndFiltered$ = items$.pipe(
        map(({items, columns}) => {
          const sortCols = mapCriteria(request.sortCriteria, columns);
          const filterCols = mapCriteria(request.columnFilters, columns);

          return items
            .filter(item => columnFilter(item, filterCols) && globalFilter(item, request.tableFilter))
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
  };
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

function globalFilter<T>(row: MappedRow<T>, filter?: string): boolean {
  if (!filter?.trim()) {
    return true;
  }

  for (const column of row.cells.values()) {
    const result = columnFilter(row, [{text: filter, columnName: column.column.name, column: column.column}]);

    // If any value includes the filter, it matches the filter.
    if (result) {
      return true;
    }
  }

  return false;
}

function columnFilter<T>(row: MappedRow<T>, filterCriteria: MappedCriterion<T, SciTableColumnFilter>[]): boolean {
  if (filterCriteria.length === 0) {
    return true;
  }

  for (const criterion of filterCriteria) {
    const value = row.cells.get(criterion.columnName)?.value;

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
        case 'dynamic':
          return criterion.column.filter(criterion.text as string, {item: row.item, value: value});
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

function sort<T>(a: MappedRow<T>, b: MappedRow<T>, sortCriteria: MappedCriterion<T, SciTableSortCriterion>[]): number {
  if (sortCriteria.length === 0) {
    return 0;
  }

  for (const criterion of sortCriteria) {
    const aValue = a.cells.get(criterion.columnName)?.value;
    const bValue = b.cells.get(criterion.columnName)?.value;

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
