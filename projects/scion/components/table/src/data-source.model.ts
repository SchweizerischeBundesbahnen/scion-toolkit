import {computed, effect, linkedSignal, signal, Signal} from '@angular/core';
import {SciColumn, SciGetItemsOptions, SciGetItemsPagination, SciRow} from './table.model';
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
    columnId: col.name,
  })),
});

export interface SciDataSource<T> {
  size: Signal<number>;
  getItems(pagination: SciGetItemsPagination, options: SciGetItemsOptions, columns: Signal<SciColumn<T>[]>): Signal<SciRow<T>[]>;
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

    const items = dataSource.getItems({
      start: page.start,
      end: page.end,
      pageSize: page.end - page.start,
    }, {sortCriteria, filterCriteria}, this._columns)();

    return {page, items};
  });

  constructor(private _dataSource: Signal<SciDataSource<T>>, private _columns: Signal<SciColumn<T>[]>) {
    super();

    effect(() => {
      const {page, items} = this._currentPage();

      this._items.update(old => {
        const newItems = [...old];
        newItems.splice(page.start, page.end - page.start, ...items);
        return newItems;
      });
    });
  }

  public connect(collectionViewer: CollectionViewer): Observable<SciRow<T>[]> {
    collectionViewer.viewChange.pipe(
      debounceTime(100),
      takeUntil(this._destroy$),
    ).subscribe(viewChange => this._page.set(viewChange));
    return this._items$;
    // return combineLatest([
    //   this._sort$,
    //   this._filter$,
    //   collectionViewer.viewChange,
    // ]).pipe(
    //   switchMap(([sort, filter, viewChange]) => runInInjectionContext(this._injector, () => toObservable(this._dataSource().getItems({
    //     start: viewChange.start,
    //     end: viewChange.end,
    //     pageSize: viewChange.end - viewChange.start,
    //   }, {
    //     sortCriteria: sort,
    //     filterCriteria: filter,
    //   }, this._columns)))),
    //   takeUntil(this._destroy$),
    // );
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

  public getItems(pagination: SciGetItemsPagination, options: SciGetItemsOptions, columns: Signal<SciColumn<T>[]>): Signal<SciRow<T>[]> {
    const items = this._getItems(pagination, options);
    return computed(() => items().map(r => mapRecordToRow(r, columns())));
  }
}

export class SciArrayDataSource<T> implements SciDataSource<T> {
  public size = computed(() => this._data().length);

  constructor(private _data: Signal<T[]>) {
  }

  public getItems(pagination: SciGetItemsPagination, options: SciGetItemsOptions, columnsSignal: Signal<SciColumn<T>[]>): Signal<SciRow<T>[]> {
    console.log('GET ITEMS', pagination);
    return computed(() => {
      const data = this._data();
      const columns = columnsSignal();
      return data.map(r => mapRecordToRow(r, columns))
        .slice(pagination.start, pagination.end);

      // const sortCol = columns.find(c => c.id === options.sortCriteria?.columnId);
      // if (!sortCol) {
      //   return rows.slice(pagination.offset, pagination.pageSize);
      // }
      //
      // const colIdx = columns.indexOf(sortCol);
      // const sortDir = options.sortCriteria!.direction === 'asc' ? 1 : -1;
      // return rows
      //   .sort((a, b) => sortDir * sortCol.sort(
      //     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      //     {record: a.item, label: a.cells[colIdx]?.label()} as any,
      //     // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      //     {record: b.item, label: b.cells[colIdx]?.label()} as any),
      //   )
      //   .slice(params.pagination.offset, params.pagination.pageSize);
    });
  }
}
