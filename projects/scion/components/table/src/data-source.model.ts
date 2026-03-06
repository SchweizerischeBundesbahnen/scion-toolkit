import {computed, effect, linkedSignal, signal, Signal} from '@angular/core';
import {SciBooleanCell, SciCell, SciColumn, SciGetItemsOptions, SciGetItemsPagination, SciNumberCell, SciRow, SciStringCell} from './table.model';
import {coerceSignal} from './common';
import {CollectionViewer, DataSource} from '@angular/cdk/collections';
import {Observable, Subject} from 'rxjs';
import {debounceTime, takeUntil} from 'rxjs/operators';
import {toObservable} from '@angular/core/rxjs-interop';

const mapRecordToRow = <T>(record: T, columns: SciColumn<T>[]): SciRow<T> => ({
  item: record,
  cells: columns.map(col => ({
    label: col.type !== 'custom' ? coerceSignal(col.label(record)) : undefined,
    component: col.type === 'custom' ? col.component(record) : undefined,
    type: col.type,
    columnName: col.name,
  } as SciCell)),
});

export type Response<T> = {
  state: 'resolved';
  value: T;
} | {state: 'loading'} | {state: 'error'};

export interface SciDataSource<T> {
  size: Signal<number>;
  getItems(pagination: SciGetItemsPagination, options: SciGetItemsOptions, columns: Signal<SciColumn<T>[]>): Signal<Response<SciRow<T>[]>>;
}

export class SciCdkDataSource<T> extends DataSource<SciRow<T>> {
  public sort = signal<{columnName: string; direction: 'asc' | 'desc'}[]>([]);
  public filter = signal<{columnName: string; text: string}[]>([]);

  private _items = linkedSignal(() => new Array<SciRow<T>>(this._dataSource().size()).fill({item: {} as T, cells: []}));
  private _items$ = toObservable(this._items);
  private _destroy$ = new Subject<void>();
  private _page = signal({start: 0, end: 0});

  private _currentPage = computed(() => {
    const page = this._page();
    const dataSource = this._dataSource();
    const sortCriteria = this.sort();
    const filterCriteria = this.filter();

    const response = dataSource.getItems({
      start: page.start,
      end: page.end,
      pageSize: page.end - page.start,
    }, {sortCriteria, filterCriteria}, this._columns);

    return {page, response};
  });

  constructor(private _dataSource: Signal<SciDataSource<T>>, private _columns: Signal<SciColumn<T>[]>) {
    super();

    effect(() => {
      const {page, response} = this._currentPage();
      const res = response();
      if (res.state !== 'resolved') {
        return;
      }

      this._items.update(old => {
        const newItems = [...old];
        newItems.splice(page.start, page.end - page.start, ...res.value);
        return newItems;
      });
    });
  }

  public connect(collectionViewer: CollectionViewer): Observable<SciRow<T>[]> {
    collectionViewer.viewChange.pipe(
      debounceTime(10),
      takeUntil(this._destroy$),
    ).subscribe(viewChange => this._page.set(viewChange));
    return this._items$;
  }

  public disconnect(collectionViewer: CollectionViewer): void {
    this._destroy$.next();
    this._destroy$.complete();
  }
}

export class SciRemoteDataSource<T> implements SciDataSource<T> {
  public size = signal(50);

  constructor(private _getItems: (pagination: SciGetItemsPagination, options: SciGetItemsOptions) => Signal<T[]>) {
  }

  public getItems(pagination: SciGetItemsPagination, options: SciGetItemsOptions, columns: Signal<SciColumn<T>[]>): Signal<Response<SciRow<T>[]>> {
    const items = this._getItems(pagination, options);
    return computed(() => ({
      state: 'resolved',
      value: items().map(r => mapRecordToRow(r, columns())),
    }));
  }
}

export class SciArrayDataSource<T> implements SciDataSource<T> {
  public size = computed(() => this._data().length);

  constructor(private _data: Signal<T[]>) {
  }

  private sort(a: SciRow<T>, b: SciRow<T>, sortCriteria: {columnIndex: number; column: SciColumn<T>; direction: 'asc' | 'desc'}[]): number {
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
          case 'custom':
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

  public getItems(pagination: SciGetItemsPagination, options: SciGetItemsOptions, columnsSignal: Signal<SciColumn<T>[]>): Signal<Response<SciRow<T>[]>> {
    console.log('GET ITEMS', pagination);

    // Fake loading
    const loading = signal(true);
    setTimeout(() => {
      loading.set(false);
    }, 1000);

    return computed(() => {
      const data = this._data();
      const columns = columnsSignal();
      const l = loading();
      if (l) {
        return {state: 'loading'};
      }

      const sortCols = options.sortCriteria.map(sc => ({
        columnIndex: columns.findIndex(c => sc.columnName === c.name),
        column: columns.find(c => sc.columnName === c.name),
        direction: sc.direction,
      })).filter((sc): sc is {
        columnIndex: number;
        column: SciColumn<T>;
        direction: 'asc' | 'desc';
      } => sc.columnIndex >= 0);

      const items = data.map(r => mapRecordToRow(r, columns))
        .sort((a, b) => this.sort(a, b, sortCols))
        .slice(pagination.start, pagination.end);

      return {
        state: 'resolved',
        value: items,
      };
    });
  }
}
