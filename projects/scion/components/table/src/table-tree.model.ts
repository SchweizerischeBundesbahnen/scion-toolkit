import {computed, DestroyableInjector, effect, inject, Injector, ResourceRef, runInInjectionContext, signal, Signal, untracked, WritableSignal} from '@angular/core';
import {SciTableColumnFilter, SciTableDatasourceQuery, SciTableSortCriterion, SciTreeTableDatasource, SciTreeTableNode} from './table-datasource';
import {catchError, Observable, of} from 'rxjs';
import {Arrays, Observables} from '@scion/toolkit/util';
import {rxResource} from '@angular/core/rxjs-interop';
import {ɵcreateDestroyableInjector, ɵSingleActiveInjectorFactory} from '@scion/components/common';
import {MaybeArray} from '@scion/toolkit/types';
import {map} from 'rxjs/operators';
import {mapArray} from '@scion/toolkit/operators';
import {SciTableCellLike, SciTableColumnLike} from './table.model';
import {coerceTableRowBindings, SciTableRowBindingFactoryFn, SciTableRowBindings} from './table-row-binding';
import {SciTableItemLoader} from './table-item-loader';

/**
 * Loads and builds the table's hierarchy using item IDs and parent relationships, without loading full items.
 * Only operates on IDs, never full objects and regardless of the viewport / virtual scrolling state.
 * For non-hierarchical datasources, treats each item as a root node and preserves the order from the unfiltered response.
 *
 * Uses two independent requests:
 *  - An unfiltered request loads all nodes initially and whenever the sort criteria change.
 *  - A filtered request loads matching nodes when a filter is present and whenever the filters change.
 *
 * Combines both responses to include matching nodes and their parents and children, preserving the order from the unfiltered response.
 * When no filter is present, uses the unfiltered response directly.
 *
 * @example
 * ```ts
 * const unfilteredNodes = [
 *   {item: 'Downloads'},
 *   {item: 'Desktop'},
 *   {item: 'New Folder', parent: 'Desktop'},
 *   {item: 'notes.txt', parent: 'New Folder'},
 * ];
 *
 * // Filtered by 'notes'
 * const filteredNodes = [{item: 'notes.txt', parent: 'New Folder'}];
 *
 * // Result includes the matching node and its ancestors.
 * const tree = [
 *   {item: 'Desktop'},
 *   {item: 'New Folder', parent: 'Desktop'},
 *   {item: 'notes.txt', parent: 'New Folder'},
 * ];
 * ```
 */

export class ɵSciTableTree<T, ID> implements SciTableTree<T, ID> {

  private readonly _rootRows = signal(new Array<SciTreeTableRow<T, ID>>());
  private readonly _rowById = signal(new Map<ID, SciTreeTableRow<T, ID>>());
  private readonly _rowList = signal(new Array<SciTreeTableRow<T, ID>>());
  private readonly _itemLoader: SciTableItemLoader<T, ID>;

  private readonly _indexById = computed(() => this.rows().reduce((map, row, index) => map.set(row.id, index), new Map<ID, number>()));
  private readonly _expandedRowIds = signal(new Set<ID>());
  private readonly _hoveredRowId = signal<ID | undefined>(undefined);
  private readonly _requiresLevel = signal(false);
  private readonly _injector: DestroyableInjector;

  private readonly _nodesResource: ResourceRef<SciTreeTableNode<ID>[]>;
  private readonly _filteredNodesResource: ResourceRef<Set<ID> | null>;

  public readonly rows = computed(() => this._rowList().filter(row => row.visible()));
  public readonly activeRow = computed(() => this.activeRowId() !== undefined ? this._rowById().get(this.activeRowId()!) : undefined);
  public readonly selectedRowIds = signal(new Set<ID>());
  public readonly activeRowId = signal<ID | undefined>(undefined);
  public readonly isLoading = computed(() => this._nodesResource.isLoading() || this._filteredNodesResource.isLoading() || this._itemLoader.isLoading());
  // TODO [ask Etienne] Is it correct to also include items error? I mean, if loading an item failed, should we display nothing?
  public readonly isError = computed(() => this._nodesResource.status() === 'error' || this._filteredNodesResource.status() === 'error' || this._itemLoader.isError());

  constructor(private options: TableTreeOptions<T, ID>) {
    this._injector = ɵcreateDestroyableInjector({parent: options.injector ?? inject(Injector)});
    this._nodesResource = this.computeNodes(options.datasource, {sortCriteria: options.sortCriteria, injector: options.injector});
    this._filteredNodesResource = this.computeFilteredNodes(options.datasource, {columnFilters: options.columnFilters, tableFilter: options.tableFilter, injector: options.injector});
    this._itemLoader = new SciTableItemLoader(options.datasource, {trackBy: options.trackBy, injector: this._injector});

    this.computeRowsOnTreeChange();
    this.expandRowsOnFilter();
  }

