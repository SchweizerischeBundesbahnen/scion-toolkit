/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, effect, inject, InjectionToken, Injector, isSignal, linkedSignal, NgZone, resource, runInInjectionContext, signal, Signal, untracked, WritableSignal} from '@angular/core';
import {eSCI_TABLE_DATASOURCE_PROVIDER, provideTableDatasource, SciTableColumnFilter, SciTableSortCriterion, SciTreeTableDatasource, SciTreeTableNode} from './table-datasource';
import {SciEnumValueLike, SciTable, SciTableCellLike, SciTableColumnLike, SciTableDescriptor, SciTableRow, SciTableRowActionFactoryFn, skeletonRowId} from './table.model';
import {ɵSciTableColumnFactory} from './ɵtable-column.factory';
import {SCI_COMPONENTS_STORAGE, toLazyObservable, ɵcreateDestroyableInjector, ɵSingleActiveInjectorFactory} from '@scion/components/common';
import {SciTableCache} from './table.cache';
import {rxResource} from '@angular/core/rxjs-interop';
import {catchError, combineLatestWith, concat, finalize, fromEvent, of, switchMap, timer} from 'rxjs';
import {coerceTableRowBindings, SCI_TABLE_ROW_BINDINGS, SciTableRowBindingFactoryFn} from './table-row-binding';
import {clamp, Objects, Observables} from '@scion/toolkit/util';
import {map, startWith} from 'rxjs/operators';
import {subscribeIn} from '@scion/toolkit/operators';
import {SciTableCellValuePreloader} from './table-cell-value-preloader';
import {SciTableTree} from './table-tree.model';
import {MaybeArray} from '@scion/toolkit/types';
import {SciInMemoryTableDatasource} from './in-memory-table-datasource';

/**
 * @docs-private Not public API. For internal use only.
 */
export class ɵSciTable<T = unknown, ID = T> implements SciTable<ID> {

  private readonly _tableStorage = inject(SCI_COMPONENTS_STORAGE);
  private readonly _injector = inject(Injector);

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
  private readonly _cache = new SciTableCache<T, ID>();
  private readonly _tableCellValuePreloader = inject(SciTableCellValuePreloader);
  private readonly _tableFilter = signal<string | null>(null);
  private readonly _tableTree: SciTableTree<ID>;

  public readonly hoveredIndex = linkedSignal({
    source: () => {
      this.criteria(); // reset on criteria change
      this.scrolling(); // reset when start scrolling
    },
    computation: () => -1,
  });

  public readonly criteria = computed(() => ({sort: this.sortCriteria(), filter: this.columnFilters(), tableFilter: this._tableFilter()}));
  public readonly loading = computed(() => this._tableTree.loading() || this._cache.loading() || this._tableCellValuePreloader.loading());
  public readonly error = computed(() => this._cache.error() || this._tableTree.error());
  public readonly activeRow: Signal<SciTableRow<T, ID> | undefined>;
  public readonly selectedItems = computed(() => [...this._tableTree.selectedNodes().values()]);
  public readonly rowsById = this._cache.rowsById;
  public readonly rows = this.computeRows();
  public readonly visibleRowCount: Signal<number>;
  public readonly visibleRows: Signal<SciTreeTableNode<ID>[] | undefined>;
  public readonly rowIndexById: Signal<Map<ID, number>>;
  public readonly activeItem: Signal<ID | undefined>;
  public readonly activeIndex = computed(() => this.activeItem() !== undefined ? (this.rowIndexById().get(this.activeItem()!) ?? -1) : -1);
  public readonly rowActionsMenuOpen = signal(false);

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
    this.activeRow = this.computeActiveRow();
    this.columns = this.computeColumns(descriptor);

    this.rowActions = descriptor.rowActions;
    this._rowBindings = [
      ...descriptor.rowBindings ? [descriptor.rowBindings] : [],
      ...inject<SciTableRowBindingFactoryFn<T>[]>(SCI_TABLE_ROW_BINDINGS, {optional: true}) ?? [],
    ];
    this._trackBy = descriptor.trackBy;

    const datasourceProvider = isSignal(descriptor.datasource) ? provideTableDatasource<T>(descriptor.datasource) : descriptor.datasource;
    this._datasource = datasourceProvider[eSCI_TABLE_DATASOURCE_PROVIDER](this);

