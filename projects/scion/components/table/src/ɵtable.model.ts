/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, effect, inject, InjectionToken, Injector, isSignal, linkedSignal, NgZone, resource, runInInjectionContext, signal, Signal, untracked, WritableSignal} from '@angular/core';
import {SciColumnFilter, SciDataLoaderFn, SciSortCriterion, SciTableRequest, SciTableResponse} from './table-data-source';
import {ChildProvider, PageableChildProvider, SciCellContext, SciCellLike, SciColumnLike, SciColumnType, SciPageableTableDatasource, SciPageableTreeDatasource, SciRow, SciRowActionFactoryFn, SciTable, SciTableDatasource, SciTableDescriptor, SciTreeDatasource} from './table.model';
import {ɵSciTableFactory} from './ɵtable.factory';
import {MaybeAsync, rangeInclusive} from './common';
import {SCI_TABLE_STORAGE} from './table-storage';
import {SciColumnDescriptorLike} from './table.factory';
import {coerceSignal} from '@scion/components/common';
import {arrayDataSource} from './ɵarray-data-source';
import {TableCache, TableCacheEntry, TableCacheRow} from './table.cache';
import {rxResource, takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {concat, fromEvent, of, skip, switchMap, timer} from 'rxjs';
import {coerceTableRowBindings, SCI_TABLE_ROW_BINDING, SciTableRowBinding} from './table-row-binding';
import {clamp, Objects, Observables} from '@scion/toolkit/util';
import {SciTableFactoryFn} from './table';
import {map, startWith} from 'rxjs/operators';
import {subscribeIn} from '@scion/toolkit/operators';
import coerce = Observables.coerce;

export class ɵSciTable<T = unknown> implements SciTable<T> {

  private readonly _tableStorage = inject(SCI_TABLE_STORAGE);
  private readonly _injector = inject(Injector);

  public readonly name = signal<`table:${string}` | undefined>(undefined);
  public readonly columns: Signal<SciColumnLike<T>[]>;
  public readonly rowActions?: SciRowActionFactoryFn<T>;

  private readonly _rowBindings?: SciTableRowBinding<T>[];
  private readonly _dataLoaderFn: SciDataLoaderFn<T>;
  private readonly _trackBy?: (item: T) => unknown;
  private readonly _childProvider?: ChildProvider<T> | PageableChildProvider<T>;
  private readonly _childDataLoaderFn?: (item: T, request: SciTableRequest) => MaybeAsync<SciTableResponse<T>>;

  public readonly tableViewRef = signal<SciTableViewRef | undefined>(undefined);
  public readonly userSettings: WritableSignal<SciTableUserSettings>;
  public readonly bufferSize: number;
  public readonly pageSize: number;
  public readonly filterable: WritableSignal<boolean>;
  public readonly showHeader: WritableSignal<boolean>;
  public readonly wrapHeader: WritableSignal<boolean>;
  public readonly sortable: WritableSignal<boolean>;
  public readonly resizable: WritableSignal<boolean>;
  public readonly selectable: WritableSignal<'single' | 'multi' | false>;

  public readonly scrollRange: Signal<SciScrollRange | undefined>;
  public readonly scrollTop: Signal<number>;
  public readonly virtualScrollOffset: Signal<{top: number; bottom: number}>;
  public readonly viewportPageSize: Signal<number>;

  public readonly scrolling: Signal<boolean>;
  public readonly resizing = computed(() => this.columns().some(column => column.resizing()));
  public readonly sortCriteria = signal<SciSortCriterion[]>([]);
  public readonly filterCriteria = signal<SciColumnFilter[]>([]);

  private readonly _cache = new TableCache<T>();
  private readonly _tableFilter = signal<string | null>(null);
  private readonly _selectedItems = signal(new Map<unknown, T>());

  public readonly totalCount = this._cache.totalCount;

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

  public readonly criteria = computed(() => ({sort: this.sortCriteria(), filter: this.filterCriteria(), tableFilter: this._tableFilter()}));
  public readonly loading = computed(() => this._cache.values().some(entry => entry.rows() === undefined));
  public readonly activeRow: Signal<SciRow<T> | undefined>;
  public readonly hoveredRow = computed(() => this.rowsByIndex().get(this.hoveredIndex()));
  public readonly selectedItems = computed(() => [...this._selectedItems().values()]);
  public readonly selectedIds = computed(() => new Set([...this._selectedItems().keys()]));
  public readonly rowsByIndex = this._cache.rowsByIndex;
  public readonly rowIndexById = this._cache.indexById;
  public readonly rows = this.computeRows();

  constructor(factoryFn: SciTableFactoryFn<T>, descriptor: SciTableDescriptor<T>) {
    this.bufferSize = descriptor.bufferSize ?? 10;
    this.pageSize = descriptor.pageSize ?? 50;
    this.sortable = signal(descriptor.sortable ?? true);
    this.filterable = signal(descriptor.filterable ?? false);
    this.showHeader = signal(descriptor.showHeader ?? true);
    this.wrapHeader = signal(descriptor.wrapHeader ?? false);
    this.resizable = signal(descriptor.resizable ?? true);
    this.selectable = signal(descriptor.selectable ?? 'multi');
    this.userSettings = this.computeUserSettings();
    this.scrollRange = this.computeScrollRange();
    this.scrollTop = this.computeScrollTop();
    this.scrolling = this.computeScrolling();
    this.virtualScrollOffset = this.computeVirtualScrollOffset();
    this.viewportPageSize = this.computeViewportPageSize();
    this.activeRow = this.computeActiveRow();
    this.columns = this.computeColumns(factoryFn, descriptor);

    this.rowActions = descriptor.rowActions;
    this._rowBindings = [
      ...descriptor.rowBindings ?? [],
      ...inject<SciTableRowBinding<T>[]>(SCI_TABLE_ROW_BINDING, {optional: true}) ?? [],
    ];
    this._trackBy = descriptor.trackBy;

    if (isSignal(descriptor.datasource)) {
      this._dataLoaderFn = arrayDataSource(descriptor.datasource, this.columns);
    }
    else if (descriptor.datasource instanceof SciTableDatasource) {
      this._dataLoaderFn = arrayDataSource(descriptor.datasource.data, this.columns);
    }
    else if (descriptor.datasource instanceof SciPageableTableDatasource) {
      this._dataLoaderFn = descriptor.datasource.data;
    }
    else if (descriptor.datasource instanceof SciTreeDatasource) {
      this._dataLoaderFn = arrayDataSource(descriptor.datasource.root, this.columns);
      const childProvider: ChildProvider<T> = descriptor.datasource.children;
      this._childProvider = childProvider;
      this._childDataLoaderFn = (item, request) => {
        const children = childProvider.getChildren(item);
        return {
          items: children.slice(request.start, request.end),
          totalCount: children.length,
        };
      };
    }
    else if (descriptor.datasource instanceof SciPageableTreeDatasource) {
      this._dataLoaderFn = descriptor.datasource.root;
      const childProvider: PageableChildProvider<T> = descriptor.datasource.children;
      this._childProvider = childProvider;
      this._childDataLoaderFn = (item, request) => childProvider.getChildren(item, request);
    }
    else {
      throw new Error('Could not initialize data loader');
    }

    this.installCriteriaWatcher();
    this.installPageLoader();
  }

  /**
   * Connects {@link SciTableComponent} to the model.
   */
  public connect(name: `table:${string}`, viewRef: SciTableViewRef): void {
    this.name.set(name);
    this.tableViewRef.set(viewRef);
  }

  public disconnect(): void {
    this.name.set(undefined);
    this.tableViewRef.set(undefined);
  }

  private computeColumns(tableFactoryFn: SciTableFactoryFn<T>, descriptor: SciTableDescriptor<T>): Signal<SciColumnLike<T>[]> {
    // TODO [dwie] Create separate injection context for each separate run (to dispose resources allocated in the reactive context)
    return computed(() => runInInjectionContext(this._injector, () => {
      const tableFactory = new ɵSciTableFactory<T>(descriptor);
      tableFactoryFn(tableFactory);
      return untracked(() => tableFactory.columns.map(column => this.initColumn(column.type, column)));
    }));
  }

  /**
   * Computes the rows currently visible in the viewport (+buffer).
   */
  private computeRows(): Signal<SciRow<T>[]> {
    return computed(() => {
      const scrollRange = this.scrollRange();
      if (!scrollRange) {
        return [];
      }

      const rowsByIndex = this.rowsByIndex();
      const rowCount = scrollRange.end - scrollRange.start;

      // Populate rows with cached rows in the range window, fallback to row shell to show skeleton.
      return untracked(() => Array.from({length: rowCount}, (_, i) => rowsByIndex.get(scrollRange.start + i) ?? {index: signal(0), level: 0, expanded: signal(false)}));
    });
  }

  /**
   * Computes the visible row count based on the viewport size.
   */
  private computeScrollRange(): Signal<SciScrollRange | undefined> {
    return computed(() => {
      const tableViewRef = this.tableViewRef();
      if (!tableViewRef) {
        return undefined;
      }

      const viewportHeight = tableViewRef.viewportHeight();
      const itemHeight = tableViewRef.itemHeight();
      const scrollTop = this.scrollTop();

      const start = Math.floor(scrollTop / itemHeight);
      const viewportRowCount = Math.ceil(viewportHeight / itemHeight);
      const end = Math.min(start + viewportRowCount);

      const totalCount = this.totalCount() ?? viewportRowCount; // fill viewport if no data loaded yet

      return {
        start: clamp(start - this.bufferSize, {min: 0, max: Math.max(0, totalCount - viewportRowCount)}),
        end: clamp(end + this.bufferSize, {max: totalCount}),
      };
    }, {equal: Objects.isEqual});
  }

  private computeVirtualScrollOffset(): Signal<{top: number; bottom: number}> {
    return computed(() => {
      const itemHeight = this.tableViewRef()?.itemHeight() ?? 0;
      const totalCount = this.totalCount() ?? 0;
      const rangeEnd = Math.min(this.scrollRange()?.end ?? 0, this.totalCount() ?? 0);

      return {
        top: (this.scrollRange()?.start ?? 0) * itemHeight,
        bottom: (totalCount - rangeEnd) * itemHeight,
      };
    }, {equal: Objects.isEqual});
  }

  private computeViewportPageSize(): Signal<number> {
    return computed(() => {
      const itemHeight = this.tableViewRef()?.itemHeight() ?? 0;
      const viewportHeight = this.tableViewRef()?.viewportHeight() ?? 0;
      return Math.ceil(viewportHeight / itemHeight);
    });
  }

  /**
   * Tracks {@link HTMLElement.scrollTop} of the viewport.
   */
  private computeScrollTop(): Signal<number> {
    const zone = inject(NgZone);

    return rxResource({
      defaultValue: 0,
      params: () => this.tableViewRef()?.viewport,
      stream: ({params: viewport}) => fromEvent(viewport, 'scroll', {passive: true})
        .pipe(
          map(() => viewport.scrollTop),
          startWith(viewport.scrollTop),
          subscribeIn(fn => zone.runOutsideAngular(fn)),
        ),
    }).value;
  }

  /**
   * Tracks whether currently scrolling the viewport.
   */
  private computeScrolling(): Signal<boolean> {
    const zone = inject(NgZone);

    return rxResource({
      defaultValue: false,
      params: () => this.tableViewRef()?.viewport,
      stream: ({params: viewport}) => fromEvent(viewport, 'scroll', {passive: true})
        .pipe(
          switchMap(() => concat(of(true), timer(150).pipe(map(() => false)))),
          startWith(false),
          subscribeIn(fn => zone.runOutsideAngular(fn)),
        ),
    }).value;
  }

  /**
   * Loads a range of rows, based on the current sort and filter criteria, into the cache.
   */
  public loadRange(start: number, end: number): Promise<void[]> {
    const sortCriteria = this.sortCriteria();
    const columnFilters = this.filterCriteria();
    const tableFilter = this._tableFilter() ?? undefined;

    const pages = pagesByRange(start, end, this.pageSize);
    const requests = pages.map(page => {
      const response = this.loadPage({
        cache: this._cache,
        loader: this._dataLoaderFn,
        page,
        pageSize: this.pageSize,
        level: 0,
        columnFilters,
        tableFilter,
        sortCriteria,
      });
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
  private loadPage({cache, loader, page, pageSize, level, sortCriteria, columnFilters, tableFilter}: {
    cache: TableCache<T>;
    loader: SciDataLoaderFn<T>;
    page: number;
    pageSize: number;
    level: number;
    sortCriteria: SciSortCriterion[];
    columnFilters: SciColumnFilter[];
    tableFilter?: string;
  }): Signal<SciRow<T>[] | undefined> {
    const pageStart = page * pageSize;
    const pageEnd = pageStart + pageSize;
    const cacheKey = `${pageStart}-${pageEnd}` as const;
    if (cache.has(cacheKey)) {
      return computed(() => cache.get(cacheKey)!.rows());
    }

    const items = signal<T[] | undefined>(undefined);
    const subscription = Observables.coerce(loader({
      start: pageStart,
      end: pageEnd,
      pageSize,
      page,
      sortCriteria,
      tableFilter,
      columnFilters,
    })).subscribe({
      next: result => {
        cache.setTotalCount(result.totalCount);
        items.set(result.items);
      },
      error: err => {
        // TODO [egob]: what do we do when the datasource throws an error?
        cache.deleteIfEmpty(cacheKey);
      },
    });

    const pageRowsById = new Map<unknown, TableCacheRow<T>>();
    const cacheEntry: TableCacheEntry<T> = {
      rows: computed(() => {
        const resolved = items();
        const columns = this.columns();
        return untracked(() => resolved ? this.mapItemsToRows(resolved, columns, pageStart, level, pageRowsById) : undefined);
      }),
      dispose: () => {
        subscription.unsubscribe();
        pageRowsById.forEach(row => row.childrenCache.clear());
      },
      start: pageStart,
      end: pageEnd,
    };

    cache.set(cacheKey, cacheEntry);
    return cacheEntry.rows;
  }

  /**
   * Toggles sort on a column. ASC -> DESC -> No sort
   *
   * TODO [egob] Revisit API, do we really want a three-state and implicit toggling logic?
   */
  public sort(columnName: `column:${string}`, multi: boolean): void {
    // Scroll to the top as soon as sort changes.
    // Done here explicitly to avoid race-conditions and pages being loaded unnecessarily.
    this.tableViewRef()?.scrollToTop();

    this.sortCriteria.update(sortCriteria => {
      const column = this.columns().find(column => column.name === columnName);
      if (!column) {
        throw Error(`[NullColumnError] Column '${columnName}' not found in table '${this.name()}'.`);
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
    // Scroll to the top as soon as filter changes.
    // Done here explicitly to avoid race-conditions and pages being loaded unnecessarily.
    this.tableViewRef()?.scrollToTop();

    if (!options) {
      this._tableFilter.set(text as string);
      return;
    }

    const column = this.columns().find(column => column.name === options.columnName);
    if (!column) {
      throw Error(`[NullColumnError] Column '${options.columnName}' not found in table '${this.name()}'.`);
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

  private loadChildPage(parent: TableCacheRow<T>, page: number): void {
    if (!this._childDataLoaderFn) {
      return;
    }

    this.loadPage({
      cache: parent.childrenCache,
      loader: request => this._childDataLoaderFn!(parent.item!, request),
      page,
      pageSize: this.pageSize,
      level: parent.level + 1,
      sortCriteria: this.sortCriteria(),
      columnFilters: this.filterCriteria(),
      tableFilter: this._tableFilter() ?? undefined,
    });
  }

  public dispose(): void {
    this._cache.clear();
    this.disconnect();
  }

  /**
   * Loads a set of pages on criteria or viewport changes.
   */
  private installPageLoader(): void {
    effect(() => {
      const scrollRange = this.scrollRange();
      const sortCriteria = this.sortCriteria();
      const columnFilters = this.filterCriteria();
      const tableFilter = this._tableFilter() ?? undefined;

      if (!scrollRange) {
        return;
      }

      // Add 1 to end of the range to make sure children of the last row are loaded if it's expanded.
      const pages = this._cache.findPagesToLoad(scrollRange.start, scrollRange.end + 1, this.pageSize);
      untracked(() => pages.forEach(page => {
        if (page.parent) {
          this.loadChildPage(page.parent, page.page);
          return;
        }

        this.loadPage({
          cache: page.cache,
          loader: this._dataLoaderFn,
          pageSize: this.pageSize,
          page: page.page,
          level: 0,
          sortCriteria,
          columnFilters,
          tableFilter,
        });
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

  // TODO [dwie] Consider moving into factory
  private initColumn(type: SciColumnType, config: SciColumnDescriptorLike<T>): SciColumnLike<T> {
    // Columns with a custom component or template must provide a sort function to be sortable, because the default sort function does not work.
    const sortable = type === 'component' || type === 'template' ? !!config.sortable : config.sortable !== false;

    // Columns with a custom component or template must provide a filter function to be filterable, because the default filter function does not work.
    const filterable = type === 'component' || type === 'template' ? !!config.filterable : config.filterable !== false;

    return {
      ...config,
      type,
      name: config.name,
      filter: typeof config.filterable === 'object' ? config.filterable.matcher : defaultFilter,
      sort: typeof config.sortable === 'object' ? config.sortable.comparator : defaultSort,
      sortable: computed(() => this.sortable() && sortable),
      filterable: computed(() => this.filterable() && filterable),
      resizable: computed(() => this.resizable() && (config.resizable ?? true)),
      padding: 'padding' in config ? (config.padding ?? true) : true,
      label: coerceSignal(config.label ?? ''),
      width: computed(() => {
        const userSettings = this.userSettings().columns?.find(column => column.name === config.name);
        return userSettings?.width ? `${userSettings.width}px` : config.width ?? '1fr';
      }),
      minWidth: config.minWidth ?? 100,
      resizing: signal(false),
      location: {x: 0, width: 0}, // injected in `SciColumnComponent`
    } as SciColumnLike<T>;
  }

  private mapItemsToRows(items: T[], columns: SciColumnLike<T>[], pageStart: number, level: number, previousRows: Map<unknown, TableCacheRow<T>>): TableCacheRow<T>[] {
    return items.map((item, i) => {
      const id = this.trackBy(item);
      const previousRow = previousRows.get(id);
      const row: TableCacheRow<T> = {
        id,
        item,
        level,
        expanded: previousRow?.expanded ?? signal(false),
        hasChildren: coerce(this._childProvider?.hasChildren(item, {columnFilters: this.filterCriteria(), tableFilter: this._tableFilter() ?? undefined}) ?? false),
        childrenCache: previousRow?.childrenCache ?? new TableCache<T>(),
        bindings: coerceTableRowBindings(this._rowBindings ?? [], item, pageStart + i),
        cells: columns.map(column => {
          if (column.type === 'dynamic') {
            const value = column.value(item);
            const valueSignal = coerceSignal(column.value(item));
            const valueType = valueSignal();
            const isComponent = typeof value === 'object' && 'component' in value;
            const isTemplate = typeof value === 'object' && 'template' in value;

            if (isComponent) {
              return ({
                value: undefined,
                component: value,
                type: 'component',
                padding: column.padding(item),
                column,
              } as SciCellLike);
            }
            else if (isTemplate) {
              return ({
                value: undefined,
                template: value,
                type: 'template',
                padding: column.padding(item),
                column,
              } as SciCellLike);
            }
            else if (typeof valueType === 'string') {
              return ({
                value: valueSignal,
                type: 'string',
                padding: column.padding(item),
                column,
              } as SciCellLike);
            }
            else if (typeof valueType === 'number') {
              return ({
                value: valueSignal,
                type: 'number',
                padding: column.padding(item),
                column,
              } as SciCellLike);
            }
            else {
              return ({
                value: valueSignal,
                type: 'boolean',
                padding: column.padding(item),
                column,
              } as SciCellLike);
            }
          }
          else {
            return ({
              value: column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item)) : undefined,
              component: column.type === 'component' ? column.component(item) : undefined,
              template: column.type === 'template' ? column.template(item) : undefined,
              type: column.type,
              padding: column.type !== 'component' && column.type !== 'template' ? true : column.padding,
              column,
            } as SciCellLike);
          }
        }),
      };
      previousRows.set(id, row);
      return row;
    });
  }

  /**
   * Creates a signal to read and write table user settings.
   */
  private computeUserSettings(): WritableSignal<SciTableUserSettings> {
    // Load user settings from storage.
    const userSettings = resource({
      params: () => this.name(),
      loader: async ({params: tableName}) => {
        try {
          const serialized = await this._tableStorage.load(`scion.components.${tableName}`);
          return serialized ? JSON.parse(serialized) as SciTableUserSettings : {columns: []};
        }
        catch (error) {
          console.warn(`[SciTable] Failed to load user settings for '${tableName}'.`, error);
          return {columns: []};
        }
      },
      defaultValue: {columns: []},
    });

    // Persist settings to storage.
    effect(() => {
      if (userSettings.status() === 'local' && this.name()) {
        untracked(() => void this._tableStorage.store(`scion.components.${this.name()!}`, JSON.stringify(userSettings.value())));
      }
    });

    return userSettings.value;
  }

  /**
   * Call trackBy function or fallback to track by object reference.
   */
  public trackBy(item: T): unknown {
    return this._trackBy?.(item) ?? item;
  }

  private computeActiveRow(): Signal<SciRow<T> | undefined> {
    return computed(() => {
      const activeItem = this.activeItem();
      if (activeItem === undefined) {
        return undefined;
      }

      const id = this.trackBy(activeItem);
      if (id === undefined) {
        return undefined;
      }

      return this._cache.rowsById().get(id);
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

/**
 * Get pages by range and pageSize. End is exclusive.
 */
function pagesByRange(start: number, end: number, pageSize: number): number[] {
  const startPage = Math.floor(start / pageSize);
  const endPage = Math.floor((end - 1) / pageSize); // `end` is exclusive, so use the last included index (`end - 1`) for page calculation.
  return rangeInclusive(startPage, endPage);
}

export interface SciTableUserSettings {
  columns?: {name: string; width?: number}[];
}

export const ɵSCI_TABLE = new InjectionToken<Signal<ɵSciTable>>('ɵSciTable');

export interface SciTableViewRef {
  viewport: HTMLElement;
  viewportHeight: Signal<number>;
  viewportClientHeight: Signal<number>;
  headerHeight: Signal<number>;
  itemHeight: Signal<number>;
  scrollToTop: () => void;
}
