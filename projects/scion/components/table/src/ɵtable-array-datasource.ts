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
import {computed, Signal, untracked} from '@angular/core';
import {coerceSignal} from '@scion/components/common';
import {Observable} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';

export function treeDatasource<T, ID>(data: Signal<Map<ID, SciTableTreeNode<T, ID>>>, columns: Signal<SciTableColumnLike<T>[]>): ((request: SciTableIdsRequest) => Observable<SciTableTreeNode<ID>[]>) {
  const dataset = computed((): TreeDatasetRow<T, ID>[] => {
    return [...data().entries()].map(([id, node]) => ({...createDatasetRow(id, node.item, columns()), parent: node.parent}));
  });

  return (request: SciTableIdsRequest): Observable<SciTableTreeNode<ID>[]> => {
    return toObservable(computed(() => {
      const rows = dataset();

      return untracked(() => {
        return rows
          .filter(row => (matchesRow(row, request.columnFilters) && matchesGlobalFilter(row, request.tableFilter)))
          .sort((a, b) => compareRows(a, b, request.sortCriteria))
          .map(row => ({item: row.id, parent: row.parent}));
      });
    }));
  };
}

export function arrayDatasource<T, ID>(data: Signal<Map<ID, T>>, columns: Signal<SciTableColumnLike<T>[]>): ((request: SciTableIdsRequest) => Observable<ID[]>) {
  const dataset = computed((): DatasetRow<T, ID>[] => [...data().entries()].map(([id, item]) => createDatasetRow(id, item, columns())));

  return (request: SciTableIdsRequest): Observable<ID[]> => {
    return toObservable(computed(() => {
      const rows = dataset();

      return untracked(() => rows
        .filter(row => matchesRow(row, request.columnFilters) && matchesGlobalFilter(row, request.tableFilter ?? undefined))
        .sort((a, b) => compareRows(a, b, request.sortCriteria)))
        .map(row => row.id);
    }));
  };
}

function createDatasetRow<T, ID>(id: ID, item: T, columns: SciTableColumnLike<T>[]): DatasetRow<T, ID> {
  return {
    id,
    item,
    cells: columns.reduce((cells, column) => {
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
        value: 'value' in column ? coerceSignal(value as Signal<string | number | boolean> | undefined, {coerceUndefined: true})() : undefined,
      });
    }, new Map<`column:${string}`, DatasetCell>()),
  };
}

interface DatasetRow<T, ID> {
  id: ID;
  item: T;
  cells: Map<`column:${string}`, DatasetCell>;
}

interface TreeDatasetRow<T, ID> extends DatasetRow<T, ID> {
  parent?: ID;
}

interface DatasetCell {
  column: SciTableColumn;
  value: string | number | boolean | undefined;
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
    if (!cell.column.matches(columnFilter.text, {item: row.item, value: cell.value})) { // component and template columns have no value
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

    const comparison = cell1.column.compare({item: row1.item, value: cell1.value}, {item: row2.item, value: cell2.value});
    if (comparison !== 0) {
      const signum = criterion.direction === 'asc' ? 1 : -1;
      return signum * comparison;
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
