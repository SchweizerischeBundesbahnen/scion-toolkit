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
import {SciCellContext, SciCellLike, SciColumnLike, SciColumnType, SciRow, SciRowActionFactoryFn, SciTable, SciTableDescriptor} from './table.model';
import {ɵSciTableFactory} from './ɵtable.factory';
import {coerceObservable, rangeInclusive} from './common';
import {SCI_TABLE_STORAGE} from './table-storage';
import {SciColumnDescriptors} from './table.factory';
import {coerceSignal} from '@scion/components/common';
import {arrayDataSource} from './ɵarray-data-source';
import {TableCache, TableCacheEntry} from './table.cache';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {skip} from 'rxjs';
import {coerceTableRowBindings, SCI_TABLE_ROW_BINDING, SciTableRowBinding} from './table-row-binding';

interface SciTableUserSettings {
  columns: {name: string; width: number | undefined}[];
}

export const ɵSCI_TABLE = new InjectionToken<Signal<ɵSciTable<unknown>>>('ɵSciTable');

export class ɵSciTable<T> implements SciTable<T> {

  private readonly _tableStorage = inject(SCI_TABLE_STORAGE);
  private readonly _injector = inject(Injector);

  public readonly name: `scion.components.table:${string}`;
  public readonly columns: WritableSignal<SciColumnLike<T>[]>;
  public readonly rowActions?: SciRowActionFactoryFn<T>;
  private readonly _rowBindings?: SciTableRowBinding<T>[];
  private readonly _dataLoaderFn: SciDataLoaderFn<T>;
  private readonly _trackBy?: (item: T) => unknown;

  public readonly bufferSize: Signal<number>;
  public readonly filterable: Signal<boolean>;
  public readonly headerVisible: Signal<boolean>;
  public readonly gridlinesVisible: Signal<boolean>;
  public readonly sortable: Signal<boolean>;
  public readonly resizable: Signal<boolean>;
  public readonly selectable: Signal<'single' | 'multi' | false>;

  public readonly scrolling = signal(false);
  public readonly resizing = computed(() => this.columns().some(column => column.resizing()));
  public readonly sortCriteria = signal<SciSortCriterion[]>([]);
  public readonly filterCriteria = signal<SciColumnFilter[]>([]);
  public readonly scrollRange = signal<SciScrollRange | undefined>(undefined);
  public readonly viewportPageSize = signal(0);
  public readonly _selectedItems = signal(new Map<unknown, T>());

  private readonly _globalFilter = signal<string | null>(null);
  private readonly _cache = new TableCache<T>();

  public readonly pageSize = linkedSignal<SciScrollRange | undefined, number>({
    source: () => this.scrollRange(),
    computation: (scrollRange, previous) => {
      const visibleRowCount = (scrollRange?.end ?? 0) - (scrollRange?.start ?? 0);
      // PageSize should never be smaller than the minimum size (5).
      return Math.max(visibleRowCount, previous?.value ?? 5);
    },
  });

  // Reset totalCount on criteria change, to show skeletons instead of stale data while loading.
  public readonly totalCount = linkedSignal({
    source: () => this.criteria(),
    computation: () => undefined as number | undefined,
  });

  public readonly activeItem = linkedSignal({
    source: () => this.criteria(),
    computation: () => undefined as T | undefined,
  });

  public readonly hoveredIndex = linkedSignal({
    source: () => {
      this.criteria(); // reset on criteria change
      this.scrolling(); // reset when start scrolling
    },
    computation: () => -1,
  });

  public readonly criteria = computed(() => ({sort: this.sortCriteria(), filter: this.filterCriteria(), globalFilter: this._globalFilter()}));
  public readonly loading = computed(() => this._cache.values().some(entry => entry.items() === undefined));
  public readonly activeIndex = this.computeActiveIndex();
  public readonly hoveredRow = computed(() => this.rowsByIndex().get(this.hoveredIndex()));
  public readonly selectedItems = computed(() => [...this._selectedItems().values()]);
  public readonly selectedIds = computed(() => new Set([...this._selectedItems().keys()]));
  public readonly rowsByIndex = this._cache.rowByIndex;
  public readonly rows = this.computeRows();

