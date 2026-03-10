import {computed, Signal} from '@angular/core';
import {SciBooleanCell, SciCells, SciColumns, SciFilterCriterion, SciNumberCell, SciRow, SciSortCriterion, SciStringCell, SciTableRequest, SciTableResponse} from './table.model';
import {coerceObservable, coerceSignal, MaybeAsync} from './common';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

const mapRecordToRow = <T>(record: T, columns: SciColumns<T>[]): SciRow<T> => ({
  item: record,
  cells: columns.map(col => ({
    label: col.type !== 'component' && col.type !== 'template' ? coerceSignal(col.label(record)) : undefined,
    component: col.type === 'component' ? col.component(record) : undefined,
    template: col.type === 'template' ? coerceSignal(col.template(record)) : undefined,
    type: col.type,
    columnName: col.name,
  } as SciCells)),
});

export interface SciDataSource<T> {
  getItems(request: SciTableRequest, columns: SciColumns<T>[]): Observable<SciTableResponse<SciRow<T>>>;
}

export class SciRemoteDataSource<T> implements SciDataSource<T> {
  constructor(private _getItems: (request: SciTableRequest) => MaybeAsync<SciTableResponse<T>>) {
  }

  public getItems(request: SciTableRequest, columns: SciColumns<T>[]): Observable<SciTableResponse<SciRow<T>>> {
    return coerceObservable(this._getItems(request)).pipe(
      map(response => ({
        totalCount: response.totalCount,
        items: response.items.map(r => mapRecordToRow(r, columns)),
      })),
    );
  }
}

type MappedCriterion<T, CRIT extends {columnName: string}> = CRIT & {
  column: SciColumns<T>;
  columnIndex: number;
};

export class SciArrayDataSource<T> implements SciDataSource<T> {
  public size = computed(() => this._data().length);

  private _cache: SciRow<T>[] = [];
  private _lastRequest: SciTableRequest | undefined = undefined;

  constructor(private _data: Signal<T[]>) {
  }

  public getItems(request: SciTableRequest, columns: SciColumns<T>[]): Observable<SciTableResponse<SciRow<T>>> {
    console.log(request);

    const data = this._data();

    if (!this.isCacheInvalid(request)) {
      return of({
        items: this._cache.slice(request.start, request.end),
        totalCount: this._cache.length,
      });
    }

    const sortCols = this.mapCriteria(request.sortCriteria, columns);
    const filterCols = this.mapCriteria(request.filterCriteria, columns);

    const items = data.map(r => mapRecordToRow(r, columns))
      .filter(row => this.filter(row, filterCols))
      .sort((a, b) => this.sort(a, b, sortCols));

    this._cache = items;
    this._lastRequest = request;

    return of({
      items: items.slice(request.start, request.end),
      totalCount: items.length,
    });
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
            return criterion.column.filter(criterion.text as string, {item: row.item, label: (cell as SciStringCell).label()});
          case 'number':
            return criterion.column.filter(criterion.text as number, {item: row.item, label: (cell as SciNumberCell).label()});
          case 'boolean':
            return criterion.column.filter(criterion.text as boolean, {item: row.item, label: (cell as SciBooleanCell).label()});
          case 'component':
          case 'template':
            return criterion.column.filter(criterion.text as string, {item: row.item, label: undefined});
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
            return criterion.column.sort({item: a.item, label: (aCell as SciStringCell).label()}, {item: b.item, label: (bCell as SciStringCell).label()});
          case 'number':
            return criterion.column.sort({item: a.item, label: (aCell as SciNumberCell).label()}, {item: b.item, label: (bCell as SciNumberCell).label()});
          case 'boolean':
            return criterion.column.sort({item: a.item, label: (aCell as SciBooleanCell).label()}, {item: b.item, label: (bCell as SciBooleanCell).label()});
          case 'component':
          case 'template':
            return criterion.column.sort({item: a.item, label: undefined}, {item: b.item, label: undefined});
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

  /**
   * Checks if filter and sort criteria stayed the same and cache can be used
   */
  private isCacheInvalid(tableRequest: SciTableRequest): boolean {
    if (!this._lastRequest) {
      return true;
    }

    const {sortCriteria: newSort, filterCriteria: newFilter} = tableRequest;
    const {sortCriteria: oldSort, filterCriteria: oldFilter} = this._lastRequest;

    if (newSort.length !== oldSort.length || newFilter.length !== oldFilter.length) {
      return true;
    }

    const sortChanged = newSort.some((criterion, i) => criterion.columnName !== oldSort[i]?.columnName ||
      criterion.direction !== oldSort[i].direction,
    );
    if (sortChanged) {
      return true;
    }

    return newFilter.some((criterion, i) => criterion.columnName !== oldFilter[i]?.columnName ||
      criterion.text !== oldFilter[i].text,
    );
  }
}
