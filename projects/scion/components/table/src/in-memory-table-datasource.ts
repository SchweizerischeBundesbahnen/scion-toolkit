/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciTableColumnFilter, SciTableDatasourceQuery, SciTableSortCriterion, SciTreeTableNode, SciTreeTableDatasource} from './table-datasource';
import {SciTableColumn} from './table.model';
import {computed, inject, runInInjectionContext, Signal, untracked} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {SciTableCellValuePreloader} from './table-cell-value-preloader';
import {Arrays} from '@scion/toolkit/util';
import {SciDateValue} from './table-date-column.model';
import {SciEnumValue} from './table-enum-column.model';
import {ɵSingleActiveInjectorFactory} from '@scion/components/common';
import {MaybeAsync} from '@scion/toolkit/types';
import {ɵSciTable} from './ɵtable.model';

export class SciInMemoryTableDatasource<T, ID> implements SciTreeTableDatasource<T, ID> {

  private readonly _rows: Signal<Map<ID, Row<T, ID>>>;

  constructor(data: Signal<T[]>, table: ɵSciTable<T, ID>, options?: {children?: (node: T) => T[]}) {
    const tableCellValuePreloader = inject(SciTableCellValuePreloader);
    const injectorFactory = new ɵSingleActiveInjectorFactory();

    this._rows = computed((): Map<ID, Row<T, ID>> => {
      // Create new value function injector, releasing resources allocated in column value functions.
      const injector = injectorFactory.create();

      // Cancel preloading of previous data.
      tableCellValuePreloader.clear();

      return data()
        .flatMap(item => createRow(item))
        .reduce((map, row) => map.set(row.id, row), new Map<ID, Row<T, ID>>());

      function createRow(item: T, parent?: {id: ID}): Row<T, ID>[] {
        const id = table.trackBy(item);
        return [
          {
            id,
            parentId: parent?.id,
            item,
            cells: table.columns().reduce((cells, column) => untracked(() => {
              // PERF: Cell values are computed lazily (on idle or first use) to defer expensive computations like date formatting.
              const tableCellValue = 'value' in column ? new eSciTableCellValue(tableCellValuePreloader, () => runInInjectionContext(injector, () => column.value(item)())) : undefined;
              return cells.set(column.name, {
                column: column as SciTableColumn,
                value: () => tableCellValue?.value(),
              });
            }), new Map<`column:${string}`, Cell>()),
          },
          // Child rows if a tree structure.
          ...options?.children?.(item).flatMap(child => createRow(child, {id})) ?? [],
        ];
      }
    });
  }

  public getTreeTableNodes(query: SciTableDatasourceQuery): MaybeAsync<SciTreeTableNode<ID>[]> {
    return toObservable(computed(() => {
      const rows = this._rows();

      // PERF: Do not track signals inside `Array.sort` to avoid Angular signal tracking overhead as the comparator runs repeatedly, degrading performance otherwise.
      return untracked(() => [...rows.values()]
        .filter(row => matchesRow(row, query.columnFilters, {coerceEnumValueToArray: true}) && matchesGlobalFilter(row, query.tableFilter, {coerceEnumValueToArray: false}))
        .sort((a, b) => compareRows(a, b, query.sortCriteria))
        .map(row => ({id: row.id, parentId: row.parentId})));
    }));
  }

  public getItems(ids: ID[]): MaybeAsync<T[]> {
    return toObservable(computed(() => ids.flatMap(id => this._rows().has(id) ? this._rows().get(id)!.item : [])));
  }
}

interface Row<T, ID> {
  id: ID;
  parentId?: ID;
  item: T;
  cells: Map<`column:${string}`, Cell>;
}

interface Cell {
  column: SciTableColumn;
  value: () => string | number | boolean | SciDateValue | SciEnumValue | undefined;
}

/**
 * Tests whether a row matches the given global filter.
 */
function matchesGlobalFilter<T, ID>(row: Row<T, ID>, filter: string | undefined, options: {coerceEnumValueToArray: boolean}): boolean {
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
function matchesRow<T, ID>(row: Row<T, ID>, columnFilters: SciTableColumnFilter[], options: {coerceEnumValueToArray: boolean}): boolean {
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
function compareRows<T, ID>(row1: Row<T, ID>, row2: Row<T, ID>, sortCriteria: SciTableSortCriterion[]): number {
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