  constructor(factory: ɵSciTableFactory<T>, descriptor: SciTableDescriptor<T>) {
    this.name = `scion.components.${descriptor.name}`;
    this.bufferSize = coerceSignal(descriptor.bufferSize ?? 10);
    this.sortable = coerceSignal(descriptor.sortable ?? true);
    this.filterable = coerceSignal(descriptor.filterable ?? true);
    this.headerVisible = coerceSignal(descriptor.headerVisible ?? true);
    this.gridlinesVisible = coerceSignal(descriptor.gridlinesVisible ?? false);
    this.resizable = coerceSignal(descriptor.resizable ?? true);
    this.selectable = coerceSignal(descriptor.selectable ?? 'multi');
    this.columns = this.computeColumns(factory);

    this.rowActions = descriptor.rowActions;
    this._rowBindings = [
      ...descriptor.rowBindings ?? [],
      ...inject<SciTableRowBinding<T>[]>(SCI_TABLE_ROW_BINDING, {optional: true}) ?? [],
    ];
    this._trackBy = descriptor.trackBy;
    this._dataLoaderFn = isSignal(descriptor.data) ? arrayDataSource(descriptor.data, this.columns) : descriptor.data;

    this.installCriteriaWatcher();
    this.storeUserSettingsOnChange();
    this.installPageLoader();
  }

  private computeColumns(factory: ɵSciTableFactory<T>): WritableSignal<SciColumnLike<T>[]> {
    const userSettings = this.loadUserSettings();

    return linkedSignal(() => {
      const settings = userSettings();
      // Wait for user settings to be available before calling the factory.
      if (settings === undefined) {
        return [];
      }
      return factory.columns().map((column, index) => this.initColumn(column.type, column, index, settings));
    });
  }

