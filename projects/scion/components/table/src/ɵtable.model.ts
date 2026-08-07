/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, effect, EffectCleanupRegisterFn, inject, InjectionToken, Injector, isSignal, linkedSignal, signal, Signal, untracked, WritableSignal} from '@angular/core';
import {SciColumnFilter, SciDataLoaderFn, SciSortCriterion} from './table-data-source';
import {ColumnType, SciCellContext, SciCellLike, SciColumnLike, SciRow, SciRowActionFactoryFn, SciTable, SciTableDescriptor} from './table.model';
import {ɵSciTableFactory} from './ɵtable.factory';
import {coerceObservable, rangeInclusive} from './common';
import {SCI_TABLE_STORAGE} from './table-storage';
import {SciColumnDescriptors} from './table.factory';
import {UUID} from '@scion/toolkit/uuid';
import {coerceSignal} from '@scion/components/common';
import {Arrays, Objects} from '@scion/toolkit/util';
import {arrayDataSource} from './ɵarray-data-source';
import {TableCache, TableCacheEntry} from './table.cache';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {filter, skip} from 'rxjs';

interface StoredTable {
  columns: {name: string; width: string | undefined}[];
}

export const ɵSCI_TABLE = new InjectionToken<Signal<ɵSciTable<unknown>>>('ɵSciTable');

export class ɵSciTable<T> implements SciTable<T> {

  public readonly tableStorage = inject(SCI_TABLE_STORAGE);
  private readonly _injector = inject(Injector);

  public readonly instanceId = UUID.randomUUID();
  public readonly name: `table:${string}`;
  public readonly columns: WritableSignal<SciColumnLike<T>[]>;
  public readonly dataLoaderFn: SciDataLoaderFn<T>;
  public readonly trackBy?: (item: T) => unknown;
  public readonly rowActions?: SciRowActionFactoryFn<T>;
  public readonly rowName?: (item: T) => string | string[] | undefined;

  public readonly overscan: Signal<number>;
  public readonly showColumnFilters: Signal<boolean>;
  public readonly showColumnHeaders: Signal<boolean>;
  public readonly sortable: Signal<boolean>;
  public readonly resizable: Signal<boolean>;
  public readonly selectable: Signal<'single' | 'multi' | false>;

  private readonly _sortCriteria = signal<SciSortCriterion[]>([]);
  private readonly _filterCriteria = signal<SciColumnFilter[]>([]);
  private readonly _globalFilter = signal<string | undefined>(undefined);
  private readonly _selectedItems = signal(new Map<unknown, T>());
  private readonly _totalCount = signal<number | undefined>(undefined);
  private readonly _storedTable = signal<StoredTable | undefined>(undefined);

  public readonly range = signal<{start: number; end: number} | undefined>(undefined);
  public readonly resizingState = signal<{
    column: SciColumnLike<T>;
    hadOverflow: boolean;
    initialFractionColumns: Set<`column:${string}`>;
    initialColumnWidths: Map<`column:${string}`, number>;
    temporaryColumnWidths: Map<`column:${string}`, string>;
  } | undefined>(undefined);

  public readonly criteria = computed(() => ({sort: this._sortCriteria(), filter: this._filterCriteria(), globalFilter: this._globalFilter()}));
  public readonly pageSize = linkedSignal<{start: number; end: number} | undefined, number>({
    source: () => this.range(),
    computation: (range, previous) => {
      const visibleRowCount = (range?.end ?? 0) - (range?.start ?? 0);
      // PageSize should never be smaller than the minimum size (5).
      return Math.max(visibleRowCount, previous?.value ?? 5);
    },
  });

  private readonly _pages = computed(() => {
    const range = this.range();
    const pageSize = this.pageSize();
    if (!range) {
      return [];
    }
    return this.pagesByRange(range.start, range.end, pageSize);
  }, {equal: (a, b) => Objects.isEqual(a, b)});

  private readonly _activeItem = linkedSignal({
    source: () => this.criteria(),
    computation: () => undefined as T | undefined,
  });

  private readonly _hoveredId = linkedSignal({
    source: () => this.criteria(),
    computation: () => undefined as unknown,
  });

  private readonly _cache = new TableCache<T>();

  public readonly rowsByIndex = this._cache.rowByIndex;
  public readonly rows = computed(() => {
    const pageSize = this.pageSize();
    const visiblePages = this._pages();
    const rowsByIndex = this.rowsByIndex();
    const range = this.range();
    const totalCount = this._totalCount();

    if (!range || visiblePages.length <= 0) {
      return [];
    }

    const firstPageStart = visiblePages[0]! * pageSize;
    const lastPageEnd = (visiblePages.at(-1)! + 1) * pageSize;

    // Populate rows with cached rows in the loaded page window, fallback to row shell to show skeleton.
    const rows = Array.from({length: Math.min(lastPageEnd - firstPageStart, totalCount ?? pageSize)}, (_, i) => {
      return rowsByIndex.get(firstPageStart + i) ?? {};
    });

    // Only return the rows which are actually in the viewport.
    return rows.slice(range.start - firstPageStart, Math.min(range.end, totalCount ?? Infinity) - firstPageStart);
  });

