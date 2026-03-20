/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {SciDataSource, SciFilterCriterion, SciSortCriterion, SciTableRequest, SciTableResponse} from './table-data-source';
import {SciColumns} from './table.model';
import {coerceSignal} from './common';

type MappedCriterion<T, CRIT extends {columnName: string}> = CRIT & {
  column: SciColumns<T>;
  columnIndex: number;
};

interface ItemWithValues<T> {
  item: T;
  values: Array<string | number | boolean | undefined>;
}

export class ɵSciArrayDataSource<T> implements SciDataSource<T> {
  private _lastRequest: SciTableRequest | undefined;
  private _lastResponse: ItemWithValues<T>[] | undefined;

  private readonly _data: ItemWithValues<T>[];

  constructor(data: T[], private _columns: SciColumns<T>[]) {
    this._data = data.map(item => ({
      item,
      values: this._columns.map(column => column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item))() : undefined),
    }));
  }

  public getItems(request: SciTableRequest): SciTableResponse<T> {
    const sortCols = this.mapCriteria(request.sortCriteria, this._columns);
    const filterCols = this.mapCriteria(request.filterCriteria, this._columns);

    if (this._lastResponse && this.filterCriteriaSame(request.filterCriteria, this._lastRequest?.filterCriteria) && this.sortCriteriaSame(request.sortCriteria, this._lastRequest?.sortCriteria)) {
      return {
        totalCount: this._lastResponse.length,
        items: this._lastResponse.slice(request.start, request.end).map(i => i.item),
      };
    }

    const items = this._data
      .filter(item => this.filter(item, filterCols))
      .sort((a, b) => this.sort(a, b, sortCols));

    this._lastResponse = items;
    this._lastRequest = request;

    return {
      totalCount: items.length,
      items: items.slice(request.start, request.end).map(i => i.item),
    };
  }

  private mapCriteria<CRIT extends {columnName: string}>(criteria: CRIT[], columns: SciColumns<T>[]): MappedCriterion<T, CRIT>[] {
    return criteria.map(sc => {
      const columnIndex = columns.findIndex(c => sc.columnName === c.name);

      return ({
        ...sc,
        columnIndex,
        column: columns[columnIndex],
      });
    }).filter((sc): sc is MappedCriterion<T, CRIT> => sc.columnIndex >= 0);
  }

  private filterCriteriaSame(a: SciFilterCriterion[], b?: SciFilterCriterion[]): boolean {
    if (a.length !== b?.length) {
      return false;
    }

    return a.every((criterion, i) => criterion.columnName === b[i]?.columnName && criterion.text === b[i].text);
  }

  private sortCriteriaSame(a: SciSortCriterion[], b?: SciSortCriterion[]): boolean {
    if (a.length !== b?.length) {
      return false;
    }

    return a.every((criterion, i) => criterion.columnName === b[i]?.columnName && criterion.direction === b[i].direction);
  }

  private filter(row: ItemWithValues<T>, filterCriteria: MappedCriterion<T, SciFilterCriterion>[]): boolean {
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

  private sort(a: ItemWithValues<T>, b: ItemWithValues<T>, sortCriteria: MappedCriterion<T, SciSortCriterion>[]): number {
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
}