  /**
   * Loads a range of rows, based on the current sort and filter criteria, into the cache.
   */
  public loadRange(start: number, end: number): Promise<void[]> {
    const pageSize = this.pageSize();
    const sortCriteria = this.sortCriteria();
    const columnFilters = this.filterCriteria();
    const globalFilter = this._globalFilter() ?? undefined;

    const pages = this.pagesByRange(start, end, pageSize);
    const requests = pages.map(page => {
      const response = this.loadPage({page, pageSize, columnFilters, globalFilter: globalFilter, sortCriteria});
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

  /**
   * Loads a page from the dataSource and saves it to the page cache.
   */
  private loadPage({page, pageSize, sortCriteria, columnFilters, globalFilter}: {page: number; pageSize: number; sortCriteria: SciSortCriterion[]; columnFilters: SciColumnFilter[]; globalFilter?: string}, onCleanup?: EffectCleanupRegisterFn): Signal<SciRow<T>[] | undefined> {
    const pageStart = page * pageSize;
    const pageEnd = pageStart + pageSize;
    const cacheKey = `${pageStart}-${pageEnd}` as const;
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)!.items;
    }

    const items = signal<T[] | undefined>(undefined);
    // TODO [Etienne] Cancel previous fetch
    const subscription = coerceObservable(this._dataLoaderFn({
      start: pageStart,
      end: pageEnd,
      pageSize,
      page,
      sortCriteria,
      globalFilter,
      columnFilters,
    })).subscribe({
      next: result => {
        this.totalCount.set(result.totalCount);
        items.set(result.items);
      },
      error: err => {
        // TODO [etienne]: what do we do when the datasource throws an error?
        this._cache.deleteIfEmpty(cacheKey);
      },
    });

    const cacheEntry: TableCacheEntry<T> = {
      items: computed(() => {
        const resolved = items();
        const columns = this.columns();
        return untracked(() => resolved ? this.mapItemsToRow(resolved, columns, pageStart) : undefined);
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

  /**
   * Toggles sort on a column. ASC -> DESC -> No sort
   *
   * TODO [Etienne] No magic! Remove toggling logic
   */
  public sort(columnName: `column:${string}`, multi: boolean): void {
    this.sortCriteria.update(sortCriteria => {
      const column = this.columns().find(column => column.name === columnName);
      if (!column) {
        throw Error(`[NullColumnError] Column '${columnName}' not found in table '${this.name}'.`);
      }

      const currentSortCriterion = sortCriteria.find(sortCriterion => sortCriterion.columnName === column.name);
      const otherSortCriteria = sortCriteria.filter(sortCriterion => sortCriterion !== currentSortCriterion);

      const direction = currentSortCriterion ? (currentSortCriterion.direction === 'asc' ? 'desc' : undefined) : 'asc';
      if (!direction) {
        return multi ? otherSortCriteria : [];
      }

      const newSortCriterion = {columnName: column.name, direction} satisfies SciSortCriterion;
      return multi ? [...otherSortCriteria, newSortCriterion] : [newSortCriterion];
    });
  }

  /**
   * Applies a filter, either via global filter or on a specific column.
   */
  public filter(text: string | null): void;
  public filter(text: string | number | boolean | null, options: {columnName: `column:${string}`}): void;
  public filter(text: string | number | boolean | null, options?: {columnName: `column:${string}`}): void {
    if (!options) {
      this._globalFilter.set(text as string);
      return;
    }

    const column = this.columns().find(column => column.name === options.columnName);
    if (!column) {
      throw Error(`[NullColumnError] Column '${options.columnName}' not found in table '${this.name}'.`);
    }

    this.filterCriteria.update(filterCriterion => {
      const otherFilterCriteria = filterCriterion.filter(filterCriterion => filterCriterion.columnName !== options.columnName);
      if (text === null) {
        return otherFilterCriteria;
      }

      return otherFilterCriteria.concat({columnName: column.name, text});
    });
  }

  public updateSelectedItems(updateFn: (ids: Map<unknown, T>) => Map<unknown, T>): void {
    this._selectedItems.update(updateFn);
  }

  public dispose(): void {
    this._cache.clear();
  }

  /**
   * Write table user settings to storage.
   */
  private storeUserSettingsOnChange(): void {
    effect(() => {
      if (this.columns().every(column => column.width() === column.initialWidth)) {
        return;
      }

      untracked(() => {
        const userSettings: SciTableUserSettings = {
          columns: this.columns()
            .filter(column => column.width() !== column.initialWidth)
            .map(column => ({name: column.name, width: Number.parseInt(column.width())})),
        };

        void this._tableStorage.store(this.name, JSON.stringify(userSettings));
      });
    });
  }

  /**
   * Loads a set of pages on criteria or viewport changes.
   */
  private installPageLoader(): void {
    effect(onCleanup => {
      const scrollRange = this.scrollRange();
      const pageSize = this.pageSize();
      const sortCriteria = this.sortCriteria();
      const columnFilters = this.filterCriteria();
      const globalFilter = this._globalFilter() ?? undefined;
      if (!scrollRange) {
        return;
      }

      untracked(() => this.pagesByRange(scrollRange.start, scrollRange.end, pageSize).forEach(page => {
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

  /**
   * Resets cache on criteria changes.
   */
  private installCriteriaWatcher(): void {
    toObservable(this.criteria).pipe(
      skip(1), // skip first emission to avoid race condition with loader on initialization.
      takeUntilDestroyed(),
    ).subscribe(() => {
      this._cache.clear();
    });
  }

  private initColumn(type: SciColumnType, config: SciColumnDescriptors<T>, index: number, userSettings: SciTableUserSettings | undefined): SciColumnLike<T> {
    // columns with a custom component or template must provide a sort function to be sortable, because the default sort function does not work.
    const sortable = type === 'component' || type === 'template' ?
      !!config.sortable :
      config.sortable !== false;

    // columns with a custom component or template must provide a filter function to be filterable, because the default filter function does not work.
    const filterable = type === 'component' || type === 'template' ?
      !!config.filterable :
      config.filterable !== false;

    // Fallback to the column index as the column name
    const columnName = config.name ?? `column:${index}`;
    const columnUserSettings = userSettings?.columns.find(column => column.name === columnName);
    const columnInitialWidth = config.width ?? '1fr';
    return {
      ...config,
      type,
      name: columnName,
      filter: typeof config.filterable === 'object' ? config.filterable.matcher : defaultFilter,
      sort: typeof config.sortable === 'object' ? config.sortable.comparator : defaultSort,
      sortable: computed(() => this.sortable() && sortable),
      filterable: computed(() => this.filterable() && filterable),
      resizable: computed(() => this.resizable() && (config.resizable ?? true)),
      header: coerceSignal(config.header ?? ''),
      width: signal(columnUserSettings?.width ? `${columnUserSettings.width}px` : columnInitialWidth),
      minWidth: config.minWidth ?? 100,
      maxWidth: config.maxWidth,
      initialWidth: columnInitialWidth,
      resizing: signal(false),
      location: {x: 0, width: 0}, // injected in `SciColumnComponent`
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

  private mapItemsToRow(items: T[], columns: SciColumnLike<T>[], pageStart: number): SciRow<T>[] {
    return items.map((item, i) => {
      return ({
        id: this.trackBy(item),
        index: pageStart + i,
        item: item,
        bindings: coerceTableRowBindings(this._rowBindings ?? [], item, pageStart + i),
        cells: columns.map(column => ({
          value: column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item)) : undefined,
          component: column.type === 'component' ? column.component(item) : undefined,
          template: column.type === 'template' ? column.template(item) : undefined,
          type: column.type,
          columnName: column.name,
        } as SciCellLike)),
      });
    });
  }

  private loadUserSettings(): Signal<SciTableUserSettings | undefined> {
    const settings = signal<SciTableUserSettings | undefined>(undefined);
    Promise.resolve(this._tableStorage.load(this.name))
      .then(serialized => settings.set(serialized ? JSON.parse(serialized) as SciTableUserSettings : {columns: []}))
      .catch((error: unknown) => {
        console.warn(`[SciTable] Failed to load user settings for '${this.name}' from storage.`, error);
        return {columns: []};
      });
    return settings;
  }

  /**
   * Get pages by range and pageSize. End is exclusive.
   */
  private pagesByRange(start: number, end: number, pageSize: number): number[] {
    const startPage = Math.floor(start / pageSize);
    const endPage = Math.floor((end - 1) / pageSize); // `end` is exclusive, so use the last included index (`end - 1`) for page calculation.
    return rangeInclusive(startPage, endPage);
  }

  /**
   * Call trackBy function or fallback to track by object reference.
   */
  public trackBy(item: T): unknown {
    return this._trackBy?.(item) ?? item;
  }

  /**
   * Computes the rows currently visible in the viewport (+buffer).
   */
  private computeRows(): Signal<SciRow<T>[]> {
    return computed(() => {
      const pageSize = this.pageSize();
      const rowsByIndex = this.rowsByIndex();
      const scrollRange = this.scrollRange();
      const totalCount = this.totalCount();
      if (!scrollRange) {
        return [];
      }

      // If total count is not defined yet (no page loaded) show only skeletons.
      if (totalCount === undefined) {
        return Array.from({length: pageSize}, (_, i) => ({index: i}));
      }

      // Cut the rowCount off at totalCount, else the user can scroll infinitely.
      const rowCount = Math.min(scrollRange.end, totalCount) - scrollRange.start;

      // Populate rows with cached rows in the range window, fallback to row shell to show skeleton.
      return Array.from({length: Math.min(pageSize, rowCount, totalCount)}, (_, i) => rowsByIndex.get(scrollRange.start + i) ?? {index: i});
    });
  }

  private computeActiveIndex(): Signal<number> {
    return computed(() => {
      const activeItem = this.activeItem();
      return activeItem ? this.indexById(this.trackBy(activeItem), this.rowsByIndex()) : -1;
    });
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

export interface SciScrollRange {
  /** incluse */
  start: number;
  /** exclusive */
  end: number;
}