  public readonly loading = computed(() => this._cache.values().some(entry => entry.items() === undefined));
  public readonly activeIndex = computed(() => {
    const activeItem = this._activeItem();
    return activeItem ? this.indexById(this.trackBy?.(activeItem) ?? activeItem, this.rowsByIndex()) : -1;
  });
  public readonly hoveredIndex = computed(() => this.indexById(this._hoveredId(), this.rowsByIndex()));
  public readonly hoveredRow = computed(() => this.rowsByIndex().get(this.hoveredIndex()));
  public readonly selectedItems = computed(() => [...this._selectedItems().values()]);
  public readonly selectedIds = computed(() => new Set([...this._selectedItems().keys()]));

  public readonly sortCriteria = this._sortCriteria.asReadonly();
  public readonly filterCriteria = this._filterCriteria.asReadonly();
  public readonly globalFilter = this._globalFilter.asReadonly();
  public readonly activeItem = this._activeItem.asReadonly();
  public readonly totalCount = this._totalCount.asReadonly();

  constructor(factory: ɵSciTableFactory<T>, descriptor: SciTableDescriptor<T>) {
    this.name = descriptor.name;
    this.overscan = coerceSignal(descriptor.bufferSize ?? 10);
    this.sortable = coerceSignal(descriptor.sortable ?? true);
    this.showColumnFilters = coerceSignal(descriptor.filterable ?? true);
    this.showColumnHeaders = coerceSignal(descriptor.headerVisible ?? true);
    this.resizable = coerceSignal(descriptor.resizable ?? true);
    this.selectable = coerceSignal(descriptor.selectable ?? 'multi');
    this.columns = linkedSignal(() => {
      const storedTable = this._storedTable();
      // Wait for storedTable to be available before initializing columns.
      if (storedTable === undefined) {
        return [];
      }
      return factory.columns().map((column, index) => this.initColumn(column.type, column, index, storedTable));
    });

    this.rowActions = descriptor.rowActions;
    this.rowName = descriptor.rowState;
    this.trackBy = descriptor.trackBy;
    this.dataLoaderFn = isSignal(descriptor.data) ? arrayDataSource(descriptor.data, this.columns) : descriptor.data;

    void this.readTableStorage();
    this.installCriteriaWatcher();
    this.installTablePersister();
    this.installPageLoader();
  }

  public loadRange(start: number, end: number): Promise<void[]> {
    const pageSize = this.pageSize();
    const sortCriteria = this.sortCriteria();
    const columnFilters = this.filterCriteria();
    const globalFilter = this.globalFilter();

    const pages = this.pagesByRange(start, end, pageSize);
    const requests = pages.map(page => {
      const response = this.loadPage({page, pageSize, columnFilters, globalFilter, sortCriteria});
      // Wait for the page to be loaded.
      return new Promise<void>(resolve => {
        const effectRef = effect(() => {
          const items = response();
          if (items) {
            resolve();
            effectRef.destroy();
          }
        }, {injector: this._injector});
      });
    });

    return Promise.all(requests);
  }