  public computeRowsOnTreeChange(): void {
    effect(() => {
      console.log('>>> COMPUTE TREE');
      if (this._nodesResource.status() === 'error') {
        return;
      }

      const nodes = this._nodesResource.value();

      untracked(() => {
        // Clear state.
        const newTree = {
          rootRows: new Array<SciTreeTableRow<T, ID>>(),
          rowById: new Map<ID, SciTreeTableRow<T, ID>>(),
          rowList: new Array<SciTreeTableRow<T, ID>>(),
          requiresLevel: false,
        };

        // Materialize tree.
        console.time('materialize tree');
        for (const node of nodes) {
          const parentRow: SciTreeTableRow<T, ID> | undefined = node.parentId !== undefined ? newTree.rowById.get(node.parentId) ?? this.createTreeTableRow(node.parentId) : undefined;
          const row: SciTreeTableRow<T, ID> = newTree.rowById.get(node.id) ?? this.createTreeTableRow(node.id);
          newTree.rowById.set(row.id, row);

          if (parentRow) {
            parentRow.children.push(row);
            row.parent = parentRow;
            newTree.rowById.set(parentRow.id, parentRow);
            newTree.requiresLevel = true;
          }
          else {
            newTree.rootRows.push(row);
          }
        }
        console.timeEnd('materialize tree');

        // Compute flat row list.
        console.time('flat list');
        for (const rootRow of newTree.rootRows) {
          rootRow.visitChildren(row => newTree.rowList.push(row), {includeSelf: true});
        }
        console.timeEnd('flat list');

        // Update state.
        console.time('state');
        this._rootRows.set(newTree.rootRows);
        this._rowById.set(newTree.rowById);
        this._rowList.set(newTree.rowList);
        this._requiresLevel.set(newTree.requiresLevel);

        this.selectedRowIds.update(previousRowIds => new Set([...previousRowIds].filter(previousRowId => newTree.rowById.has(previousRowId))));
        this.activeRowId.update(previousRowId => previousRowId !== undefined && newTree.rowById.has(previousRowId) ? previousRowId : undefined);
        this._expandedRowIds.update(previousRowIds => new Set([...previousRowIds].filter(previousRowId => newTree.rowById.has(previousRowId))));
        this._hoveredRowId.update(previousRowId => previousRowId !== undefined && newTree.rowById.has(previousRowId) ? previousRowId : undefined);
        // TODO [dwie/etienne] Clenaup items in loader?
        // this._itemById.update(previousItems => new Map([...previousItems.entries()].filter(([id]) => newTree.rowById.has(id))));
        console.timeEnd('state');
      });
    }, {injector: this.options.injector});
  }

  private createTreeTableRow(id: ID): SciTreeTableRow<T, ID> {
    const rowInjectorFactory = new ɵSingleActiveInjectorFactory({parent: this._injector});
    const row: SciTreeTableRow<T, ID> = {
      id,
      index: () => this._indexById().get(id)!,
      children: [],
      visible: () => {
        if (row.parent && !row.parent.visible()) {
          return false;
        }
        if (row.parent && !row.parent.expanded()) {
          return false;
        }
        if (!row.matchesFilter()) {
          return false;
        }
        return true;
      },
      level: () => {
        if (!this._requiresLevel()) {
          return undefined;
        }
        return row.parent ? row.parent.level()! + 1 : 0;
      },
      expanded: () => this._expandedRowIds().has(id),
      selected: () => this.selectedRowIds().has(id),
      active: () => this.activeRowId() === id,
      hovered: () => this._hoveredRowId() === id,
      matchesFilter: computed(() => {
        const filtered = this._filteredNodesResource.error() ? null : this._filteredNodesResource.value();
        return !filtered || filtered.has(id) || row.getPathFromRoot().some(row => filtered.has(row.id)) || row.children.some(child => child.matchesFilter());
      }),
      getPathFromRoot: () => (row.parent?.getPathFromRoot() ?? []).concat(row),
      visitParents: (visitor, options) => {
        if (options?.includeSelf) {
          visitor(row);
        }
        row.parent?.visitParents(visitor, {includeSelf: true});
      },
      visitChildren: (visitor, options) => {
        if (options?.includeSelf) {
          visitor(row);
        }
        row.children.forEach(child => child.visitChildren(visitor, {includeSelf: true}));
      },
      // expand: (expand: boolean) => treeNode.state.update(state => ({...state, expand})),
      expand: (expand: boolean) => {
        this._expandedRowIds.update(rowIds => {
          const copy = new Set(rowIds);
          expand ? copy.add(id) : copy.delete(id);
          return copy;
        });
      },
      bindings: () => tableRow()?.bindings,
      cells: () => tableRow()?.cells,
      item: () => tableRow()?.item,
      loading: () => !tableRow(),
    };

    const itemRef = this._itemLoader.getItem(id);
    const tableRow = computed(() => {
      const item = itemRef();
      const columns = this.options.columns();

      return untracked(() => item && {
        item,
        bindings: coerceTableRowBindings(this.options.rowBindings, item, computed(() => row.index())),
        cells: runInInjectionContext(rowInjectorFactory.create(), () => columns.map(column => ({
          value: 'value' in column ? column.value(item) : undefined,
          component: column.type === 'component' ? column.component(item) : undefined,
          template: column.type === 'template' ? column.template(item) : undefined,
          type: column.type,
          column,
        } as SciTableCellLike))),
      });
    });

    return row;
  }

