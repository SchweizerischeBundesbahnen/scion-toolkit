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
import {isArrayDatasource, isTreeDatasource, SciAsyncTableTreeDatasource, SciTableArrayDatasource, SciTableColumnFilter, SciTableDataProvider, SciTableDataSource, SciTableSortCriterion, SciTableTreeDatasource, SciTableTreeNodeIds} from './table-datasource';
import {SciTable, SciTableCellLike, SciTableColumnLike, SciTableDescriptor, SciTableRow, SciTableRowActionFactoryFn} from './table.model';
import {ɵSciTableColumnFactory} from './ɵtable-column.factory';
import {SCI_TABLE_STORAGE} from './table-storage';
import {coerceSignal, createDestroyableInjector} from '@scion/components/common';
import {SciTableCache} from './table.cache';
import {rxResource, takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {catchError, combineLatestWith, concat, fromEvent, of, skip, throwError, timer} from 'rxjs';
import {coerceTableRowBindings, SCI_TABLE_ROW_BINDING, SciTableRowBindingFactoryFn} from './table-row-binding';
import {clamp, Objects, Observables, runSafe} from '@scion/toolkit/util';
import {filter, map, startWith, switchMap} from 'rxjs/operators';
import {subscribeIn} from '@scion/toolkit/operators';
import {rangeInclusive} from './common';

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

  private readonly _cache = new SciTableCache<T>();
  private readonly _tableFilter = signal<string | null>(null);
  private readonly _selectedItems = signal(new Map<unknown, T>());
  private readonly _structure: TableTreeStructure<T>;

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
  public readonly visibleRowCount: Signal<number | undefined>;
  public readonly rowIndexById: Signal<Map<unknown, number>>;

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

    this._structure = new TableTreeStructure<T>({
      datasource: this._datasource,
      sortCriteria: this.sortCriteria,
      filterCriteria: this.filterCriteria,
      tableFilter: this._tableFilter,
    });
    this.visibleRowCount = this._structure.visibleNodeCount;
    this.rowIndexById = this._structure.nodeIndexById;

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

      const visibleNodes = this._structure.visibleNodes();
      const rowsByIndex = this.rowsByIndex();
      const rangeCount = scrollRange.end - scrollRange.start;
      const rowCount = Math.min(rangeCount, visibleNodes?.length ?? rangeCount);

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

      const totalCount = this.visibleRowCount() ?? viewportRowCount; // fill viewport if no data loaded yet
      return {
        start: clamp(start - this.bufferSize, {min: 0, max: Math.max(0, totalCount - viewportRowCount)}),
        end: clamp(end + this.bufferSize, {max: totalCount}),
      };
    }, {equal: Objects.isEqual});
  }

  private computeVirtualScrollOffset(): Signal<{top: number; bottom: number}> {
    return computed(() => {
      const itemHeight = this.tableViewRef()?.itemHeight() ?? 0;
      const totalCount = this.visibleRowCount() ?? 0;
      const rangeEnd = Math.min(this.scrollRange()?.end ?? 0, totalCount);

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
    const nodes = this._structure.visibleNodes() ?? [];
    const rowsByLocalIndex = this.rowsById();

    // console.log(rowsByLocalIndex, nodes);

    // console.log(nodes.reduce((map, node, index) => map.set(index, rowsByLocalIndex.get(node)), new Map<number, SciTableRow<T> | undefined>()))

    return nodes.reduce((map, node, index) => map.set(index, rowsByLocalIndex.get(node.id)), new Map<number, SciTableRow<T> | undefined>());

    // const getExpandedChildren = (nodes: SciTableTreeNode<unknown>[]): SciTableTreeNode<unknown>[] => {
    //   return nodes.flatMap(node => [
    //     node,
    //     ...rowsByLocalIndex.get(node.item)?.expanded() ? getExpandedChildren(nodes.filter(childNode => childNode.parent === node.item)) : [],
    //   ]);
    // };
    //
    // return getExpandedChildren(nodes.filter(node => node.parent === undefined)).reduce((rows, node, index) => {
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
  private loadBatch({nodes}: {nodes: SciTableTreeNodeIds[]}): {loading: Signal<boolean>; cancel: () => void} {
    // const nodesById = this._structure.nodesById() ?? new Map<unknown, SciTableTreeNodeIds>();
    const nodeIds = nodes.map(node => node.id);
    const nodeIdsToLoad = nodeIds.filter(id => !this._cache.has(id));

    if (nodeIdsToLoad.length === 0) {
      return {
        loading: this._cache.loading,
        cancel: () => this._cache.deleteIfLoading(nodes),
      };
    }

    const pageResource = runInInjectionContext(this._injector, () => {
      const tableResponse$ = runSafe(
        () => Observables.coerce(this._datasource.getItems(nodeIdsToLoad)),
        error => throwError(() => error));

      // Observe a consistent snapshot of columns and node Ids.
      // If the access happens directly in the `map` they can be out of sync because `nodesById` depends on `columns`.
      // Don't use the rowMapping data as resource params, since it should not refetch from the datasource on change.
      const rowMapping = toObservable(computed(() => {
        const columns = this.columns();
        const nodesById = this._structure.nodesById() ?? new Map<unknown, SciTableTreeNodeIds>();
        const nodeIndexById = this._structure.nodeIndexById();
        return {columns, nodesById, nodeIndexById};
      }));

      // Create a resource to track loading and error states.
      const resource = rxResource({
        stream: () => tableResponse$.pipe(
          combineLatestWith(rowMapping),
          map(([response, {columns, nodesById, nodeIndexById}]) => this.mapItemsToRow(response, columns, nodesById, nodeIndexById)),
          catchError(error => {
            console.error(error);
            throw error;
          }),
        )},
      );

      return resource;
    });

    this._cache.set(nodeIdsToLoad, pageResource);

    return {
      loading: pageResource.isLoading,
      cancel: () => this._cache.deleteIfLoading(nodeIdsToLoad),
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
      const visibleNodes = this._structure.visibleNodes();

      if (!scrollRange || !visibleNodes) {
        return;
      }

      const batches = this.findBatchesToLoad(scrollRange.start, scrollRange.end, visibleNodes);

      untracked(() => {
        batches.forEach(page => {
          const pageRef = this.loadBatch({nodes: page});
          onCleanup(() => {
            pageRef.cancel();
          });
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
  public findBatchesToLoad(start: number, end: number, visibleNodes: Array<SciTableTreeNodeIds>): SciTableTreeNodeIds[][] {
    const batches = new Array<SciTableTreeNodeIds[]>();
    const pageStart = Math.floor(start / this.pageSize);
    const pageEnd = Math.floor(end / this.pageSize);
    const pages = rangeInclusive(pageStart, pageEnd);

    for (const page of pages) {
      const start = page * this.pageSize;
      const end = start + this.pageSize;
      batches.push(visibleNodes.slice(start, end));
    }

    return batches;
  }

  private mapItemsToRow(items: T[], columns: SciTableColumnLike<T>[], nodesById: Map<unknown, SciTableTreeNodeIds>, nodeIndexById: Map<unknown, number>): SciTableRow<T>[] {
    const childrenByParent = computed(() => mapChildrenToParent(this._structure.nodes.value() ?? []));

    return items.map((item): SciTableRow<T> | undefined => {
      const id = this.trackBy(item);
      const index = nodeIndexById.get(id) ?? -1;
      const node = nodesById.get(id);
      if (!node) {
        return undefined;
      }

      const level = calculateLevel(node);
      const hasChildren = computed(() => (childrenByParent().get(id)?.length ?? 0) > 0);

      return {
        id,
        index,
        item,
        loading: false,
        active: computed(() => item === this.activeItem()),
        selected: computed(() => this.selectedIds().has(id)),
        hovered: computed(() => this.hoveredRow()?.id === id),
        expanded: computed(() => this._structure.expandedNodeIds().has(id)),
        level,
        parentId: node.parentId,
        hasChildren,
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
    }).filter((node): node is SciTableRow<T> => !!node);

    function calculateLevel(node: SciTableTreeNodeIds, level: number = 0): number {
      if (node.parentId === undefined) {
        return level;
      }

      return calculateLevel(nodesById.get(node.parentId)!, level + 1);
    }
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
    this._structure.expand(id);
  }

  public expandAll(): void {
    this._structure.expandAll();
  }

  public collapse(id: unknown): void {
    this._structure.collapse(id);
  }

  public collapseAll(): void {
    this._structure.collapseAll();
  }

  public toggleRow(id: unknown): void {
    this._structure.toggleRow(id);
  }
}

function mapChildrenToParent(nodes: SciTableTreeNodeIds[]): Map<unknown, unknown[]> {
  const childrenIdsByParent = new Map<unknown, unknown[]>();
  for (const node of nodes) {
    const values = childrenIdsByParent.get(node.parentId) ?? [];
    values.push(node.id);
    childrenIdsByParent.set(node.parentId, values);
  }
  return childrenIdsByParent;
}

export class TableTreeStructure<T> {

  private readonly _injector = inject(Injector);

  private readonly _datasource: SciTableDataProvider<T>;
  private readonly _sortCriteria: Signal<SciTableSortCriterion[]>;
  private readonly _filterCriteria: Signal<SciTableColumnFilter[]>;
  private readonly _tableFilter: Signal<string | null>;

  private readonly _expandedAll = signal(false);
  private readonly _toggledNodes = signal(new Set<unknown>());

  private readonly _unfilteredNodes = rxResource({
    params: () => this._sortCriteria(),
    stream: ({params}) => {
      return runInInjectionContext(this._injector, () => Observables.coerce(this._datasource.getIds({sortCriteria: params, columnFilters: []})).pipe(
        map((ids): SciTableTreeNodeIds[] => {
          if (isTreeDatasource(this._datasource)) {
            return ids as SciTableTreeNodeIds[];
          }

          return ids.map(id => ({id}));
        }),
      ));
    },
  });

  public readonly nodes = rxResource({
    params: () => ({
      filterCriteria: this._filterCriteria(),
      tableFilter: this._tableFilter() ?? undefined,
      unfilteredNodes: this._unfilteredNodes.value() ?? [],
    }),
    stream: ({params}) => {
      const unfilteredNodes$ = of(params.unfilteredNodes);
      // If no filters are applied, filteredIds === allIds
      const load$ = !params.tableFilter && params.filterCriteria.length === 0 ?
        unfilteredNodes$ :
        runInInjectionContext(this._injector, () => Observables.coerce(this._datasource.getIds({sortCriteria: [], columnFilters: params.filterCriteria, tableFilter: params.tableFilter}))).pipe(
          map((ids): SciTableTreeNodeIds[] => {
            if (isTreeDatasource(this._datasource)) {
              return ids as SciTableTreeNodeIds[];
            }

            return ids.map(id => ({id}));
          }),
        );

      return load$.pipe(
        combineLatestWith(unfilteredNodes$),
        filter((nodes): nodes is [SciTableTreeNodeIds[], SciTableTreeNodeIds[]] => !!nodes[0] && !!nodes[1]),
        map(([filteredNodes, unfilteredNodes]) => {
          const nodesById = new Map(unfilteredNodes.map(node => [node.id, node]));
          const filteredIds = new Set(filteredNodes.map(node => node.id));
          const ancestorIds = new Set<unknown>();

          // Traverse up the tree and store ancestors nodes.
          for (const node of filteredNodes) {
            let parentId = (nodesById.get(node.id) ?? node).parentId;
            while (parentId !== undefined && !ancestorIds.has(parentId)) {
              ancestorIds.add(parentId);
              parentId = nodesById.get(parentId)?.parentId;
            }
          }

          const hasFilteredAncestor = (node?: SciTableTreeNodeIds): boolean => {
            if (node?.parentId === undefined) {
              return false;
            }

            if (filteredIds.has(node.parentId)) {
              return true;
            }

            return hasFilteredAncestor(nodesById.get(node.parentId));
          };

          const nodes = [
            ...filteredNodes,
            // Add additional nodes which are not already in the returned set and either
            //  - are an ancestor of a node in the returned set.
            //  - have an ancestor in the returned set.
            ...unfilteredNodes.filter(node => !filteredIds.has(node.id) && (ancestorIds.has(node.id) || hasFilteredAncestor(node))),
          ];
          const nodeIds = new Set(nodes.map(node => node.id));
          const sortedNodes = unfilteredNodes.filter(node => nodeIds.has(node.id));

          // Only place the children in correct order for TreeDatasource.
          if (isArrayDatasource(this._datasource)) {
            return sortedNodes;
          }
          const childrenIdsByParent = mapChildrenToParent(sortedNodes);

          const getChildren = (parentId?: unknown): SciTableTreeNodeIds[] => {
            const children = (childrenIdsByParent.get(parentId) ?? [])
              .flatMap(id => getChildren(id));
            const parent = nodesById.get(parentId);

            if (parent) {
              return [parent, ...children];
            }

            return children;
          };

          return getChildren(undefined);
        }),
      );
    },
  });

  public readonly nodesById = computed(() => this.nodes.value()?.reduce((nodes, node) => nodes.set(node.id, node), new Map<unknown, SciTableTreeNodeIds>()));

  public readonly visibleNodes = computed(() => {
    const expandedNodes = this.expandedNodeIds();
    const nodesById = this.nodesById();
    if (!nodesById) {
      return undefined;
    }

    const allAncestorsExpanded = (node?: SciTableTreeNodeIds): boolean => {
      if (!node?.parentId) {
        return true;
      }

      if (!expandedNodes.has(node.parentId)) {
        return false;
      }

      return allAncestorsExpanded(nodesById.get(node.parentId));
    };

    return untracked(() => [...nodesById.values()].filter(allAncestorsExpanded));
  });

  public readonly expandedNodeIds = computed(() => {
    const nodes = this.nodes.value() ?? [];
    const toggledRows = this._toggledNodes();

    if (this._expandedAll()) {
      return new Set(nodes
        .filter(node => !toggledRows.has(node.id))
        .map(node => node.id));
    }

    return toggledRows;
  });

  public readonly nodeIndexById = computed(() => {
    return (this.visibleNodes() ?? []).reduce((map, node, index) => map.set(node.id, index), new Map<unknown, number>());
  });

  public readonly visibleNodeCount = computed(() => this.visibleNodes()?.length);

  constructor(options: {
    sortCriteria: Signal<SciTableSortCriterion[]>;
    filterCriteria: Signal<SciTableColumnFilter[]>;
    tableFilter: Signal<string | null>;
    datasource: SciTableDataProvider<T>;
  }) {
    this._datasource = options.datasource;
    this._filterCriteria = options.filterCriteria;
    this._tableFilter = options.tableFilter;
    this._sortCriteria = options.sortCriteria;
  }

  public expand(id: unknown): void {
    if (!this._expandedAll()) {
      this._toggledNodes.update(toggledRows => new Set(toggledRows).add(id));
    }
    else {
      this._toggledNodes.update(toggledRows => {
        const newToggledRows = new Set(toggledRows);
        newToggledRows.delete(id);
        return newToggledRows;
      });
    }
  }

  public expandAll(): void {
    this._expandedAll.set(true);
    this._toggledNodes.set(new Set());
  }

  public collapse(id: unknown): void {
    if (!this._expandedAll()) {
      this._toggledNodes.update(toggledRows => {
        const newToggledRows = new Set(toggledRows);
        newToggledRows.delete(id);
        return newToggledRows;
      });
    }
    else {
      this._toggledNodes.update(toggledRows => new Set(toggledRows).add(id));
    }
  }

  public collapseAll(): void {
    this._expandedAll.set(false);
    this._toggledNodes.set(new Set());
  }

  public toggleRow(id: unknown): void {
    this._toggledNodes.update(toggledRows => {
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
