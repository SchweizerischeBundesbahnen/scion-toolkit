/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, DestroyableInjector, effect, inject, InjectionToken, Injector, isSignal, linkedSignal, NgZone, resource, runInInjectionContext, signal, Signal, untracked, WritableSignal} from '@angular/core';
import {SciTableColumnFilter, SciTableDataLoaderFn, SciTablePageRequest, SciTablePageResponse, SciTableSortCriterion} from './table-datasource';
import {ChildProvider, PageableChildProvider, SciHierarchicalTableDatasource, SciPageableHierarchicalTableDatasource, SciPageableTableDatasource, SciTable, SciTableArrayDatasource, SciTableCellLike, SciTableColumnLike, SciTableDescriptor, SciTableRow, SciTableRowActionFactoryFn} from './table.model';
import {ɵSciTableColumnFactory} from './ɵtable-column.factory';
import {MaybeAsync, rangeInclusive} from './common';
import {SCI_TABLE_STORAGE} from './table-storage';
import {coerceSignal, createDestroyableInjector, toLazyObservable} from '@scion/components/common';
import {arrayDatasource, isArrayDatasource} from './ɵtable-array-datasource';
import {SciTableCache, SciTableCacheEntry, SciTableCacheRow, TablePage} from './table.cache';
import {rxResource, takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {combineLatestWith, concat, defaultIfEmpty, firstValueFrom, fromEvent, of, skip, throwError, timer} from 'rxjs';
import {coerceTableRowBindings, SCI_TABLE_ROW_BINDING, SciTableRowBindingFactoryFn} from './table-row-binding';
import {clamp, Objects, Observables, runSafe} from '@scion/toolkit/util';
import {first, map, startWith, switchMap} from 'rxjs/operators';
import {subscribeIn} from '@scion/toolkit/operators';

export class ɵSciTable<T = unknown> implements SciTable<T> {

  private readonly _tableStorage = inject(SCI_TABLE_STORAGE);
  private readonly _injector = inject(Injector);

  public readonly name = signal<`table:${string}` | undefined>(undefined);
  public readonly columns: Signal<SciTableColumnLike<T>[]>;
  public readonly rowActions?: SciTableRowActionFactoryFn<T>;

  private readonly _rowBindings: SciTableRowBindingFactoryFn<T>[];
  private readonly _dataLoaderFn: SciTableDataLoaderFn<T>;
  private readonly _trackBy?: (item: T) => unknown;
  private readonly _childProvider?: ChildProvider<T> | PageableChildProvider<T>;
  private readonly _childDataLoaderFn?: (item: T, request: SciTablePageRequest) => MaybeAsync<SciTablePageResponse<T>>;

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

  public readonly sortCriteria = linkedSignal<SciTableColumnLike<T>[], SciTableSortCriterion[]>({
    source: () => this.columns(), // Discard stale criteria on column change.
    computation: (columns, previous) => previous?.value.filter(criteria => columns.some(column => column.name === criteria.columnName)) ?? [],
    equal: Objects.isEqual,
  });

  public readonly filterCriteria = linkedSignal<SciTableColumnLike<T>[], SciTableColumnFilter[]>({
    source: () => this.columns(), // Discard stale criteria on column change.
    computation: (columns, previous) => previous?.value.filter(criteria => columns.some(column => column.name === criteria.columnName)) ?? [],
    equal: Objects.isEqual,
  });

  private readonly _cache = new SciTableCache<T>(true);
  private readonly _tableFilter = signal<string | null>(null);
  private readonly _selectedItems = signal(new Map<unknown, T>());
  private readonly _expandedAll = signal(false);
  private readonly _toggledRows = signal(new Set<unknown>());

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
  public readonly loading = this._cache.loading;
  public readonly error = this._cache.error;
  public readonly activeRow: Signal<SciTableRow<T> | undefined>;
  public readonly hoveredRow = computed(() => this.rowsByIndex().get(this.hoveredIndex()));
  public readonly selectedItems = computed(() => [...this._selectedItems().values()]);
  public readonly selectedIds = computed(() => new Set([...this._selectedItems().keys()]));
  public readonly rowsByIndex = this._cache.rowsByIndex;
  public readonly rowsById = this._cache.rowsById;
  public readonly rowIndexById = this._cache.indexById;
  public readonly rows = this.computeRows();

  constructor(descriptor: SciTableDescriptor<T>) {
    // TODO [table] Remove after datasource is final. See ɵillegaldatasource.
    descriptor = {...descriptor, ɵdatasource: descriptor.ɵdatasource ?? descriptor.datasource};

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
    this.columns = this.computeColumns(descriptor);

    this.rowActions = descriptor.rowActions;
    this._rowBindings = [
      ...descriptor.rowBindings ? [descriptor.rowBindings] : [],
      ...inject<SciTableRowBindingFactoryFn<T>[]>(SCI_TABLE_ROW_BINDING, {optional: true}) ?? [],
    ];
    this._trackBy = descriptor.trackBy;

    if (isSignal(descriptor.ɵdatasource)) {
      this._dataLoaderFn = arrayDatasource(descriptor.ɵdatasource, this.columns);
    }
    else if (descriptor.ɵdatasource instanceof SciTableArrayDatasource) {
      this._dataLoaderFn = arrayDatasource(descriptor.ɵdatasource.data, this.columns);
    }
    else if (descriptor.ɵdatasource instanceof SciPageableTableDatasource) {
      this._dataLoaderFn = descriptor.ɵdatasource.data;
    }
    else if (descriptor.ɵdatasource instanceof SciHierarchicalTableDatasource) {
      this._dataLoaderFn = arrayDatasource(descriptor.ɵdatasource.root, this.columns);
      const childProvider: ChildProvider<T> = descriptor.ɵdatasource.children;
      const root$ = toObservable(descriptor.ɵdatasource.root);
      this._childProvider = descriptor.ɵdatasource.children;
      this._childDataLoaderFn = (item, request) => {
        // Fetch children again as soon as data source changes.
        return root$.pipe(
          map(() => childProvider.getChildren(item)),
          map(children => ({
            items: children.slice(request.start, request.end),
            totalCount: children.length,
          })),
        );
      };
    }
    else if (descriptor.ɵdatasource instanceof SciPageableHierarchicalTableDatasource) {
      this._dataLoaderFn = descriptor.ɵdatasource.root;
      const childProvider: PageableChildProvider<T> = descriptor.ɵdatasource.children;
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

  private computeColumns(descriptor: SciTableDescriptor<T>): Signal<SciTableColumnLike<T>[]> {
    // Create separate injection context per factory invocation to clean up allocated resources, like RxJS subscriptions.
    let injector: DestroyableInjector | undefined;
    return computed(() => {
      injector?.destroy();
      injector = createDestroyableInjector({parent: this._injector});

      return runInInjectionContext(injector, () => {
        const tableColumnFactory = new ɵSciTableColumnFactory<T>(this);
        descriptor.columns(tableColumnFactory);
        return tableColumnFactory.columns;
      });
    });
  }

  /**
   * Computes the rows currently visible in the viewport (+buffer).
   */
  private computeRows(): Signal<SciTableRow<T>[]> {
    return computed(() => {
      const scrollRange = this.scrollRange();
      if (!scrollRange) {
        return [];
      }

      const rowsByIndex = this.rowsByIndex();
      const rowCount = scrollRange.end - scrollRange.start;

      // Populate rows with cached rows in the range window, fallback to row shell to show skeleton.
      return untracked(() => Array.from({length: rowCount}, (_, i) => rowsByIndex.get(scrollRange.start + i) ?? createSyntheticRow(i)));
    });

    function createSyntheticRow(index: number): SciTableRow<T> {
      return {
        index,
        loading: true,
        level: 0,
        hasChildren: signal(false).asReadonly(),
        expanded: signal(false).asReadonly(),
        active: signal(false).asReadonly(),
        selected: signal(false).asReadonly(),
        hovered: signal(false).asReadonly(),
      };
    }
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
  public async loadRange(start: number, end: number): Promise<void> {
    const sortCriteria = this.sortCriteria();
    const columnFilters = this.filterCriteria();
    const tableFilter = this._tableFilter() ?? undefined;

    // Calculate pages based on row indices and page size.
    const pages = pagesByRange(start, end, this.pageSize);
    if (!pages) {
      return;
    }

    // Load pages and wait until completed loading.
    await Promise.all(pages
      .map(page => this.loadPage({
        cache: this._cache,
        loader: this._dataLoaderFn,
        page,
        pageSize: this.pageSize,
        level: 0,
        parentId: undefined,
        columnFilters,
        tableFilter,
        sortCriteria,
      }))
      .map(page => firstValueFrom(toLazyObservable(page.loading, {injector: this._injector}).pipe(first(loading => !loading), defaultIfEmpty(true)))));
  }

  /**
   * Loads the requested page from the cache or datasource and returns its loading state with a cancelation handler.
   */
  private loadPage({cache, loader, page, pageSize, level, parentId, sortCriteria, columnFilters, tableFilter}: {cache: SciTableCache<T>; loader: SciTableDataLoaderFn<T>; page: number; pageSize: number; level: number; parentId: unknown; sortCriteria: SciTableSortCriterion[]; columnFilters: SciTableColumnFilter[]; tableFilter?: string}): {loading: Signal<boolean>; cancel: () => void} {
    const pageStart = page * pageSize;
    const pageEnd = pageStart + pageSize;
    const cacheKey = `${pageStart}-${pageEnd}` as const;

    if (cache.has(cacheKey)) {
      return {
        loading: cache.get(cacheKey)!.page.isLoading,
        cancel: () => cache.deleteIfLoading(cacheKey),
      };
    }

    const cacheEntryInjector = createDestroyableInjector({parent: this._injector});

    const pageResource = runInInjectionContext(cacheEntryInjector, () => {
      // Fetch data.
      const tableResponse$ = runSafe(
        () => Observables.coerce(loader({
          start: pageStart,
          end: pageEnd,
          pageSize,
          page,
          sortCriteria,
          tableFilter,
          columnFilters,
        })),
        error => throwError(() => error));

      const columns = toObservable(this.columns);
      // Create a resource to track loading and error states.
      const pageResource = rxResource({
        stream: () => tableResponse$.pipe(
          combineLatestWith(columns),
          map(([response, columns]) => {
            const rows = this.mapItemsToRow(response.items, columns, pageStart, level, parentId, this._cache.rowsById(), cacheEntryInjector);
            return {rows, totalCount: response.totalCount};
          }),
        )},
      );

      return pageResource;
    });
    const cacheEntry: SciTableCacheEntry<T> = {
      page: pageResource,
      dispose: () => {
        cacheEntryInjector.destroy();
      },
      start: pageStart,
      end: pageEnd,
    };

    cache.set(cacheKey, cacheEntry);

    return {
      loading: cacheEntry.page.isLoading,
      cancel: () => cache.deleteIfLoading(cacheKey),
    };
  }

  /**
   * Toggles sort on a column. ASC -> DESC -> No sort
   *
   * TODO [ego] Revisit API, do we really want a three-state and implicit toggling logic?
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

      const newSortCriterion = {columnName: column.name, direction} satisfies SciTableSortCriterion;
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

  private loadChildPage(parent: SciTableCacheRow<T>, page: number): {loading: Signal<boolean>; cancel: () => void} {
    if (!this._childDataLoaderFn) {
      return {
        loading: signal(false), cancel: () => {
        },
      };
    }

    return this.loadPage({
      cache: parent.childrenCache,
      loader: request => this._childDataLoaderFn!(parent.item!, request),
      page,
      pageSize: this.pageSize,
      level: parent.level + 1,
      parentId: parent.id,
      sortCriteria: this.sortCriteria(),
      columnFilters: this.filterCriteria(),
      tableFilter: this._tableFilter() ?? undefined,
    });
  }

  /**
   * Indicates whether the built-in array datasource is used.
   *
   * Supports out-of-the-box filtering and sorting for built-in table columns.
   */
  public isArrayDatasource(): boolean {
    return isArrayDatasource(this._dataLoaderFn);
  }

  public isHierarchicalDatasource(): boolean {
    return Boolean(this._childProvider);
  }

  public reset(): void {
    this._cache.clear();
    this._toggledRows.set(new Set());
  }

  public dispose(): void {
    this._cache.clear();
    this.disconnect();
  }

  /**
   * Loads a set of pages on criteria or viewport changes.
   */
  private installPageLoader(): void {
    effect(onCleanup => {
      const scrollRange = this.scrollRange();
      const sortCriteria = this.sortCriteria();
      const columnFilters = this.filterCriteria();
      const tableFilter = this._tableFilter() ?? undefined;
      this._toggledRows(); // track toggled rows, to ensure child pages of new expanded rows are loaded.

      if (!scrollRange) {
        return;
      }

      const pages = this.findPagesToLoad(scrollRange.start, scrollRange.end, this.pageSize);

      untracked(() => pages.forEach(page => {
        const pageRef = page.parent ?
          this.loadChildPage(page.parent, page.page) :
          this.loadPage({
            cache: page.cache,
            loader: this._dataLoaderFn,
            pageSize: this.pageSize,
            page: page.page,
            level: 0,
            parentId: undefined,
            sortCriteria,
            columnFilters,
            tableFilter,
          });

        onCleanup(() => {
          pageRef.cancel();
        });
      }));
    });
  }

  /**
   * Resets cache on criteria changes, to show skeletons instead of stale data while loading.
   */
  private installCriteriaWatcher(): void {
    toObservable(this.criteria).pipe(
      skip(1), // skip first emission to avoid race condition with loader on initialization.
      takeUntilDestroyed(),
    ).subscribe(() => {
      this._cache.clear();
    });
  }
  /**
   * Traverses the tree to find pages which need to be loaded based on the current scroll range.
   */
  public findPagesToLoad(start: number, end: number, pageSize: number): TablePage<T>[] {
    const pagesToLoad: TablePage<T>[] = [];

    const findPages = (cache: SciTableCache<T>, indexOffset: number, parent?: SciTableCacheRow<T>): number => {
      const directChildrenCount = cache.directChildrenCount();
      if (untracked(() => cache.empty()) || directChildrenCount === undefined) {
        // Always load first page, if cache is empty.
        pagesToLoad.push({parent, cache, page: 0});
        return indexOffset;
      }

      // Don't track recursive search rowsByLocalIndex.
      // Canceling a load changes the rowsByLocalIndex which would causes the outer effect to run again, which in turn causes load cancellation again and so on.
      const rowsByLocalIndex = untracked(() => cache.rowsByLocalIndex());
      const localPagesToLoad = new Set<number>();

      // loop through rows, while not yet reaching the end of the request.
      for (let localIndex = 0; localIndex < directChildrenCount && indexOffset < end; localIndex++, indexOffset++) {
        const row = rowsByLocalIndex.get(localIndex);
        if (!row) {
          const page = Math.floor(localIndex / pageSize);
          // Only add pages which are not already in the pagesToLoad / localPagesToLoad.
          if (indexOffset >= start && !localPagesToLoad.has(page)) {
            pagesToLoad.push({parent, cache, page});
            localPagesToLoad.add(page);
          }
        }
        else if (row.expanded()) {
          // Subtract one from new offset, since it's increased in the loop.
          indexOffset = findPages(row.childrenCache, indexOffset + 1, row) - 1;
        }
      }

      return indexOffset;
    };

    findPages(this._cache, 0);
    return pagesToLoad;
  }

  private mapItemsToRow(items: T[], columns: SciTableColumnLike<T>[], pageStart: number, level: number, parentId: unknown, existingRows: Map<unknown, SciTableCacheRow<T>>, injector: Injector): SciTableCacheRow<T>[] {
    return items.map((item, i) => {
      const id = this.trackBy(item);
      const index = pageStart + i;
      const previousRow = existingRows.get(id);
      const hasChildren = runInInjectionContext(injector, () => toSignal(Observables.coerce(this._childProvider?.hasChildren(item, {columnFilters: this.filterCriteria(), tableFilter: this._tableFilter() ?? undefined}) ?? false), {initialValue: false}));

      const row: SciTableCacheRow<T> = {
        id,
        index,
        item,
        loading: false,
        active: computed(() => item === this.activeItem()),
        selected: computed(() => this.selectedIds().has(id)),
        hovered: computed(() => this.hoveredRow()?.id === id),
        expanded: computed(() => {
          if (!hasChildren()) {
            return false;
          }
          if (this._expandedAll()) {
            return !this._toggledRows().has(id);
          }
          return this._toggledRows().has(id);
        }),
        level,
        parentId,
        hasChildren,
        childrenCache: previousRow?.childrenCache ?? new SciTableCache<T>(),
        bindings: coerceTableRowBindings(this._rowBindings, item, pageStart + i),
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
                // padding: column.padding(item),
                padding: true,
                column,
              } as SciTableCellLike);
            }
            else if (isTemplate) {
              return ({
                value: undefined,
                template: value,
                type: 'template',
                // padding: column.padding(item),
                padding: true,
                column,
              } as SciTableCellLike);
            }
            else if (typeof valueType === 'string') {
              return ({
                value: valueSignal,
                type: 'string',
                // padding: column.padding(item),
                padding: true,
                column,
              } as SciTableCellLike);
            }
            else if (typeof valueType === 'number') {
              return ({
                value: valueSignal,
                type: 'number',
                // padding: column.padding(item),
                padding: true,
                column,
              } as SciTableCellLike);
            }
            else {
              return ({
                value: valueSignal,
                type: 'boolean',
                // padding: column.padding(item),
                padding: true,
                column,
              } as SciTableCellLike);
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
            } as SciTableCellLike);
          }
        }),
      };
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

  private computeActiveRow(): Signal<SciTableRow<T> | undefined> {
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

  public expand(id: unknown): void {
    if (!this._expandedAll()) {
      this._toggledRows.update(toggledRows => new Set(toggledRows).add(id));
    }
    else {
      this._toggledRows.update(toggledRows => {
        const newToggledRows = new Set(toggledRows);
        newToggledRows.delete(id);
        return newToggledRows;
      });
    }
  }

  public expandAll(): void {
    this._expandedAll.set(true);
    this._toggledRows.set(new Set());
  }

  public collapse(id: unknown): void {
    if (!this._expandedAll()) {
      this._toggledRows.update(toggledRows => {
        const newToggledRows = new Set(toggledRows);
        newToggledRows.delete(id);
        return newToggledRows;
      });
    }
    else {
      this._toggledRows.update(toggledRows => new Set(toggledRows).add(id));
    }
  }

  public collapseAll(): void {
    this._expandedAll.set(false);
    this._toggledRows.set(new Set());
  }

  public toggleRow(id: unknown): void {
    this._toggledRows.update(toggledRows => {
      if (toggledRows.has(id)) {
        const newToggledRows = new Set(toggledRows);
        newToggledRows.delete(id);
        return newToggledRows;
      }
      else {
        return new Set(toggledRows).add(id);
      }
    });
  }
}

export interface SciScrollRange {
  /** incluse */
  start: number;
  /** exclusive */
  end: number;
}

/**
 * Gets pages by range and page size, or `null` if empty. End is exclusive.
 */
function pagesByRange(start: number, end: number, pageSize: number): number[] | null {
  const startPage = Math.floor(start / pageSize);
  const endPage = Math.floor((end - 1) / pageSize); // `end` is exclusive, so use the last included index (`end - 1`) for page calculation.
  const pages = rangeInclusive(startPage, endPage);
  return pages.length ? pages : null;
}

export interface SciTableUserSettings {
  columns?: {name: string; width?: number}[];
}

export const ɵSCI_TABLE = new InjectionToken<Signal<ɵSciTable>>('ɵSciTable');

export interface SciTableViewRef {
  viewport: HTMLElement;
  viewportHeight: Signal<number>;
  viewportWidth: Signal<number>;
  viewportClientHeight: Signal<number>;
  viewportClientWidth: Signal<number>;
  headerHeight: Signal<number>;
  cellPadding: Signal<number>;
  itemHeight: Signal<number>;
  scrollToTop: () => void;
}