  private computeNodes(datasource: SciTreeTableDatasource<unknown, ID>, options: {sortCriteria: Signal<SciTableSortCriterion[]>; injector?: Injector}): ResourceRef<SciTreeTableNode<ID>[]> {
    // Create separate injection context per resource invocation to clean up allocated resources.
    const injectorFactory = new ɵSingleActiveInjectorFactory();

    return rxResource({
      params: () => options.sortCriteria(),
      stream: ({params: sortCriteria}) => {
        console.log('>>> FETCH getTreeNodes$ (Standleitung)', sortCriteria);
        return this.getTreeNodes$(datasource, {sortCriteria}, {injector: injectorFactory.create()});
      },
      defaultValue: [],
      injector: options.injector,
    });
  }

  private computeFilteredNodes(datasource: SciTreeTableDatasource<unknown, ID>, options: {columnFilters: Signal<SciTableColumnFilter[]>; tableFilter: Signal<string | null>; injector?: Injector}): ResourceRef<Set<ID> | null> {
    // Create separate injection context per resource invocation to clean up allocated resources.
    const injectorFactory = new ɵSingleActiveInjectorFactory();

    return rxResource({
      params: () => ({
        columnFilters: options.columnFilters(),
        tableFilter: options.tableFilter() ?? undefined,
      }),
      stream: ({params}) => {
        const injector = injectorFactory.create();
        if (params.columnFilters.length === 0 && params.tableFilter === undefined) {
          return of(null);
        }
        return this.getTreeNodes$(datasource, {columnFilters: params.columnFilters, tableFilter: params.tableFilter}, {injector}).pipe(mapArray(node => node.id), map(nodes => new Set(nodes)));
      },
      defaultValue: null,
      injector: options.injector,
    });
  }

  private getTreeNodes$(datasource: SciTreeTableDatasource<unknown, ID>, query: Partial<SciTableDatasourceQuery>, options: {injector: Injector}): Observable<SciTreeTableNode<ID>[]> {
    return runInInjectionContext(options.injector, () => Observables.coerce(datasource.getTreeTableNodes({
      columnFilters: query.columnFilters ?? [],
      sortCriteria: query.sortCriteria ?? [],
      tableFilter: query.tableFilter,
    })).pipe(catchError(error => {
      console.error(error);
      throw error;
    })));
  }

  public loadItems(ids: ID[]): {cancel: () => void} {
    return this._itemLoader.loadItems(ids);
  }

  public reload(): void {
    this._nodesResource.reload();
    this._itemLoader.clear();
  }

  public reloadFailed(): void {
    if (this._nodesResource.status() === 'error') {
      this._nodesResource.reload();
    }
    if (this._filteredNodesResource.status() === 'error') {
      this._filteredNodesResource.reload();
    }
    this._itemLoader.reloadFailed();
  }

  public expand(id: MaybeArray<ID>): void {
    const rowById = untracked(() => this._rowById());
    Arrays.coerce(id).forEach(id => rowById.get(id)?.expand(true));
  }

  public expandAll(): void {
    untracked(() => this._expandedRowIds.set(new Set(this._rowById().keys())));
  }

  public collapse(id: MaybeArray<ID>): void {
    const rowById = untracked(() => this._rowById());
    Arrays.coerce(id).forEach(id => rowById.get(id)?.expand(false));
  }

  public collapseAll(): void {
    untracked(() => this._expandedRowIds.set(new Set()));
  }

  public toggleExpand(id: ID): void {
    const row = untracked(() => this._rowById()).get(id);
    if (row) {
      row.expand(untracked(() => !row.expanded()));
    }
  }

  public setActiveRow(id: ID | undefined): void {
    this.activeRowId.set(id);
  }

  public setHoveredRow(id: ID | undefined): void {
    this._hoveredRowId.set(id);
  }

