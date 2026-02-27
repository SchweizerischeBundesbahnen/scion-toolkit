/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, EffectCleanupRegisterFn, InjectionToken, isSignal, linkedSignal, signal, Signal} from '@angular/core';
import {SciDataSourceDescriptor, SciFilterCriterion, SciSortCriterion, SciTableRequest} from './table-data-source';
import {ColumnType, RowActionFn, SciCellContext, SciCellLike, SciColumnLike, SciRow, SciTable, SciTableDescriptor} from './table.model';
import {ɵSciTableFactory} from './ɵtable.factory';
import {ɵSciArrayDataSource} from './ɵarray-data-source';
import {coerceObservable} from './common';
import {DefaultSciTableStorage, SciTableStorage} from './table-storage';
import {SciColumnDescriptors} from './table.factory';
import {UUID} from '@scion/toolkit/uuid';
import {coerceSignal} from '@scion/components/common';
import {Arrays} from '@scion/toolkit/util';

interface StoredTable {
  columnWidths: {columnName: string; width: number}[];
}

export const ɵSCI_TABLE = new InjectionToken<Signal<ɵSciTable<unknown>>>('ɵSciTable');

interface PageCacheEntry<T, ID> {
  items: Signal<SciRow<T, ID>[] | undefined>;
  dispose: () => void;
}

export class ɵSciTable<T, ID = T> implements SciTable<T, ID> {

  public readonly columns: Signal<SciColumnLike<T>[]>;
  public readonly dataSource: SciDataSourceDescriptor<T>;
  public readonly tableStorage: SciTableStorage;
  public readonly identity?: (item: T) => ID;
  public readonly rowActions?: RowActionFn<T>;
  public readonly rowName?: (item: T) => string | string[] | undefined;

  public readonly itemSize: Signal<number>;
  public readonly overscan: Signal<number>;
  public readonly name: Signal<string | undefined>;
  public readonly sortable: Signal<boolean>;
  public readonly filterable: Signal<boolean>;
  public readonly resizable: Signal<boolean>;
  public readonly selectionType: Signal<'single' | 'multi' | 'disabled'>;
  public readonly headerVisible: Signal<boolean>;
  public readonly id = UUID.randomUUID();

  private readonly _sortCriteria = signal<SciSortCriterion[]>([]);
  private readonly _filterCriteria = signal<SciFilterCriterion[]>([]);
  private readonly _columnWidths = signal(new Map<string, number>());
  private readonly _selectedItems = signal<Set<ID>>(new Set());
  private readonly _visibleRowCount = signal<number>(0);
  private readonly _totalCount = signal<number>(0);

  public readonly criteria = computed(() => ({sort: this._sortCriteria(), filter: this._filterCriteria()}));

  private readonly _focusedItem = linkedSignal({
    source: () => this.criteria(),
    computation: () => undefined as ID | undefined,
  });

  /**
   * Like _focusedItem but also changes on row hover.
   */
  private readonly _activeItem = linkedSignal(() => this._focusedItem());

  /**
   * True, if all rows are selected.
   * Since we don't know all row ids (lazy data source) we can't select all rows with _selectedItems.
   * Resets, as soon as selection changes again.
   */
  private readonly _allSelected = linkedSignal({
    source: () => this._selectedItems(),
    computation: () => false,
  });

  // TODO [table]: Add logic to evict pages from cache to prevent it from getting too large
  private readonly _pagesCache = linkedSignal<unknown, Map<number, PageCacheEntry<T, ID>>>({
    source: () => ({criteria: this.criteria(), visibleRowCount: this.visibleRowCount()}),
    computation: (_, value) => {
      for (const cacheEntry of value?.value.values() ?? []) {
        cacheEntry.dispose();
      }
      return new Map();
    },
  });

  public readonly rows = computed(() => {
    const count = this._visibleRowCount();
    const totalCount = this._totalCount();
    const pages = [...this._pagesCache().entries()]
      .filter(([_, entry]) => !!entry.items())
      .map(([start, entry]) => ({
        start,
        rows: entry.items(),
      }));

    if (pages.length <= 0) {
      return new Array<SciRow<T, ID>>(count).fill({});
    }

    // Create shallow row for each possible row item.
    // Then populate the rows which are resolved.
    const rows = new Array<SciRow<T, ID>>(totalCount).fill({});
    for (const page of pages) {
      rows.splice(page.start, page.rows!.length, ...page.rows!);
    }
    return rows;
  });