    this._tableTree = new SciTableTree<ID>({
      datasource: this._datasource,
      sortCriteria: this.sortCriteria,
      columnFilters: this.columnFilters,
      tableFilter: this._tableFilter,
    });
    this.visibleRowCount = this._tableTree.visibleNodeCount;
    this.rowIndexById = this._tableTree.nodeIndexById;
    this.visibleRows = this._tableTree.visibleNodes;
    this.activeItem = this._tableTree.activeNode;

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
   * Computes the rows currently visible in the viewport (+buffer).
   */
  private computeRows(): Signal<SciTableRow<T, ID>[]> {
    return computed(() => {
      const scrollRange = this.scrollRange();
      if (!scrollRange) {
        return [];
      }

      const visibleNodes = this._tableTree.visibleNodes();
      const rowsById = this.rowsById();
      const rangeCount = scrollRange.end - scrollRange.start;

      const rowCount = Math.min(rangeCount, this._tableTree.loading() ? rangeCount : visibleNodes.length);

      // Populate rows with cached rows in the range window, fallback to row shell to show skeleton.
      return untracked(() => Array.from({length: rowCount}, (_, i) => {
        const node = visibleNodes[scrollRange.start + i];
        if (node && rowsById.has(node.id)) {
          return rowsById.get(node.id)!;
        }
        return createSkeletonRow(i);
      }));
    });

    function createSkeletonRow(index: number): SciTableRow<T, ID> {
      return {
        index,
        id: skeletonRowId,
        item: undefined!,
        cells: [],
        bindings: coerceTableRowBindings([], undefined, index),
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

      // fill viewport if no data loaded yet
      const totalCount = this._tableTree.loading() ? viewportRowCount : this.visibleRowCount();

      return {
        start: clamp(start - this.bufferSize, {min: 0, max: Math.max(0, totalCount - viewportRowCount)}),
        end: clamp(end + this.bufferSize, {max: totalCount}),
      };
    }, {equal: Objects.isEqual});
  }

