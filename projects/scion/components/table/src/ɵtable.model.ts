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
import {SciAsyncTableTreeDatasource, SciTableArrayDatasource, SciTableColumnFilter, SciTableDataSource, SciTableSortCriterion, SciTableTreeDatasource, SciTableTreeNode} from './table-datasource';
import {SciTable, SciTableCellLike, SciTableColumnLike, SciTableDescriptor, SciTableRow, SciTableRowActionFactoryFn} from './table.model';
import {ɵSciTableColumnFactory} from './ɵtable-column.factory';
import {SCI_TABLE_STORAGE} from './table-storage';
import {coerceSignal, createDestroyableInjector} from '@scion/components/common';
import {SciTableCacheNew, SciTableCacheRow, TableBatch} from './table.cache';
import {rxResource, takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {combineLatestWith, concat, fromEvent, of, skip, throwError, timer} from 'rxjs';
import {coerceTableRowBindings, SCI_TABLE_ROW_BINDING, SciTableRowBindingFactoryFn} from './table-row-binding';
import {clamp, Objects, Observables, runSafe} from '@scion/toolkit/util';
import {map, startWith, switchMap} from 'rxjs/operators';
import {subscribeIn} from '@scion/toolkit/operators';

export class ɵSciTable<T = unknown> implements SciTable<T> {

  private readonly _tableStorage = inject(SCI_TABLE_STORAGE);
  private readonly _injector = inject(Injector);

  public readonly name = signal<`table:${string}` | undefined>(undefined);
  public readonly columns: Signal<SciTableColumnLike<T>[]>;
  public readonly rowActions?: SciTableRowActionFactoryFn<T>;

  private readonly _rowBindings: SciTableRowBindingFactoryFn<T>[];
  private readonly _datasource: SciTableDataSource<T>;
  private readonly _trackBy?: (item: T) => unknown;

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

  private readonly _cache = new SciTableCacheNew<T>();
  private readonly _tableFilter = signal<string | null>(null);
  private readonly _selectedItems = signal(new Map<unknown, T>());
  private readonly _expandedAll = signal(false);
  private readonly _toggledRows = signal(new Set<unknown>());

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
  public readonly rowsByIndex = computed(() => this.projectRows());
  public readonly rowsById = this._cache.rowsById;
  public readonly rows = this.computeRows();

  public readonly allIds = rxResource({
    params: () => this.sortCriteria(),
    stream: ({params}) => {
      return runInInjectionContext(this._injector, () => Observables.coerce(this._datasource.getIds({sortCriteria: params, columnFilters: []})).pipe(
        map((ids): SciTableTreeNode<unknown>[] => {
          if (this.isTreeDatasource()) {
            return ids as SciTableTreeNode<unknown>[];
          }

          return ids.map(id => ({item: id}));
        }),
      ));
    },
  });

  public readonly filteredIds = rxResource({
    params: () => ({
      filterCriteria: this.filterCriteria(),
      tableFilter: this._tableFilter() ?? undefined,
      allIds: this.allIds.value() ?? [],
    }),
    stream: ({params}) => {
      // If no filters are applied, filteredIds === allIds
      if (!params.tableFilter && params.filterCriteria.length === 0) {
        return of(this.allIds.value());
      }

      return runInInjectionContext(this._injector, () => Observables.coerce(this._datasource.getIds({sortCriteria: [], columnFilters: params.filterCriteria, tableFilter: params.tableFilter})).pipe(
        map((ids): SciTableTreeNode<unknown>[] => {
          if (this._datasource instanceof SciTableTreeDatasource || this._datasource instanceof SciAsyncTableTreeDatasource) {
            return ids as SciTableTreeNode<unknown>[];
          }

          return ids.map(id => ({item: id}));
        }),
        map(ids => {
          const nodesById = new Map(params.allIds.map(node => [node.item, node]));
          const filteredIds = new Set(ids.map(node => node.item));
          const ancestorIds = new Set<unknown>();

          // Traverse up the tree and store ancestors nodes.
          for (const node of ids) {
            let parentId = (nodesById.get(node.item) ?? node).parent;
            while (parentId !== undefined && !ancestorIds.has(parentId)) {
              ancestorIds.add(parentId);
              parentId = nodesById.get(parentId)?.parent;
            }
          }

          const hasFilteredAncestor = (node?: SciTableTreeNode<unknown>): boolean => {
            if (node?.parent === undefined) {
              return false;
            }

            if (filteredIds.has(node.parent)) {
              return true;
            }

            return hasFilteredAncestor(nodesById.get(node.parent));
          };

          return [
            ...ids,
            // Add additional nodes which are not already in the returned set and either
            //  - are an ancestor of a node in the returned set.
            //  - have an ancestor in the returned set.
            ...params.allIds.filter(node => !filteredIds.has(node.item) && (ancestorIds.has(node.item) || hasFilteredAncestor(node)))];
        }),
      ));
    },
  });

  public readonly totalCount = computed(() => this.filteredIds.value()?.length);

  public readonly rowIdByIndex = computed(() => {
    const allIds = this.filteredIds.value() ?? [];

    const getChildren = (parentId?: unknown): SciTableTreeNode<unknown>[] => {
      // TODO [tree]: possibly optimize for table (additional getChildren is not needed)
      return allIds
        .filter(node => node.parent === parentId)
        .flatMap(node => getChildren(node));
    };

    return untracked(() => getChildren(undefined).reduce((map, node, index) => map.set(index, node), new Map<number, unknown>()));
  });

  public readonly rowIndexById = computed(() => {
    return new Map([...this.rowIdByIndex().entries()].map(kv => kv.reverse() as [unknown, number]));
  });

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
      this._datasource = new SciTableArrayDatasource(descriptor.ɵdatasource, {columns: this.columns, trackBy: descriptor.trackBy ?? (item => item)});
    }
    else if (descriptor.ɵdatasource) {
      this._datasource = descriptor.ɵdatasource(this.columns, descriptor.trackBy ?? (item => item));
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

  private projectRows(): Map<number, SciTableRow<T> | undefined> {
    const ids = this.filteredIds.value() ?? [];
    const rowsByLocalIndex = this.rowsById();

    // console.log(rowsByLocalIndex, ids);

    // console.log(ids.reduce((map, node, index) => map.set(index, rowsByLocalIndex.get(node)), new Map<number, SciTableRow<T> | undefined>()))

    return ids.reduce((map, node, index) => map.set(index, rowsByLocalIndex.get(node.item)), new Map<number, SciTableRow<T> | undefined>())

    // const getExpandedChildren = (nodes: SciTableTreeNode<unknown>[]): SciTableTreeNode<unknown>[] => {
    //   return nodes.flatMap(node => [
    //     node,
    //     ...rowsByLocalIndex.get(node.item)?.expanded() ? getExpandedChildren(ids.filter(childNode => childNode.parent === node.item)) : [],
    //   ]);
    // };
    //
    // return getExpandedChildren(ids.filter(node => node.parent === undefined)).reduce((rows, node, index) => {
    //   return rows.set(index, rowsByLocalIndex.get(node.item));
    // }, new Map<number, SciTableRow<T> | undefined>());
  }

  /**
   * Loads a range of rows, based on the current sort and filter criteria, into the cache.
   */
  public async loadRange(start: number, end: number): Promise<void> {
    // const sortCriteria = this.sortCriteria();
    // const columnFilters = this.filterCriteria();
    // const tableFilter = this._tableFilter() ?? undefined;
    //
    // // Calculate pages based on row indices and page size.
    // const pages = pagesByRange(start, end, this.pageSize);
    // if (!pages) {
    //   return;
    // }

    // Load pages and wait until completed loading.
    // await Promise.all(pages
    //   .map(page => this.loadPage({
    //     cache: this._cache,
    //     loader: this._datasource.load,
    //     page,
    //     pageSize: this.pageSize,
    //     level: 0,
    //     parentId: undefined,
    //     columnFilters,
    //     tableFilter,
    //     sortCriteria,
    //   }))
    //   .map(page => firstValueFrom(toLazyObservable(page.loading, {injector: this._injector}).pipe(first(loading => !loading), defaultIfEmpty(true)))));
  }

  /**
   * Loads the requested page from the cache or datasource and returns its loading state with a cancelation handler.
   */
  private loadBatch({parent, ids}: {parent?: SciTableCacheRow<T>; ids: unknown[]}): {loading: Signal<boolean>; cancel: () => void} {
    const cache = parent?.childrenCache ?? this._cache;
    const level = parent ? parent.level + 1 : 0;
    const parentId = parent?.id;

    if (ids.every(id => cache.has(id))) {
      return {
        loading: computed(() => cache.allResources().some(resource => resource.isLoading())),
        cancel: () => cache.deleteIfLoading(ids),
      };
    }

    const pageResource = runInInjectionContext(this._injector, () => {
      // Fetch data.
      const tableResponse$ = runSafe(
        () => Observables.coerce(this._datasource.getItems(ids, {parent: parent?.item})),
        error => throwError(() => error));

      const columns = toObservable(this.columns);
      // Create a resource to track loading and error states.
      return rxResource({
        stream: () => tableResponse$.pipe(
          combineLatestWith(columns),
          map(([response, columns]) => {
            return this.mapItemsToRow(response, columns, level, parentId, this._cache.rowsById());
          }),
        )},
      );
    });

    cache.set(ids, pageResource);

    return {
      loading: pageResource.isLoading,
      cancel: () => cache.deleteIfLoading(ids),
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

  /**
   * Indicates whether the built-in array datasource is used.
   *
   * Supports out-of-the-box filtering and sorting for built-in table columns.
   */
  public isArrayDatasource(): boolean {
    return this._datasource instanceof SciTableArrayDatasource || this._datasource instanceof SciAsyncTableTreeDatasource;
  }

  public isTreeDatasource(): boolean {
    return this._datasource instanceof SciTableTreeDatasource || this._datasource instanceof SciAsyncTableTreeDatasource;
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
      this._toggledRows(); // track toggled rows, to ensure child pages of new expanded rows are loaded.

      if (!scrollRange) {
        return;
      }

      const batches = this.findBatchesToLoad(scrollRange.start, scrollRange.end);

      untracked(() => {
        const rows = this.rowsById();

        batches.forEach(page => {
          const parentRow = rows.get(page.parent);
          // Always load root batches, but only load child batches if we already have a parent row.
          if (!page.parent || parentRow) {
            const pageRef = this.loadBatch({parent: parentRow, ids: page.ids});
            onCleanup(() => {
              pageRef.cancel();
            });
          }
        });
      });
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
  public findBatchesToLoad(start: number, end: number): TableBatch<T>[] {
    const filteredIds = this.filteredIds.value() ?? [];
    const childrenByNode = new Map<unknown, unknown[]>();

    for (const node of filteredIds.slice(start, end)) {
      const children = childrenByNode.get(node.parent) ?? [];
      children.push(node.item);
      childrenByNode.set(node.parent, children);
    }

    return [...childrenByNode.entries()].flatMap(([parent, children]) => {
      const batches: TableBatch<T>[] = [];
      for (let page = 0; page <= Math.floor(children.length / this.pageSize); page++) {
        const start = page * this.pageSize;
        const end = start + this.pageSize;
        batches.push({parent, ids: children.slice(start, end)});
      }
      return batches;
    });
  }

  private mapItemsToRow(items: T[], columns: SciTableColumnLike<T>[], level: number, parentId: unknown, existingRows: Map<unknown, SciTableCacheRow<T>>): SciTableCacheRow<T>[] {
    return items.map((item, i) => {
      const id = this.trackBy(item);
      const index = this.rowIndexById().get(id) ?? -1;
      const previousRow = existingRows.get(id);
      const hasChildren = computed(() => this.filteredIds.value()?.some(node => node.parent === id) ?? false);

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
        childrenCache: previousRow?.childrenCache ?? new SciTableCacheNew<T>(),
        bindings: coerceTableRowBindings(this._rowBindings, item, index),
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
