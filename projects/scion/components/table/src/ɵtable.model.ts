/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, EffectCleanupRegisterFn, InjectionToken, isSignal, linkedSignal, signal, Signal, untracked} from '@angular/core';
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
import {TableCacheEntry, TableCache} from './table.cache';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {skip} from 'rxjs';

interface StoredTable {
  columnWidths: {columnName: string; width: number}[];
}

export const ɵSCI_TABLE = new InjectionToken<Signal<ɵSciTable<unknown>>>('ɵSciTable');

export class ɵSciTable<T, ID = T> implements SciTable<T, ID> {

  public readonly columns: Signal<SciColumnLike<T>[]>;
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
  private readonly _columnWidths = signal(new Map<string, number>());
  private readonly _selectedItems = signal<Set<ID>>(new Set());
  private readonly _visibleRowCount = signal<number>(0);
  private readonly _totalCount = signal<number>(0);
  private readonly _scrollTop = signal<number>(0);

  public readonly criteria = computed(() => ({sort: this._sortCriteria(), filter: this._filterCriteria()}));
  public readonly range = this.computeRange();
  public readonly pageSize = linkedSignal<number, number>({
    source: () => this.visibleRowCount(),
    // PageSize should never be smaller than the minimal size (30).
    computation: (visibleRowCount, previous) => Math.max(visibleRowCount, previous?.value ?? 30),
  });

  public readonly pages = computed(() => {
    const {start, end} = this.range();
    const pageSize = end - start;
    const startPage = Math.floor(start / pageSize);
    const endPage = Math.floor((end - 1) / pageSize); // `end` is exclusive, so use the last included index (`end - 1`) for page calculation.
    return rangeInclusive(startPage, endPage);
  }, {equal: (a, b) => Objects.isEqual(a, b)});

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
    const totalCount = this._totalCount();
    const visiblePages = this.pages();

    // Create shallow row for each possible row item.
    // Then populate the rows which are resolved.
    const rows = new Array<SciRow<T, ID>>(totalCount === 0 ? pageSize : totalCount).fill({});
    for (const pageNumber of visiblePages) {
      const start = pageNumber * pageSize;
      const page = this._cache.get(`${start}-${start + pageSize}`);
      const items = page?.items();
      if (!items) {
        continue;
      }

      rows.splice(start, pageSize, ...items);
    }
    return rows;
  });

  public readonly visibleRows = computed(() => {
    const {start, end} = this.range();
    return this.rows().slice(start, end);
  });

  public focusedIndex = computed(() => this.indexById(this._focusedItem(), this.rowsByIndex()));
  public activeIndex = computed(() => this.indexById(this._activeItem(), this.rowsByIndex()));

  public readonly sortCriteria = this._sortCriteria.asReadonly();
  public readonly filterCriteria = this._filterCriteria.asReadonly();
  public readonly columnWidths = this._columnWidths.asReadonly();
  public readonly focusedItem = this._focusedItem.asReadonly();
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

    this.columns = computed(() => factory.columns().map(column => this.initColumn(column.type, column)));

    this.dataLoaderFn = isSignal(descriptor.data) ? arrayDataSource(descriptor.data, this.columns) : descriptor.data;

    toObservable(this.criteria).pipe(
      skip(1), // skip first emission to avoid race condition with loader on initialization.
      takeUntilDestroyed(),
    ).subscribe(() => {
      this._cache.clear(); // clear cache as soon as criteria change.
    });

    void this.initColumnWidths();
  }

  public setVisibleRowCount(count: number): void {
    this._visibleRowCount.set(count);
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
      sortable: computed(() => sortable && this.sortable()),
      filterable: computed(() => filterable && this.filterable()),
      resizable: computed(() => (config.resizable ?? true) && this.resizable()),
      header: coerceSignal(config.header ?? ''),
      width: coerceSignal(config.width ?? '1fr'),
      minWidth: coerceSignal(config.minWidth ?? 100),
      maxWidth: coerceSignal(config.maxWidth, {coerceUndefined: true}),
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
