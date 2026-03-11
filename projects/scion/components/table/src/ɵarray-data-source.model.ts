/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Signal} from '@angular/core';
import {SciDataSource, SciFilterCriterion, SciSortCriterion, SciTableRequest, SciTableResponse} from './data-source.model';
import {SciBooleanCell, SciColumns, SciNumberCell, SciRow, SciStringCell} from './table.model';

type MappedCriterion<T, CRIT extends {columnName: string}> = CRIT & {
  column: SciColumns<T>;
  columnIndex: number;
};

export class ɵSciArrayDataSource<T> implements SciDataSource<SciRow<T>> {
  constructor(private _data: Signal<SciRow<T>[]>, private _columns: SciColumns<T>[]) {
  }

  public getItems(request: SciTableRequest): SciTableResponse<SciRow<T>> {
    const data = this._data();

    const sortCols = this.mapCriteria(request.sortCriteria, this._columns);
    const filterCols = this.mapCriteria(request.filterCriteria, this._columns);

    const items = data
      .filter(item => this.filter(item, filterCols))
      .sort((a, b) => this.sort(a, b, sortCols));

    return {
      items: items.slice(request.start, request.end),
      totalCount: items.length,
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

  private filter(row: SciRow<T>, filterCriteria: MappedCriterion<T, SciFilterCriterion>[]): boolean {
    if (filterCriteria.length === 0) {
      return true;
    }

    for (const criterion of filterCriteria) {
      const cell = row.cells[criterion.columnIndex];
      if (!cell) {
        continue;
      }

      const filter = (() => {
        switch (criterion.column.type) {
          case 'string':
            return criterion.column.filter(criterion.text as string, {item: row.item, value: (cell as SciStringCell).value()});
          case 'number':
            return criterion.column.filter(criterion.text as number, {item: row.item, value: (cell as SciNumberCell).value()});
          case 'boolean':
            return criterion.column.filter(criterion.text as boolean, {item: row.item, value: (cell as SciBooleanCell).value()});
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

  private sort(a: SciRow<T>, b: SciRow<T>, sortCriteria: MappedCriterion<T, SciSortCriterion>[]): number {
    if (sortCriteria.length === 0) {
      return 0;
    }

    for (const criterion of sortCriteria) {
      const aCell = a.cells[criterion.columnIndex];
      const bCell = b.cells[criterion.columnIndex];

      if (!aCell || !bCell) {
        continue;
      }

      const sort = (() => {
        switch (criterion.column.type) {
          case 'string':
            return criterion.column.sort({item: a.item, value: (aCell as SciStringCell).value()}, {item: b.item, value: (bCell as SciStringCell).value()});
          case 'number':
            return criterion.column.sort({item: a.item, value: (aCell as SciNumberCell).value()}, {item: b.item, value: (bCell as SciNumberCell).value()});
          case 'boolean':
            return criterion.column.sort({item: a.item, value: (aCell as SciBooleanCell).value()}, {item: b.item, value: (bCell as SciBooleanCell).value()});
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
