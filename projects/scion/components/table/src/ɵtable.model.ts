/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, EffectCleanupRegisterFn, InjectionToken, isSignal, linkedSignal, signal, Signal, untracked, WritableSignal} from '@angular/core';
import {SciDataLoaderFn, SciFilterCriterion, SciSortCriterion, SciTableRequest} from './table-data-source';
import {ColumnType, RowActionFn, SciCellContext, SciCellLike, SciColumnLike, SciRow, SciTable, SciTableDescriptor} from './table.model';
import {ɵSciTableFactory} from './ɵtable.factory';
import {coerceObservable, rangeInclusive} from './common';
import {DefaultSciTableStorage, SciTableStorage} from './table-storage';
import {SciColumnDescriptors} from './table.factory';
import {UUID} from '@scion/toolkit/uuid';
import {coerceSignal} from '@scion/components/common';
import {Arrays, Objects} from '@scion/toolkit/util';
import {arrayDataSource} from './ɵarray-data-source';
import {TableCache, TableCacheEntry} from './table.cache';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {filter, skip} from 'rxjs';

interface StoredTable {
  columns: {name: string; width: number | undefined}[];
}

export const ɵSCI_TABLE = new InjectionToken<Signal<ɵSciTable<unknown>>>('ɵSciTable');

export class ɵSciTable<T, ID = T> implements SciTable<T, ID> {

  public readonly columns: WritableSignal<SciColumnLike<T>[]>;
  public readonly dataLoaderFn: SciDataLoaderFn<T>;
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
  private readonly _selectedItems = signal<Set<ID>>(new Set());
  private readonly _visibleRowCount = signal<number>(0);
  private readonly _totalCount = signal<number | undefined>(undefined);
  private readonly _scrollTop = signal<number>(0);
  private readonly _storedTable = signal<StoredTable | undefined>(undefined);

  public readonly criteria = computed(() => ({sort: this._sortCriteria(), filter: this._filterCriteria()}));
  public readonly range = this.computeRange();
  public readonly pageSize = linkedSignal<number, number>({
    source: () => this.visibleRowCount(),
    // PageSize should never be smaller than the minimum size (30).
    computation: (visibleRowCount, previous) => Math.max(visibleRowCount, previous?.value ?? 5),
  });

  public readonly pages = computed(() => {
    const {start, end} = this.range();
    const pageSize = this.pageSize();
    const startPage = Math.floor(start / pageSize);
    const endPage = Math.floor((end - 1) / pageSize); // `end` is exclusive, so use the last included index (`end - 1`) for page calculation.
    return rangeInclusive(startPage, endPage);
  }, {equal: (a, b) => Objects.isEqual(a, b)});

  private readonly _activeItem = linkedSignal({
    source: () => this.criteria(),
    computation: () => undefined as ID | undefined,
  });

  /**
   * Like _activeItem but also changes on row hover.
   */
  private readonly _hoveredItem = linkedSignal(() => this._activeItem());

  /**
   * True, if all rows are selected.
   * Since we don't know all row ids (lazy data source) we can't select all rows with _selectedItems.
   * Resets, as soon as selection changes again.
   */
  private readonly _allSelected = linkedSignal({
    source: () => this._selectedItems(),
    computation: () => false,
  });

  private readonly _cache = new TableCache<T, ID>();

  public readonly rowsByIndex = computed(() => {
    const rows = new Map<number, SciRow<T, ID>>();

    for (const page of this._cache.values()) {
      const items = page.items();
      if (!items) {
        continue;
      }

      items.forEach((item, index) => rows.set(page.start + index, item));
    }

    return rows;
  });

  public readonly rows = computed(() => {
    const pageSize = this.pageSize();
    const visiblePages = this.pages();
    const rowsByIndex = this.rowsByIndex();
    const {start, end} = this.range();
    const totalCount = this._totalCount();

    if (visiblePages.length <= 0) {
      return [];
    }

    const firstPageStart = visiblePages[0]! * pageSize;
    const lastPageEnd = (visiblePages.at(-1)! + 1) * pageSize;

    // Populate rows with cached rows in the loaded page window, fallback to row shell to show skeleton.
    const rows = Array.from({length: Math.min(lastPageEnd - firstPageStart, totalCount ?? pageSize)}, (_, i) => {
      return rowsByIndex.get(firstPageStart + i) ?? {};
    });

    // Only return the rows which are actually in the viewport.
    return rows.slice(start - firstPageStart, end - firstPageStart);
  });

  public readonly activeIndex = computed(() => this.indexById(this._activeItem(), this.rowsByIndex()));
  public readonly hoveredIndex = computed(() => this.indexById(this._hoveredItem(), this.rowsByIndex()));

  public readonly sortCriteria = this._sortCriteria.asReadonly();
  public readonly filterCriteria = this._filterCriteria.asReadonly();
  public readonly activeItem = this._activeItem.asReadonly();
  public readonly selectedItems = this._selectedItems.asReadonly();
  public readonly allSelected = this._allSelected.asReadonly();
  public readonly visibleRowCount = this._visibleRowCount.asReadonly();
  public readonly totalCount = this._totalCount.asReadonly();
  public readonly scrollTop = this._scrollTop.asReadonly();

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

    this.columns = linkedSignal(() => {
      const storedTable = this._storedTable();
      // Wait for storedTable to be available before initializing columns.
      if (storedTable === undefined) {
        return [];
      }
      return factory.columns().map((column, index) => this.initColumn(column.type, column, index, storedTable));
    });

    this.dataLoaderFn = isSignal(descriptor.data) ? arrayDataSource(descriptor.data, this.columns) : descriptor.data;

