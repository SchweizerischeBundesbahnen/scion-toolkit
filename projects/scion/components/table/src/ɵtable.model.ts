/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, effect, inject, InjectionToken, isSignal, linkedSignal, NgZone, resource, runInInjectionContext, signal, Signal, untracked, WritableSignal} from '@angular/core';
import {eSCI_TABLE_DATASOURCE_PROVIDER, provideTableDatasource, SciTableColumnFilter, SciTableSortCriterion, SciTreeTableDatasource} from './table-datasource';
import {SciEnumValueLike, SciTable, SciTableColumnLike, SciTableDescriptor, SciTableRowActionFactoryFn} from './table.model';
import {ɵSciTableColumnFactory} from './ɵtable-column.factory';
import {ɵSCI_COMPONENTS_STORAGE, ɵSingleActiveInjectorFactory} from '@scion/components/common';
import {rxResource} from '@angular/core/rxjs-interop';
import {concat, fromEvent, of, switchMap, timer} from 'rxjs';
import {SCI_TABLE_ROW_BINDINGS, SciTableRowBindingFactoryFn} from './table-row-binding';
import {clamp, Objects} from '@scion/toolkit/util';
import {map, startWith} from 'rxjs/operators';
import {subscribeIn} from '@scion/toolkit/operators';
import {SciTableCellValuePreloader} from './table-cell-value-preloader';
import {SciTableTree, SciTreeTableRow, ɵSciTableTree} from './table-tree.model';
import {MaybeArray} from '@scion/toolkit/types';
import {SciInMemoryTableDatasource} from './in-memory-table-datasource';

/**
 * @docs-private Not public API. For internal use only.
 */
export class ɵSciTable<T = unknown, ID = T> implements SciTable<ID> {

  private readonly _tableStorage = inject(ɵSCI_COMPONENTS_STORAGE);

  public readonly name = signal<`table:${string}` | undefined>(undefined);
  public readonly columns: Signal<SciTableColumnLike<T>[]>;
  public readonly rowActions?: SciTableRowActionFactoryFn<T>;

  private readonly _rowBindings: SciTableRowBindingFactoryFn<T>[];
  private readonly _datasource: SciTreeTableDatasource<T, ID>;
  private readonly _trackBy?: (item: T) => ID;

  public readonly tableViewRef = signal<SciTableViewRef | undefined>(undefined);
  public readonly userSettings: WritableSignal<SciTableUserSettings>;
  public readonly type: 'table' | 'tree';
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

  public readonly columnFilters = linkedSignal<SciTableColumnLike<T>[], SciTableColumnFilter[]>({
    source: () => this.columns(), // Discard stale criteria on column change.
    computation: (columns, previous) => previous?.value.filter(criteria => columns.some(column => column.name === criteria.columnName)) ?? [],
    equal: Objects.isEqual,
  });
  private readonly _tableCellValuePreloader = inject(SciTableCellValuePreloader);
  private readonly _tableFilter = signal<string | null>(null);
  private readonly _tableTree: SciTableTree<T, ID>;

  public readonly criteria = computed(() => ({sort: this.sortCriteria(), filter: this.columnFilters(), tableFilter: this._tableFilter()}));
  public readonly isLoading = computed(() => this._tableTree.isLoading() || this._tableCellValuePreloader.isLoading());
  public readonly isError = computed(() => this._tableTree.isError());
  public readonly activeRow = computed(() => this._tableTree.activeRow());
  public readonly activeItem = computed(() => this._tableTree.activeRowId());
  public readonly selectedItems = computed(() => [...this._tableTree.selectedRowIds()]);
  public readonly viewportRows = this.computeViewportRows();
  public readonly rows = computed(() => this._tableTree.rows());
  public readonly rowCount = computed(() => this._tableTree.rows().length);