  // previously selectNodes
  public setSelectedRows(ids: MaybeArray<ID>): void {
    const rowById = untracked(() => this._rowById());

    // Prevent selecting nodes which do not exist.
    // TODO [ask team] brauch wir den check here? Haben wir bei den anderen Methoden auch nicht, z.b. setHoveredRow
    const rowIds = Arrays.coerce(ids).filter(id => rowById.has(id));

    // Expand all nodes before the selected ones.
    // nodeIds.forEach(id => nodes.get(id)?.getPathFromRoot().forEach(node => node.expanded.set(true)));
    rowIds.forEach(id => rowById.get(id)?.visitParents(row => row.expand(true)));

    // TODO [ask team] Why should the viewport height change?
    // Wait for viewport height to update after expanding nodes.
    // Else scrollActiveRowIntoViewport operates on an old viewport height.
    requestAnimationFrame(() => {
      this.selectedRowIds.set(new Set(rowIds));

      // Find and activate last item based on the visual index.
      const lastItemIndex = Math.max(...rowIds.map(id => this._indexById().get(id) ?? -1));
      const lastRowId = this.rows()[lastItemIndex]?.id;
      this.activeRowId.set(lastRowId);
    });
  }

  public updateSelectedRows(updateFn: (ids: Set<ID>) => Set<ID>): void {
    this.selectedRowIds.update(updateFn);
  }

  private expandRowsOnFilter(): void {
    effect(() => {
      if (this._filteredNodesResource.status() === 'error') {
        return;
      }

      // Expand all nodes on filter
      if (this._filteredNodesResource.value() !== null) {
        untracked(() => this._expandedRowIds.set(new Set(this._rowById().keys())));
      }
    }, {injector: this._injector});
  }

  public dispose(): void {
    this._injector.destroy();
    this._itemLoader.clear();

    this._rootRows.set([]);
    this._rowById.set(new Map());
    this._rowList.set([]);

    this.selectedRowIds.set(new Set());
    this.activeRowId.set(undefined);
    this._expandedRowIds.set(new Set());
    this._hoveredRowId.set(undefined);
  }
}

export interface TableTreeOptions<T, ID> {
  sortCriteria: Signal<SciTableSortCriterion[]>;
  columnFilters: Signal<SciTableColumnFilter[]>;
  tableFilter: Signal<string | null>;
  columns: Signal<SciTableColumnLike<T>[]>;
  trackBy: (item: T) => ID;
  rowBindings: SciTableRowBindingFactoryFn<T>[];
  datasource: SciTreeTableDatasource<T, ID>;
  injector?: Injector;
}

export interface SciTableTree<T, ID> {
  rows: Signal<SciTreeTableRow<T, ID>[]>;
  activeRow: Signal<SciTreeTableRow<T, ID> | undefined>;
  selectedRowIds: WritableSignal<Set<ID>>;
  activeRowId: WritableSignal<ID | undefined>;
  isLoading: Signal<boolean>;
  isError: Signal<boolean>;

  reload(): void;

  reloadFailed(): void;

  expand(id: MaybeArray<ID>): void;

  expandAll(): void;

  collapse(id: MaybeArray<ID>): void;

  collapseAll(): void;

  toggleExpand(id: ID): void;

  setActiveRow(id: ID | undefined): void;

  setHoveredRow(id: ID | undefined): void;

  // previously selectNodes
  setSelectedRows: (ids: MaybeArray<ID>) => void;

  updateSelectedRows(updateFn: (ids: Set<ID>) => Set<ID>): void;

  loadItems(ids: ID[]): {cancel: () => void};

  dispose(): void;
}

export interface SciTreeTableRow<T, ID> {
  id: ID;
  // This function is reactive.
  index: () => number;
  parent?: SciTreeTableRow<T, ID>;
  getPathFromRoot: () => SciTreeTableRow<T, ID>[];
  visitParents: (visitor: (row: SciTreeTableRow<T, ID>) => void, options?: {includeSelf?: true}) => void;
  visitChildren: (visitor: (row: SciTreeTableRow<T, ID>) => void, options?: {includeSelf?: true}) => void;
  children: SciTreeTableRow<T, ID>[];
  // This function is reactive.
  visible: () => boolean;
  // This function is reactive.
  level: () => number | undefined;
  // This function is reactive.
  expanded: () => boolean;
  // This function is reactive.
  selected: () => boolean;
  // This function is reactive.
  active: () => boolean;
  // This function is reactive.
  hovered: () => boolean;
  matchesFilter: Signal<boolean>;
  // This function is reactive.
  bindings: () => SciTableRowBindings | undefined;
  // This function is reactive.
  cells: () => SciTableCellLike[] | undefined;
  // This function is reactive.
  item: () => T | undefined;
  expand: (expand: boolean) => void;
  // This function is reactive.
  loading: () => boolean;
}