  private loadPage({page, pageSize, sortCriteria, columnFilters, globalFilter}: {page: number; pageSize: number; sortCriteria: SciSortCriterion[]; columnFilters: SciColumnFilter[]; globalFilter?: string}, onCleanup?: EffectCleanupRegisterFn): Signal<SciRow<T>[] | undefined> {
    const pageStart = page * pageSize;
    const pageEnd = pageStart + pageSize;
    const cacheKey = `${pageStart}-${pageEnd}` as const;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)!.items;
    }

    const items = signal<T[] | undefined>(undefined);
    const subscription = coerceObservable(this.dataLoaderFn({
      start: pageStart,
      end: pageEnd,
      pageSize,
      page,
      sortCriteria,
      globalFilter,
      columnFilters,
    })).subscribe({
      next: result => {
        this._totalCount.set(result.totalCount);
        items.set(result.items);
      },
      error: err => {
        // TODO: what do we do here?
        this._cache.deleteIfEmpty(cacheKey);
      },
    });

    const cacheEntry: TableCacheEntry<T> = {
      items: computed(() => {
        const resolved = items();
        const columns = this.columns();
        return untracked(() => resolved ? this.mapItemsToRow(resolved, columns) : undefined);
      }),
      dispose: () => subscription.unsubscribe(),
      start: pageStart,
      end: pageEnd,
    };

    this._cache.set(cacheKey, cacheEntry);
    onCleanup?.(() => {
      this._cache.deleteIfEmpty(cacheKey);
    });

    return cacheEntry.items;
  }

  public sort(columnName: `column:${string}`, multi: boolean): void {
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

  public filter(text: string): void;
  public filter(text: string | number | boolean | null, options: {columnName: `column:${string}`}): void;
  public filter(text: string | number | boolean | null, options?: {columnName: `column:${string}`}): void {
    if (options) {
      if (!this.showColumnFilters()) {
        return;
      }

      this._filterCriteria.update(filter => {
        const other = filter.filter(f => f.columnName !== options.columnName);
        if (text === null) {
          return other;
        }

        return [
          ...other,
          {columnName: options.columnName, text},
        ];
      });
    }
    else {
      this._globalFilter.set(text as string);
    }
  }

  public setActiveItem(item: T | undefined): void {
    this._activeItem.set(item);
  }

  public setHoveredId(id: unknown | undefined): void {
    this._hoveredId.set(id);
  }

  public updateSelectedItems(updateFn: (ids: Map<unknown, T>) => Map<unknown, T>): void {
    this._selectedItems.update(updateFn);
  }

  private installTablePersister(): void {
    toObservable(this.columns).pipe(
      filter(columns => columns.length > 0), // don't persist when columns are not yet loaded
      skip(1), // don't persist initial load
    ).subscribe(columns => {
      const storedTable = {
        columns: columns.map(col => ({name: col.name, width: col.absoluteWidth})),
      } satisfies StoredTable;

      void untracked(() => this.tableStorage.store(this.name, JSON.stringify(storedTable)));
    });
  }

  /**
   * Instructs the internal table model to load a set of pages.
   */
  private installPageLoader(): void {
    effect(onCleanup => {
      const pages = this._pages();
      const pageSize = this.pageSize();
      const sortCriteria = this.sortCriteria();
      const columnFilters = this.filterCriteria();
      const globalFilter = this.globalFilter();

      untracked(() => pages.forEach(page => {
        this.loadPage({
          pageSize,
          page,
          sortCriteria,
          globalFilter,
          columnFilters,
        }, onCleanup);
      }));
    });
  }

  private installCriteriaWatcher(): void {
    toObservable(this.criteria).pipe(
      skip(1), // skip first emission to avoid race condition with loader on initialization.
      takeUntilDestroyed(),
    ).subscribe(() => {
      this._cache.clear(); // clear cache as soon as criteria change.
    });
  }

  private initColumn(type: ColumnType, config: SciColumnDescriptors<T>, index: number, storedTable: StoredTable | undefined): SciColumnLike<T> {
    // columns with a custom component or template must provide a sort function to be sortable, because the default sort function does not work.
    const sortable = type === 'component' || type === 'template' ?
      !!config.sortable :
      config.sortable !== false;

    // columns with a custom component or template must provide a filter function to be filterable, because the default filter function does not work.
    const filterable = type === 'component' || type === 'template' ?
      !!config.filterable :
      config.filterable !== false;

    const name = config.name ?? index.toString();
    const storedColumn = storedTable?.columns.find(column => column.name === name);
    const width = config.width ?? '1fr';

    return {
      ...config,
      type,
      name,
      filter: typeof config.filterable === 'object' ? config.filterable.matcher : defaultFilter,
      sort: typeof config.sortable === 'object' ? config.sortable.comparator : defaultSort,
      sortable: computed(() => sortable && this.sortable()),
      filterable: computed(() => filterable && this.showColumnFilters()),
      resizable: computed(() => (config.resizable ?? true) && this.resizable()),
      header: coerceSignal(config.header ?? ''),
      absoluteWidth: storedColumn?.width,
      isFraction: width.endsWith('fr'),
      width,
      minWidth: config.minWidth ?? 100,
      maxWidth: config.maxWidth,
    } as SciColumnLike<T>;
  }

  private indexById(id: unknown | undefined, rowsByIndex: Map<number, SciRow<T>>): number {
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

  private mapItemsToRow(items: T[], columns: SciColumnLike<T>[]): SciRow<T>[] {
    return items.map(item => {
      const rowName = Arrays.coerce(this.rowName?.(item));
      return ({
        item: item,
        id: this.trackBy?.(item) ?? item,
        cells: columns.map(column => ({
          value: column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item)) : undefined,
          component: column.type === 'component' ? column.component(item) : undefined,
          template: column.type === 'template' ? column.template(item) : undefined,
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

  private async readTableStorage(): Promise<void> {
    const saved = await this.tableStorage.load(this.name);
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

  private pagesByRange(start: number, end: number, pageSize: number): number[] {
    const startPage = Math.floor(start / pageSize);
    const endPage = Math.floor((end - 1) / pageSize); // `end` is exclusive, so use the last included index (`end - 1`) for page calculation.
    return rangeInclusive(startPage, endPage);
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
