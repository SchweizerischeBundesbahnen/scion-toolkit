/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, EffectCleanupRegisterFn, inject, InjectionToken, isSignal, linkedSignal, signal, Signal, untracked, WritableSignal} from '@angular/core';
import {SciColumnFilter, SciDataLoaderFn, SciSortCriterion, SciTableRequest} from './table-data-source';
import {ColumnType, SciRowActionFactoryFn, SciCellContext, SciCellLike, SciColumnLike, SciRow, SciTable, SciTableDescriptor} from './table.model';
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
  private readonly _selectedIds = signal<Set<unknown>>(new Set());
  private readonly _totalCount = signal<number | undefined>(undefined);
  private readonly _storedTable = signal<StoredTable | undefined>(undefined);

  public readonly range = signal<{start: number; end: number} | undefined>(undefined);
  public readonly resizingState = signal<{
    column: SciColumnLike<T>;
    initialFractionColumns: Set<`column:${string}`>;
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

  public readonly pages = computed(() => {
    const range = this.range();
    const pageSize = this.pageSize();
    if (!range) {
      return [];
    }

    const startPage = Math.floor(range.start / pageSize);
    const endPage = Math.floor((range.end - 1) / pageSize); // `end` is exclusive, so use the last included index (`end - 1`) for page calculation.
    return rangeInclusive(startPage, endPage);
  }, {equal: (a, b) => Objects.isEqual(a, b)});

  private readonly _activeId = linkedSignal({
    source: () => this.criteria(),
    computation: () => undefined as unknown,
  });

  private readonly _hoveredId = linkedSignal({
    source: () => this.criteria(),
    computation: () => undefined as unknown,
  });

  /**
   * True, if all rows are selected.
   * Since we don't know all row ids (lazy data source) we can't select all rows with _selectedItems.
   * Resets, as soon as selection changes again.
   */
  private readonly _allSelected = linkedSignal({
    source: () => this._selectedIds(),
    computation: () => false,
  });

  private readonly _cache = new TableCache<T>();

  public readonly rowsByIndex = computed(() => {
    const rows = new Map<number, SciRow<T>>();

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

  public readonly activeIndex = computed(() => this.indexById(this._activeId(), this.rowsByIndex()));
  public readonly hoveredIndex = computed(() => this.indexById(this._hoveredId(), this.rowsByIndex()));
  public readonly activeItem = computed(() => this.rowsByIndex().get(this.activeIndex())?.item);
  public readonly selectedItems = computed(() => {
    const rows = this.rowsByIndex();
    return [...this._selectedIds().values()]
      .map(id => rows.get(this.indexById(id, rows))?.item)
      .filter((item): item is T => !!item);
  });

  public readonly sortCriteria = this._sortCriteria.asReadonly();
  public readonly filterCriteria = this._filterCriteria.asReadonly();
  public readonly globalFilter = this._globalFilter.asReadonly();
  public readonly activeId = this._activeId.asReadonly();
  public readonly selectedIds = this._selectedIds.asReadonly();
  public readonly allSelected = this._allSelected.asReadonly();
  public readonly totalCount = this._totalCount.asReadonly();

  constructor(factory: ɵSciTableFactory<T>, descriptor: SciTableDescriptor<T>) {
    this.name = descriptor.name;
    this.overscan = coerceSignal(descriptor.bufferSize ?? 3);
    this.sortable = coerceSignal(descriptor.sortable ?? true);
    this.showColumnFilters = coerceSignal(descriptor.filterable ?? true);
    this.showColumnHeaders = coerceSignal(descriptor.headerVisible ?? true);
    this.resizable = coerceSignal(descriptor.resizable ?? true);
    this.selectable = coerceSignal(descriptor.selectable ?? 'multi');

    this.rowActions = descriptor.rowActions;
    this.rowName = descriptor.rowState;
    this.trackBy = descriptor.trackBy;

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

  private loadPage(request: SciTableRequest, onCleanup: EffectCleanupRegisterFn): void {
    const cacheKey = `${request.start}-${request.end}` as const;

    const items = signal<T[] | undefined>(undefined);
    const subscription = coerceObservable(this.dataLoaderFn(request)).subscribe(result => {
      this._totalCount.set(result.totalCount);
      items.set(result.items);
    });

    onCleanup(() => {
      this._cache.deleteIfEmpty(cacheKey);
    });

    const cacheEntry: TableCacheEntry<T> = {
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

  public loadPages({pages, pageSize, sortCriteria, columnFilters, globalFilter, onCleanup}: {pages: number[]; pageSize: number; sortCriteria: SciSortCriterion[]; columnFilters: SciColumnFilter[]; globalFilter?: string; onCleanup: EffectCleanupRegisterFn}): void {
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
        globalFilter,
        columnFilters: columnFilters,
      }, onCleanup);
    }
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

  public resetFilter(): void {
    this._filterCriteria.set([]);
    this._globalFilter.set(undefined);
  }

  public setResizedColumn(columnName: string, width: number): void {
    this.columns.update(columns => columns.map(column => column.name === columnName ? {
      ...column,
      absoluteWidth: `${Math.max(column.minWidth, Math.min(column.maxWidth ?? width, width))}px`,
    } : column));
  }

  public setActiveId(id: unknown | undefined): void {
    this._activeId.set(id);
  }

  public setHoveredId(id: unknown | undefined): void {
    this._hoveredId.set(id);
  }

  public updateSelectedIds(updateFn: (ids: Set<unknown>) => Set<unknown>): void {
    this._selectedIds.update(updateFn);
  }

  public selectAll(): void {
    this._selectedIds.set(new Set());
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

      void untracked(() => this.tableStorage.store(this.name, JSON.stringify(storedTable)));
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
      isFraction: width.endsWith('fr') || width.endsWith('%'),
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

  public mapItemsToRow(items: T[], columns: SciColumnLike<T>[]): SciRow<T>[] {
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