  constructor(descriptor: SciTableDescriptor<T, ID> & {type?: 'table' | 'tree'}) {
    this.type = descriptor.type ?? 'table';
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
    this.columns = this.computeColumns(descriptor);

    this.rowActions = descriptor.rowActions;
    this._rowBindings = [
      ...descriptor.rowBindings ? [descriptor.rowBindings] : [],
      ...inject<SciTableRowBindingFactoryFn<T>[]>(SCI_TABLE_ROW_BINDINGS, {optional: true}) ?? [],
    ];
    this._trackBy = descriptor.trackBy;

    const datasourceProvider = isSignal(descriptor.datasource) ? provideTableDatasource<T>(descriptor.datasource) : descriptor.datasource;
    this._datasource = datasourceProvider[eSCI_TABLE_DATASOURCE_PROVIDER](this);

    this._tableTree = new ɵSciTableTree<T, ID>({
      sortCriteria: this.sortCriteria,
      columnFilters: this.columnFilters,
      tableFilter: this._tableFilter,
      columns: this.columns,
      trackBy: this.trackBy.bind(this),
      rowBindings: this._rowBindings,
      datasource: this._datasource,
    });

    this.installPageLoader();
    this.resetHoveredRowOnScrollOrCriteriaChange();
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

  private computeColumns(descriptor: SciTableDescriptor<T, ID>): Signal<SciTableColumnLike<T>[]> {
    // Create a factory to instantiate a new injector per column factory execution, releasing resources allocated in the previous execution.
    const injectorFactory = new ɵSingleActiveInjectorFactory();

    return computed(() => runInInjectionContext(injectorFactory.create(), () => {
      const tableColumnFactory = new ɵSciTableColumnFactory<T, ID>(this);
      descriptor.columns(tableColumnFactory);
      return tableColumnFactory.columns;
    }));
  }

  /**
   * Computes the rows currently displayed in the viewport (plus buffer before and after the viewport).
   */
  private computeViewportRows(): Signal<SciTreeTableRow<T, ID>[]> {
    return computed(() => {
      const scrollRange = this.scrollRange();
      return scrollRange ? this._tableTree.rows().slice(scrollRange.start, scrollRange.end) : [];
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

      return {
        start: clamp(start - this.bufferSize, {min: 0, max: Math.max(0, this.rowCount() - viewportRowCount)}),
        end: clamp(end + this.bufferSize, {max: this.rowCount()}),
      };
    }, {equal: Objects.isEqual});
  }

  private computeVirtualScrollOffset(): Signal<{top: number; bottom: number}> {
    return computed(() => {
      // Remove virtual-scroll padding so the error message and retry button are in view.
      if (this.isError()) {
        return {top: 0, bottom: 0};
      }

      const itemHeight = this.tableViewRef()?.itemHeight() ?? 0;
      const rowCount = this.rowCount();
      const rangeEnd = Math.min(this.scrollRange()?.end ?? 0, rowCount);

      return {
        top: (this.scrollRange()?.start ?? 0) * itemHeight,
        bottom: (rowCount - rangeEnd) * itemHeight,
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
   * Loads the requested page from the cache or datasource and returns its loading state with a cancelation handler.
   */
  // private loadPage(nodeIds: ID[]): {cancel: () => void} {
  //   const nodeIdsToLoad = nodeIds.filter(id => !this._cache.has(id));
  //
  //   if (nodeIdsToLoad.length === 0) {
  //     return {
  //       cancel: () => this._cache.deleteIfLoading(nodeIds),
  //     };
  //   }
  //   // if (1+1) {
  //   //   return {
  //   //     cancel: () => {
  //   //
  //   //     }
  //   //   }
  //   // }
  //
  //   // Track consistent snapshot of columns and node Ids.
  //   // If the access happens directly in `mapItemsToRow` they can be out of sync because `nodesById` depends on `columns`.
  //   // Don't use the rowMapping data as resource params, since it should not refetch from the datasource on change.
  //   const snapshot = computed(() => {
  //     const columns = this.columns();
  //     const nodeById = this._tableTree.nodeById();
  //     const nodeIndexById = this._tableTree.nodeIndexById();
  //     return {columns, nodeById, nodeIndexById};
  //   });
  //
  //   // Create a resource to track loading and error states.
  //   console.log('>>> nodesToLoad', nodeIdsToLoad);
  //   this._cache.set(nodeIdsToLoad, rxResource({
  //     stream: () => {
  //       // Injector for the datasource call; destroyed on stream completion to clean up allocated resources.
  //       const datasourceInjector = ɵcreateDestroyableInjector({parent: this._injector});
  //
  //       // Create separate injection context per items emission to clean up allocated resources.
  //       const itemsInjectorFactory = new ɵSingleActiveInjectorFactory({parent: datasourceInjector});
  //
  //       return runInInjectionContext(datasourceInjector, () => Observables.coerce(this._datasource.getItems(nodeIdsToLoad)))
  //         .pipe(
  //           combineLatestWith(toLazyObservable(snapshot, {injector: datasourceInjector})),
  //           map(([response, {columns, nodeById, nodeIndexById}]) => runInInjectionContext(itemsInjectorFactory.create(), () => this.mapItemsToRow(response, columns, nodeById, nodeIndexById))),
  //           catchError(error => { // TODO [ask etienne] required? Wouldn't it be better to have an effect on error at a single place
  //             console.error(error);
  //             throw error;
  //           }),
  //           finalize(() => datasourceInjector.destroy()),
  //         );
  //     },
  //     injector: this._injector,
  //     defaultValue: [],
  //   }));
  //
  //   return {
  //     cancel: () => this._cache.deleteIfLoading(nodeIdsToLoad),
  //   };
  // }

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
  public filter(text: string | number | boolean | SciEnumValueLike | SciEnumValueLike[] | null, options: {columnName: `column:${string}`}): void;
  public filter(text: string | number | boolean | SciEnumValueLike | SciEnumValueLike[] | null, options?: {columnName: `column:${string}`}): void {
    // Scroll to the top as soon as filter changes.
    // Done here explicitly to avoid race-conditions and pages being loaded unnecessarily.
    this.tableViewRef()?.scrollToTop();

    if (!options) {
      this._tableFilter.set(text as string | null);
      return;
    }

    const column = this.columns().find(column => column.name === options.columnName);
    if (!column) {
      throw Error(`[NullColumnError] Column '${options.columnName}' not found in table '${this.name()}'.`);
    }

    this.columnFilters.update(filterCriteria => {
      const newFilterCriteria = filterCriteria.filter(filterCriterion => filterCriterion.columnName !== options.columnName);
      return text === null ? newFilterCriteria : newFilterCriteria.concat({columnName: column.name, text});
    });
  }

  public setActiveItem(id: ID | undefined): void {
    this._tableTree.setActiveRow(id);
  }

  public setHoveredItem(id: ID | undefined): void {
    this._tableTree.setHoveredRow(id);
  }

  public updateSelectedItems(updateFn: (ids: Set<ID>) => Set<ID>): void {
    this._tableTree.updateSelectedRows(updateFn);
  }

  /**
   * Indicates whether the built-in in-memory datasource is used.
   */
  public isInMemoryDatasource(): boolean {
    return this._datasource instanceof SciInMemoryTableDatasource;
  }

  public reload(): void {
    this._tableTree.reload();
  }

  public reloadFailed(): void {
    this._tableTree.reloadFailed();
  }

  public dispose(): void {
    this._tableTree.dispose();
    this.disconnect();
  }

  /**
   * Loads a set of pages on criteria or viewport changes.
   */
  private installPageLoader(): void {
    effect(onCleanup => {
      const scrollRange = this.scrollRange();
      const visibleNodes = this._tableTree.rows();

      if (!scrollRange) {
        return;
      }

      // TODO [DWIE/ETIENNE] Wieso änders sich scroll range so oft beim initial load?
      // scrollRange {start: 0, end: 40}
      // scrollRange {start: 0, end: 30}
      // scrollRange {start: 0, end: 40}
      // scrollRange {start: 0, end: 55}
      // scrollRange {start: 0, end: 45}
      // scrollRange {start: 0, end: 55}
      console.log('>>> scrollRange', scrollRange);
      // console.log('>>> visibleNodes count', visibleNodes.length);

      untracked(() => {
        // Calculate start and end pages that contain the range.
        const startPage = Math.floor(scrollRange.start / this.pageSize);
        const endPage = Math.floor((scrollRange.end - 1) / this.pageSize);

        for (let page = startPage; page <= endPage; page++) {
          const index = page * this.pageSize;
          const ids = visibleNodes.slice(index, index + this.pageSize).map(node => node.id);
          const loader = this._tableTree.loadItems(ids);
          onCleanup(() => loader.cancel());
        }
      });
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
          const serialized = await this._tableStorage.load(`scion.components:${tableName}`);
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
        untracked(() => void this._tableStorage.store(`scion.components:${this.name()!}`, JSON.stringify(userSettings.value())));
      }
    });

    return userSettings.value;
  }

  private resetHoveredRowOnScrollOrCriteriaChange(): void {
    effect(() => {
      this.criteria(); // reset on criteria change
      this.scrolling(); // reset when start scrolling
      this._tableTree.setHoveredRow(undefined);
    });
  }

  /**
   * Call trackBy function or fallback to track by object reference.
   */
  public trackBy(item: T): ID {
    if (this._trackBy !== undefined) {
      return this._trackBy(item);
    }

    return item as unknown as ID;
  }

  public select(ids: MaybeArray<ID>): void {
    this._tableTree.setSelectedRows(ids);
  }

  public expand(ids: MaybeArray<ID>): void {
    this._tableTree.expand(ids);
  }

  public expandAll(): void {
    this._tableTree.expandAll();
  }

  public collapse(ids: MaybeArray<ID>): void {
    this._tableTree.collapse(ids);
  }

  public collapseAll(): void {
    this._tableTree.collapseAll();
  }

  public toggleRow(id: ID): void {
    this._tableTree.toggleExpand(id);
  }
}

export interface SciScrollRange {
  /** inclusive */
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
