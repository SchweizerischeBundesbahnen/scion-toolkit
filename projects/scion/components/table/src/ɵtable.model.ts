/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, DestroyableInjector, effect, inject, InjectionToken, Injector, isSignal, linkedSignal, NgZone, resource, runInInjectionContext, Signal, signal, untracked, WritableSignal} from '@angular/core';
import {SciTableColumnFilter, SciTableDataLoaderFn, SciTablePageRequest, SciTablePageResponse, SciTableSortCriterion} from './table-datasource';
import {ChildProvider, PageableChildProvider, SciHierarchicalTableDatasource, SciPageableHierarchicalTableDatasource, SciPageableTableDatasource, SciTable, SciTableCellContext, SciTableCellLike, SciTableColumnLike, SciTableColumnType, SciTableDatasource, SciTableDescriptor, SciTableRow, SciTableRowActionFactoryFn} from './table.model';
import {ɵSciTableColumnFactory} from './ɵtable-column.factory';
import {MaybeAsync, rangeInclusive} from './common';
import {SCI_TABLE_STORAGE} from './table-storage';
import {SciTableColumnDescriptorLike} from './table-column.factory';
import {coerceSignal, createDestroyableInjector, toLazyObservable} from '@scion/components/common';
import {SciTableCache, SciTableCacheEntry, SciTableCacheRow} from './table.cache';
import {rxResource, takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {concat, defaultIfEmpty, firstValueFrom, fromEvent, of, skip, switchMap, throwError, timer} from 'rxjs';
import {coerceTableRowBindings, SCI_TABLE_ROW_BINDING, SciTableRowBindingFactoryFn} from './table-row-binding';
import {clamp, Objects, Observables, runSafe} from '@scion/toolkit/util';
import {first, map, startWith} from 'rxjs/operators';
import {subscribeIn} from '@scion/toolkit/operators';
import {arrayDatasource} from './ɵtable-array-datasource';

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
  public readonly sortCriteria = signal<SciTableSortCriterion[]>([]);
  public readonly filterCriteria = signal<SciTableColumnFilter[]>([]);

  private readonly _cache = new SciTableCache<T>(computed(() => this.expandedRows()));
  private readonly _tableFilter = signal<string | null>(null);
  private readonly _selectedItems = signal(new Map<unknown, T>());

  // Reset total count on criteria change to show skeletons instead of stale data while loading.
  // TODO [rebase]
  // public readonly totalCount = linkedSignal({
  //   source: () => this.criteria(),
  //   computation: () => undefined as number | undefined,
  // });

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
  public readonly rowIndexById = this._cache.indexById;
  public readonly rows = this.computeRows();
  public readonly expandedRows = signal(new Set<unknown>());

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
    else if (descriptor.ɵdatasource instanceof SciTableDatasource) {
      this._dataLoaderFn = arrayDatasource(descriptor.ɵdatasource.data, this.columns);
    }
    else if (descriptor.ɵdatasource instanceof SciPageableTableDatasource) {
      this._dataLoaderFn = descriptor.ɵdatasource.data;
    }
    else if (descriptor.ɵdatasource instanceof SciHierarchicalTableDatasource) {
      this._dataLoaderFn = arrayDatasource(descriptor.ɵdatasource.root, this.columns);
      const childProvider: ChildProvider<T> = descriptor.ɵdatasource.children;
      this._childProvider = childProvider;
      this._childDataLoaderFn = (item, request) => {
        const children = childProvider.getChildren(item);
        return {
          items: children.slice(request.start, request.end),
          totalCount: children.length,
        };
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
        const tableColumnFactory = new ɵSciTableColumnFactory<T>(descriptor);
        descriptor.columns(tableColumnFactory);
        return untracked(() => tableColumnFactory.columns.map(column => this.initColumn(column.type, column)));
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
        columnFilters,
        tableFilter,
        sortCriteria,
      }))
      .map(page => firstValueFrom(toLazyObservable(page.loading, {injector: this._injector}).pipe(first(loading => !loading), defaultIfEmpty(true)))));
  }

  /**
   * Loads the requested page from the cache or datasource and returns its loading state with a cancelation handler.
   */
  private loadPage({cache, loader, page, pageSize, level, sortCriteria, columnFilters, tableFilter}: {cache: SciTableCache<T>; loader: SciTableDataLoaderFn<T>; page: number; pageSize: number; level: number; sortCriteria: SciTableSortCriterion[]; columnFilters: SciTableColumnFilter[]; tableFilter?: string}): {loading: Signal<boolean>; cancel: () => void} {
    const pageStart = page * pageSize;
    const pageEnd = pageStart + pageSize;
    const cacheKey = `${pageStart}-${pageEnd}` as const;

    if (this._cache.has(cacheKey)) {
      return {
        loading: cache.get(cacheKey)!.rows.isLoading,
        cancel: () => cache.deleteIfLoading(cacheKey),
      };
    }

    const cacheEntryInjector = createDestroyableInjector({parent: this._injector});

    const pageRowsById = new Map<unknown, SciTableCacheRow<T>>();
    const cacheEntry: SciTableCacheEntry<T> = {
      rows: runInInjectionContext(cacheEntryInjector, () => {
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

        // Create a resource to track loading and error states.
        const tableResponse = rxResource({stream: () => tableResponse$});

        // Create a derived resource mapping the response to rows. Must be done in a separate resource to not fetch data anew on column change.
        const rows = resource({
          params: ({chain}) => {
            const items = chain(tableResponse)?.items;
            return items && {items, columns: this.columns()};
          },
          loader: async ({params}) => this.mapItemsToRow(params.items, params.columns, pageStart, level, pageRowsById),
          defaultValue: [],
        });

        // Synchronize total row count based on resource state.
        effect(() => {
          switch (rows.status()) {
            case 'resolved': {
              // Update count only after rows resolve to prevent premature scroll invalidation.
              cache.setTotalCount(tableResponse.value()?.totalCount);
              break;
            }
            case 'error': {
              console.error(rows.error()!.cause);
              // Reset count to scroll to the top so the user sees the error.
              cache.setTotalCount(0);
              break;
            }
          }
        });

        return rows;
      }),
      dispose: () => {
        cacheEntryInjector.destroy();
        pageRowsById.forEach(row => row.childrenCache.clear());
      },
      start: pageStart,
      end: pageEnd,
    };

    this._cache.set(cacheKey, cacheEntry);

    return {
      loading: cacheEntry.rows.isLoading,
      cancel: () => this._cache.deleteIfLoading(cacheKey),
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
      sortCriteria: this.sortCriteria(),
      columnFilters: this.filterCriteria(),
      tableFilter: this._tableFilter() ?? undefined,
    });
  }

  public reset(): void {
    this._cache.clear();
    this._cache.setTotalCount(undefined);
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

      if (!scrollRange) {
        return;
      }

      // Add 1 to end of the range to make sure children of the last row are loaded if it's expanded.
      const pages = this._cache.findPagesToLoad(scrollRange.start, scrollRange.end + 1, this.pageSize);

      // TODO [rebase]
      // untracked(() => {
      //   // Fall back to load the initial page if range is empty. Otherwise, if the table grows with its content,
      //   // no data would ever load because the scroll range remains 0.
      //   const pages = pagesByRange(scrollRange.start, scrollRange.end, this.pageSize) ?? [0];
      //
      //   pages.forEach(page => {
      //     const pageRef = this.loadPage({
      //       pageSize: this.pageSize,
      //       page,
      //       sortCriteria,
      //       tableFilter,
      //       columnFilters,
      //     });
      //     onCleanup(() => pageRef.cancel());
      //   });
      // });

      untracked(() => pages.forEach(page => {
        if (page.parent) {
          this.loadChildPage(page.parent, page.page);
          return;
        }

        const pageRef = this.loadPage({
          cache: page.cache,
          loader: this._dataLoaderFn,
          pageSize: this.pageSize,
          page: page.page,
          level: 0,
          sortCriteria,
          columnFilters,
          tableFilter,
        });
        onCleanup(() => pageRef.cancel());
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

  // TODO [dwi] Consider moving into factory
  private initColumn(type: SciTableColumnType, config: SciTableColumnDescriptorLike<T>): SciTableColumnLike<T> {
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
      header: coerceSignal(config.header ?? ''),
      width: computed(() => {
        const userSettings = this.userSettings().columns?.find(column => column.name === config.name);
        return userSettings?.width ? `${userSettings.width}px` : config.width ?? '1fr';
      }),
      minWidth: config.minWidth ?? 100,
      resizing: signal(false),
      location: {x: 0, width: 0}, // injected in `SciColumnComponent`
    } as SciTableColumnLike<T>;
  }

  private mapItemsToRow(items: T[], columns: SciTableColumnLike<T>[], pageStart: number, level: number, previousRows: Map<unknown, SciTableCacheRow<T>>): SciTableCacheRow<T>[] {
    return items.map((item, i) => {
      const id = this.trackBy(item);
      const index = pageStart + i;
      const previousRow = previousRows.get(id);

      const row: SciTableCacheRow<T> = {
        id,
        index,
        item,
        loading: false,
        active: computed(() => item === this.activeItem()),
        selected: computed(() => this.selectedIds().has(id)),
        hovered: computed(() => this.hoveredRow()?.index === index),
        level,
        hasChildren: Observables.coerce(this._childProvider?.hasChildren(item, {columnFilters: this.filterCriteria(), tableFilter: this._tableFilter() ?? undefined}) ?? false),
        childrenCache: previousRow?.childrenCache ?? new SciTableCache<T>(computed(() => this.expandedRows())),
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
}

function defaultFilter<T>(text: string | boolean | number, {value}: SciTableCellContext<T, string | boolean | number>): boolean {
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

function defaultSort<T>(a: SciTableCellContext<T, string | boolean | number>, b: SciTableCellContext<T, string | boolean | number>): number {
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