  private computeVirtualScrollOffset(): Signal<{top: number; bottom: number}> {
    return computed(() => {
      // Remove virtual-scroll padding so the error message and retry button are in view.
      if (this.error()) {
        return {top: 0, bottom: 0};
      }

      const itemHeight = this.tableViewRef()?.itemHeight() ?? 0;
      const totalCount = this.visibleRowCount();
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

  /**
   * Loads the requested page from the cache or datasource and returns its loading state with a cancelation handler.
   */
  private loadPage(nodeIds: ID[]): {cancel: () => void} {
    const nodeIdsToLoad = nodeIds.filter(id => !this._cache.has(id));

    if (nodeIdsToLoad.length === 0) {
      return {
        cancel: () => this._cache.deleteIfLoading(nodeIds),
      };
    }

    // Track consistent snapshot of columns and node Ids.
    // If the access happens directly in `mapItemsToRow` they can be out of sync because `nodesById` depends on `columns`.
    // Don't use the rowMapping data as resource params, since it should not refetch from the datasource on change.
    const snapshot = computed(() => {
      const columns = this.columns();
      const nodesById = this._tableTree.nodesById();
      const nodeIndexById = this._tableTree.nodeIndexById();
      return {columns, nodesById, nodeIndexById};
    });

    // Create a resource to track loading and error states.
    this._cache.set(nodeIdsToLoad, rxResource({
      stream: () => {
        // Injector for the datasource call; destroyed on stream completion to clean up allocated resources.
        const datasourceInjector = ɵcreateDestroyableInjector({parent: this._injector});

        // Create separate injection context per items emission to clean up allocated resources.
        const itemsInjectorFactory = new ɵSingleActiveInjectorFactory({parent: datasourceInjector});

        return runInInjectionContext(datasourceInjector, () => Observables.coerce(this._datasource.getItems(nodeIdsToLoad)))
          .pipe(
            combineLatestWith(toLazyObservable(snapshot, {injector: datasourceInjector})),
            map(([response, {columns, nodesById, nodeIndexById}]) => runInInjectionContext(itemsInjectorFactory.create(), () => this.mapItemsToRow(response, columns, nodesById, nodeIndexById))),
            catchError(error => { // TODO [ask etienne] required? Wouldn't it be better to have an effect on error at a single place
              console.error(error);
              throw error;
            }),
            finalize(() => datasourceInjector.destroy()),
          );
      },
      injector: this._injector,
      defaultValue: [],
    }));

    return {
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
    this._tableTree.setActiveNode(id);
  }

  public updateSelectedItems(updateFn: (ids: Set<ID>) => Set<ID>): void {
    this._tableTree.updateSelectedNodes(updateFn);
  }

  /**
   * Indicates whether the built-in in-memory datasource is used.
   */
  public isInMemoryDatasource(): boolean {
    return this._datasource instanceof SciInMemoryTableDatasource;
  }

  public reload(): void {
    this._cache.clear();
    this._tableTree.reload();
  }

  public reloadFailed(): void {
    this._cache.reloadFailed();
    this._tableTree.reloadFailed();
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
      const visibleNodes = this._tableTree.visibleNodes();

      if (!scrollRange) {
        return;
      }

      untracked(() => {
        // Calculate start and end pages that contain the range.
        const startPage = Math.floor(scrollRange.start / this.pageSize);
        const endPage = Math.floor((scrollRange.end - 1) / this.pageSize);

        for (let page = startPage; page <= endPage; page++) {
          const index = page * this.pageSize;
          const nodes = visibleNodes.slice(index, index + this.pageSize).map(node => node.id);
          const pageRef = this.loadPage(nodes);
          onCleanup(() => pageRef.cancel());
        }
      });
    });
  }

  private mapItemsToRow(items: T[], columns: SciTableColumnLike<T>[], nodesById: Map<ID, SciTreeTableNode<ID>>, nodeIndexById: Map<ID, number>): SciTableRow<T, ID>[] {
    // Indicates whether there are nodes with children.
    const isTree = Array.from(nodesById.values()).some(node => node.parentId !== undefined);

    return items.map((item): SciTableRow<T, ID> | undefined => {
      const id = this.trackBy(item);
      const index = nodeIndexById.get(id);
      const node = nodesById.get(id);
      if (node === undefined || index === undefined) {
        return undefined;
      }

      return {
        id,
        index,
        item,
        hovered: computed(() => this.hoveredIndex() === index),
        active: computed(() => this.activeItem() === id),
        selected: computed(() => this._tableTree.selectedNodes().has(id)),
        expanded: computed(() => this._tableTree.expandedNodes().has(id)),
        level: isTree ? calculateLevel(node) : undefined,
        parentId: node.parentId,
        hasChildren: computed(() => (this._tableTree.childrenIdsByParent().get(id)?.length ?? 0) > 0),
        bindings: coerceTableRowBindings(this._rowBindings, item, index),
        cells: columns.map(column => ({
          value: 'value' in column ? column.value(item) : undefined,
          component: column.type === 'component' ? column.component(item) : undefined,
          template: column.type === 'template' ? column.template(item) : undefined,
          type: column.type,
          column,
        } as SciTableCellLike)),
      };
    }).filter((node): node is SciTableRow<T, ID> => !!node);

    function calculateLevel(node: SciTreeTableNode<ID>): number {
      if (node.parentId === undefined) {
        return 0;
      }

      return calculateLevel(nodesById.get(node.parentId)!) + 1;
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

  /**
   * Call trackBy function or fallback to track by object reference.
   */
  public trackBy(item: T): ID {
    if (this._trackBy !== undefined) {
      return this._trackBy(item);
    }

    return item as unknown as ID;
  }

  private computeActiveRow(): Signal<SciTableRow<T, ID> | undefined> {
    return computed(() => {
      const activeItem = this.activeItem();
      const rowsById = this._cache.rowsById();

      return rowsById.has(activeItem!) ? rowsById.get(activeItem!) : undefined;
    });
  }

  public select(ids: MaybeArray<ID>): void {
    this._tableTree.select(ids);
  }

  public expand(ids: MaybeArray<ID>): void {
    this._tableTree.expand(ids);
  }

  public isExpanded(id: ID): boolean {
    return this._tableTree.expandedNodes().has(id);
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
    this._tableTree.toggleRow(id);
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
  rowActionsHeight: Signal<number>;
  scrollToTop: () => void;
}