    toObservable(this.criteria).pipe(
      skip(1), // skip first emission to avoid race condition with loader on initialization.
      takeUntilDestroyed(),
    ).subscribe(() => {
      this._cache.clear(); // clear cache as soon as criteria change.
    });

    void this.readTableStorage();
    this.installTablePersister();
  }

  public setVisibleRowCount(count: number): void {
    this._visibleRowCount.set(count);
  }

  private loadPage(request: SciTableRequest, onCleanup: EffectCleanupRegisterFn): void {
    const cacheKey = `${request.start}-${request.end}` as const;

    const items = signal<T[] | undefined>(undefined);
    const subscription = coerceObservable(this.dataLoaderFn(request)).subscribe(result => {
      console.log(result);
      this._totalCount.set(result.totalCount);
      items.set(result.items);
    });

    onCleanup(() => {
      this._cache.deleteIfEmpty(cacheKey);
    });

    const cacheEntry: TableCacheEntry<T, ID> = {
      items: computed(() => {
        const resolved = items();
        const columns = this.columns();
        return untracked(() => resolved ? this.mapItemsToRow(resolved, columns) : undefined);
      }),
      dispose: () => subscription.unsubscribe(),
      start: request.start,
      end: request.end,
    };

    this._cache.set(cacheKey, cacheEntry);
  }

  public loadPages({pages, pageSize, sortCriteria, filterCriteria, onCleanup}: {pages: number[]; pageSize: number; sortCriteria: SciSortCriterion[]; filterCriteria: SciFilterCriterion[]; onCleanup: EffectCleanupRegisterFn}): void {
    for (const page of pages) {
      const pageStart = page * pageSize;
      const pageEnd = pageStart + pageSize;
      if (this._cache.has(`${pageStart}-${pageEnd}`)) {
        continue;
      }

      this.loadPage({
        start: pageStart,
        end: pageEnd,
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
    this.columns.update(columns => columns.map(column => column.name === columnName ? {
      ...column,
      absoluteWidth: Math.max(column.minWidth, Math.min(column.maxWidth ?? width, width)),
    } : column));
  }

  public setActiveItem(id: ID | undefined): void {
    this._activeItem.set(id);
  }

  public setHoveredItem(id: ID | undefined): void {
    this._hoveredItem.set(id);
  }

  public updateSelectedItems(updateFn: (ids: Set<ID>) => Set<ID>): void {
    this._selectedItems.update(updateFn);
  }

  public selectAll(): void {
    this._selectedItems.set(new Set());
    this._allSelected.set(true);
  }

  private installTablePersister(): void {
    toObservable(this.columns).pipe(
      filter(columns => columns.length > 0), // don't persist when columns are not yet loaded
      skip(1),
    ).subscribe(columns => {
      const storedTable = {
        columns: columns.map(col => ({name: col.name, width: col.absoluteWidth})),
      } satisfies StoredTable;

      void untracked(() => this.tableStorage.store(this.storageKey, JSON.stringify(storedTable)));
    });
  }

  private initColumn(type: ColumnType, config: SciColumnDescriptors<T>, index: number, storedTable: StoredTable | undefined): SciColumnLike<T> {
    // columns with a custom component or template must provide a sort function to be sortable, because the default sort function does not work.
    const sortable = type === 'component' || type === 'template' ?
      !!config.sort :
      config.sort !== false;

    // columns with a custom component or template must provide a filter function to be filterable, because the default filter function does not work.
    const filterable = type === 'component' || type === 'template' ?
      !!config.filter :
      config.filter !== false;

    const name = config.name ?? index.toString();
    const storedColumn = storedTable?.columns.find(column => column.name === name);

    return {
      ...config,
      type,
      name,
      filter: typeof config.filter === 'function' ? config.filter : defaultFilter,
      sort: typeof config.sort === 'function' ? config.sort : defaultSort,
      sortable: computed(() => sortable && this.sortable()),
      filterable: computed(() => filterable && this.filterable()),
      resizable: computed(() => (config.resizable ?? true) && this.resizable()),
      header: coerceSignal(config.header ?? ''),
      absoluteWidth: storedColumn?.width,
      width: config.width ?? '1fr',
      minWidth: config.minWidth ?? 100,
      maxWidth: config.maxWidth,
    } as SciColumnLike<T>;
  }

  private get storageKey(): string {
    return `sci-table-${this.name()}`;
  }

  private indexById(id: ID | undefined, rowsByIndex: Map<number, SciRow<T, ID>>): number {
    if (id === undefined) {
      return -1;
    }

    for (const [index, row] of rowsByIndex) {
      if (row.id === id) {
        return index;
      }
    }
    return -1;
  }

  public mapItemsToRow(items: T[], columns: SciColumnLike<T>[]): SciRow<T, ID>[] {
    return items.map(item => {
      const rowName = Arrays.coerce(this.rowName?.(item));
      return ({
        item: item,
        id: this.identity?.(item) ?? item as unknown as ID,
        cells: columns.map(column => ({
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

  public dispose(): void {
    this._cache.clear();
  }

  private computeRange(): Signal<{start: number; end: number}> {
    return computed(() => {
      const firstVisible = Math.floor(this._scrollTop() / this.itemSize());
      const start = Math.max(0, firstVisible - this.overscan());
      return {start, end: start + this._visibleRowCount()};
    });
  }

  private async readTableStorage(): Promise<void> {
    const saved = await this.tableStorage.load(this.storageKey);
    if (!saved) {
      this._storedTable.set({columns: []});
      return;
    }

    try {
      this._storedTable.set(JSON.parse(saved) as StoredTable);
    }
    catch (error) {
      console.warn(`Failed to parse item from storage.`, error);
      this._storedTable.set({columns: []});
    }
  }

  public setScrollTop(scrollTop: number): void {
    this._scrollTop.set(scrollTop);
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