  public readonly sortCriteria = this._sortCriteria.asReadonly();
  public readonly filterCriteria = this._filterCriteria.asReadonly();
  public readonly columnWidths = this._columnWidths.asReadonly();
  public readonly focusedItem = this._focusedItem.asReadonly();
  public readonly activeItem = this._activeItem.asReadonly();
  public readonly selectedItems = this._selectedItems.asReadonly();
  public readonly allSelected = this._allSelected.asReadonly();
  public readonly visibleRowCount = this._visibleRowCount.asReadonly();
  public readonly totalCount = this._totalCount.asReadonly();

  constructor(factory: ɵSciTableFactory<T>, descriptor: SciTableDescriptor<T, ID>) {
    this.itemSize = coerceSignal(descriptor.itemSize ?? 30);
    this.overscan = coerceSignal(descriptor.overscan ?? 3);
    this.name = coerceSignal(descriptor.name, {coerceUndefined: true});
    this.sortable = coerceSignal(descriptor.sortable ?? true);
    this.filterable = coerceSignal(descriptor.filterable ?? true);
    this.headerVisible = coerceSignal(descriptor.showHeader ?? true);
    this.resizable = coerceSignal(descriptor.resizable ?? true);
    this.selectionType = coerceSignal(descriptor.selectionType ?? 'multi');

    this.tableStorage = descriptor.tableStorage ?? new DefaultSciTableStorage();

    this.rowActions = descriptor.rowActions;
    this.rowName = descriptor.rowName;
    this.identity = descriptor.identity;

    this.columns = computed(() => factory.columns().map(column => this.initColumn(column.type, column)));

    this.dataSource = isSignal(descriptor.data) ?
      new ɵSciArrayDataSource(descriptor.data, this.columns) :
      typeof descriptor.data === 'function' ? {loader: descriptor.data} : descriptor.data;

    void this.initColumnWidths();
  }

  public setVisibleRowCount(count: number): void {
    this._visibleRowCount.set(count);
  }

  private loadPage(request: SciTableRequest, onCleanup: EffectCleanupRegisterFn): void {
    const items = signal<T[] | undefined>(undefined);
    const subscription = coerceObservable(this.dataSource.loader(request)).subscribe(result => {
      this._totalCount.set(result.totalCount);
      items.set(result.items);
    });

    onCleanup(() => {
      // Only remove page from cache if it has not loaded any data yet.
      const empty = !this._pagesCache().get(request.start)?.items();
      if (empty && this._pagesCache().has(request.start)) {
        subscription.unsubscribe();
        this._pagesCache.update(cache => {
          const newCache = new Map(cache);
          newCache.delete(request.start);
          return newCache;
        });
      }
    });

    const cacheEntry: PageCacheEntry<T, ID> = {
      items: computed(() => items() ? this.mapItemsToRow(items()!) : undefined),
      dispose: () => subscription.unsubscribe(),
    };

    this._pagesCache.update(cache => new Map(cache).set(request.start, cacheEntry));
  }

  public loadPages({pages, pageSize, sortCriteria, filterCriteria, onCleanup}: {pages: number[]; pageSize: number; sortCriteria: SciSortCriterion[]; filterCriteria: SciFilterCriterion[]; onCleanup: EffectCleanupRegisterFn}): void {
    for (const page of pages) {
      const pageStart = page * pageSize;
      if (this._pagesCache().has(pageStart)) {
        continue;
      }

      this.loadPage({
        start: pageStart,
        end: pageStart + pageSize,
        pageSize,
        page,
        sortCriteria,
        filterCriteria,
      }, onCleanup);
    }
  }

  public sort(columnName: string, multi: boolean): void {
    if (!this.sortable()) {
      return;
    }

    this._sortCriteria.update(sort => {
      const existing = sort.find(sc => sc.columnName === columnName);
      const other = sort.filter(sc => sc !== existing);

      const direction = existing ? (existing.direction === 'asc' ? 'desc' : undefined) : 'asc';
      if (!direction) {
        return multi ? other : [];
      }

      const newSort = {columnName, direction} satisfies SciSortCriterion;
      return multi ? [...other, newSort] : [newSort];
    });
  }

  public resetSort(): void {
    this._sortCriteria.set([]);
  }

  public filter(columnName: string, text: string | number | boolean | null): void {
    if (!this.filterable()) {
      return;
    }

    this._filterCriteria.update(filter => {
      const other = filter.filter(f => f.columnName !== columnName);
      if (text === null) {
        return other;
      }

      return [
        ...other,
        {columnName, text},
      ];
    });
  }

