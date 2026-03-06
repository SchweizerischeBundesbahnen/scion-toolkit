import {computed, Signal} from '@angular/core';
import {SciBooleanCell, SciCell, SciColumns, SciNumberCell, SciRow, SciStringCell, SciTableRequest, SciTableResponse} from './table.model';
import {coerceSignal} from './common';
import {Observable} from 'rxjs';

const mapRecordToRow = <T>(record: T, columns: SciColumns<T>[]): SciRow<T> => ({
  item: record,
  cells: columns.map(col => ({
    label: col.type !== 'custom' ? coerceSignal(col.label(record)) : undefined,
    component: col.type === 'custom' ? col.component(record) : undefined,
    type: col.type,
    columnName: col.name,
  } as SciCell)),
});

export interface SciDataSource<T> {
  getItems(request: SciTableRequest, columns: SciColumns<T>[]): Observable<SciTableResponse<SciRow<T>>> | Promise<SciTableResponse<SciRow<T>>> | SciTableResponse<SciRow<T>>;
}

// export class SciRemoteDataSource<T> implements SciDataSource<T> {
//   public size = signal(50);
//
//   constructor(private _getItems: (pagination: SciGetItemsPagination, options: SciTableRequest) => Signal<T[]>) {
//   }
//
//   public getItems(pagination: SciGetItemsPagination, options: SciTableRequest, columns: Signal<SciColumns<T>[]>): Signal<Data<SciRow<T>[]>> {
//     const items = this._getItems(pagination, options);
//     return computed(() => ({
//       state: 'resolved',
//       value: items().map(r => mapRecordToRow(r, columns())),
//     }));
//   }
// }

export class SciArrayDataSource<T> implements SciDataSource<T> {
  public size = computed(() => this._data().length);

  constructor(private _data: Signal<T[]>) {
  }

  private sort(a: SciRow<T>, b: SciRow<T>, sortCriteria: {columnIndex: number; column: SciColumns<T>; direction: 'asc' | 'desc'}[]): number {
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
          // case 'custom':
          //   return criterion.column.sort({item: a.item, label: undefined}, {item: b.item, label: undefined});
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

  public getItems(request: SciTableRequest, columns: SciColumns<T>[]): SciTableResponse<SciRow<T>> {
    const data = this._data();

    const sortCols = request.sortCriteria.map(sc => ({
      columnIndex: columns.findIndex(c => sc.columnName === c.name),
      column: columns.find(c => sc.columnName === c.name),
      direction: sc.direction,
    })).filter((sc): sc is {
      columnIndex: number;
      column: SciColumns<T>;
      direction: 'asc' | 'desc';
    } => sc.columnIndex >= 0);

    const items = data.map(r => mapRecordToRow(r, columns))
      .sort((a, b) => this.sort(a, b, sortCols))
      .slice(request.start, request.end);

    return {
      items,
      totalCount: data.length,
    };
  }
}