  public resetFilter(): void {
    this._filterCriteria.set([]);
  }

  public setResizedColumn(columnName: string, width: number): void {
    const column = this.columns().find(c => c.name === columnName);
    if (!column) {
      return;
    }

    this._columnWidths.update(columns => new Map(columns).set(columnName, Math.max(column.minWidth(), Math.min(column.maxWidth() ?? width, width))));

    // Save all named columns to the storage, so they will be available on page reload.
    const columnWidths = [...this.columnWidths().entries()]
      .filter(([columnName]) => this.columns().find(c => c.name === columnName)?.named)
      .map(([columnName, width]) => ({width, columnName}));

    if (!this.name() || columnWidths.length === 0) {
      return;
    }

    void this.tableStorage.store(this.storageKey, JSON.stringify({columnWidths}));
  }

  public setFocusedItem(id: ID | undefined): void {
    this._focusedItem.set(id);
  }

  public setActiveItem(id: ID | undefined): void {
    this._activeItem.set(id);
  }

  public updateSelectedItems(updateFn: (ids: Set<ID>) => Set<ID>): void {
    this._selectedItems.update(updateFn);
  }

  public selectAll(): void {
    this._selectedItems.set(new Set());
    this._allSelected.set(true);
  }

  private initColumn(type: ColumnType, config: SciColumnDescriptors<T>): SciColumnLike<T> {
    // columns with a custom component or template must provide a sort function to be sortable, because the default sort function does not work.
    const sortable = type === 'component' || type === 'template' ?
      !!config.sort :
      config.sort !== false;

    // columns with a custom component or template must provide a filter function to be filterable, because the default filter function does not work.
    const filterable = type === 'component' || type === 'template' ?
      !!config.filter :
      config.filter !== false;

    return {
      ...config,
      type,
      name: config.name ?? UUID.randomUUID(),
      named: !!config.name,
      filter: typeof config.filter === 'function' ? config.filter : defaultFilter,
      sort: typeof config.sort === 'function' ? config.sort : defaultSort,
      sortable: sortable && this.sortable(),
      filterable: filterable && this.filterable(),
      resizable: (config.resizable ?? true) && this.resizable(),
      header: coerceSignal(config.header ?? ''),
      width: coerceSignal(config.width ?? 'min-content'),
      minWidth: coerceSignal(config.minWidth ?? 100),
      maxWidth: coerceSignal(config.maxWidth, {coerceUndefined: true}),
    } as SciColumnLike<T>;
  }

  private get storageKey(): string {
    return `sci-table-${this.name()}`;
  }

  public mapItemsToRow(items: T[]): SciRow<T, ID>[] {
    return items.map(item => {
      const rowName = Arrays.coerce(this.rowName?.(item));
      return ({
        item: item,
        id: this.identity?.(item) ?? item as unknown as ID,
        cells: this.columns().map(column => ({
          value: column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item)) : undefined,
          component: column.type === 'component' ? column.component(item) : undefined,
          template: column.type === 'template' ? coerceSignal(column.template(item)) : undefined,
          type: column.type,
          columnName: column.name,
          name: [column.name, ...rowName],
        } as SciCellLike)),
      });
    });
  }

  private async initColumnWidths(): Promise<void> {
    const saved = await this.tableStorage.load(this.storageKey);
    if (!saved) {
      return;
    }

    try {
      const parsed = JSON.parse(saved) as StoredTable;
      const savedColumnWidths = parsed.columnWidths.reduce((columns, column) => columns.set(column.columnName, column.width), new Map<string, number>());
      this._columnWidths.set(savedColumnWidths);
    }
    catch (error) {
      console.warn(`Failed to parse item from storage.`, error);
    }
  }
}

function defaultFilter<T>(text: string | boolean | number, {value}: SciCellContext<T, string | boolean | number>): boolean {
  if (typeof value !== typeof text) {
    return false;
  }

  switch (typeof value) {
    case 'string':
      return value.toLowerCase().includes((text as string).toLowerCase());
    default:
      return text === value;
  }
}

function defaultSort<T>(a: SciCellContext<T, string | boolean | number>, b: SciCellContext<T, string | boolean | number>): number {
  if (typeof a.value !== typeof b.value) {
    return 0;
  }

  switch (typeof a.value) {
    case 'string':
      return a.value.localeCompare(b.value as string);
    case 'number':
      return a.value - (b.value as number);
    case 'boolean':
      return a.value === b.value ? 0 : (a.value ? 1 : -1);
    default:
      return 0;
  }
}
