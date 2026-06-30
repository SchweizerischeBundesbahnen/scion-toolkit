/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, InjectionToken, linkedSignal, signal, Signal} from '@angular/core';
import {SciDataSource, SciFilterCriterion, SciSortCriterion, SciTableRequest, SciTableResponse} from './table-data-source';
import {ColumnType, SciCellContext, SciCells, SciColumns, SciRow, SciTable} from './table.model';
import {ɵSciTableFactory} from './ɵtable.factory';
import {ɵSciArrayDataSource} from './ɵarray-data-source';
import {coercePromise, coerceSignal} from './common';
import {SciTableStorage} from './table-storage';
import {SciColumnDescriptors} from './table.factory';
import {UUID} from '@scion/toolkit/uuid';

interface StoredTable {
  columnWidths: {columnName: string; width: number}[];
}

export const ɵSCI_TABLE = new InjectionToken<Signal<ɵSciTable<unknown>>>('ɵSciTable');

export class ɵSciTable<T, ID = T> implements SciTable<T, ID> {

  public readonly columns: SciColumns<T>[];
  public readonly dataSource: SciDataSource<T, ID>;
  public readonly tableStorage: SciTableStorage;
  public readonly itemSize: number;
  public readonly overscan: number;
  public readonly name?: string;

  public readonly sortable: boolean;
  public readonly filterable: boolean;
  public readonly resizable: boolean;
  public readonly selectable: boolean;
  public readonly headerVisible: boolean;

  public readonly rowPart?: (item: T) => string | null;

  private readonly _sortCriteria = signal<SciSortCriterion[]>([]);
  private readonly _filterCriteria = signal<SciFilterCriterion[]>([]);
  private readonly _columnWidths = signal(new Map<string, number>());
  private readonly _selectedItems = signal<Set<ID>>(new Set());
  private readonly _totalCount = signal(0);

  public readonly criteria = computed(() => ({sort: this.sortCriteria(), filter: this.filterCriteria()}));

  private readonly _rows = linkedSignal({
    source: () => ({count: this._totalCount()}),
    computation: ({count}) => new Array<SciRow<T, ID>>(count).fill({}),
  });
  private readonly _activeItem = linkedSignal({
    source: this.criteria,
    computation: () => undefined as ID | undefined,
  });

  public readonly sortCriteria = this._sortCriteria.asReadonly();
  public readonly filterCriteria = this._filterCriteria.asReadonly();
  public readonly columnWidths = this._columnWidths.asReadonly();
  public readonly activeItem = this._activeItem.asReadonly();
  public readonly selectedItems = this._selectedItems.asReadonly();
  public readonly totalCount = this._totalCount.asReadonly();
  public readonly rows = this._rows.asReadonly();

  constructor(factory: ɵSciTableFactory<T>, dataOrSource: T[] | SciDataSource<T, ID>) {
    this.name = factory.tableName;
    this.tableStorage = factory.tableStorage;
    this.sortable = factory.sortable;
    this.filterable = factory.filterable;
    this.resizable = factory.resizable;
    this.selectable = factory.selectable;
    this.itemSize = factory.rowItemSize;
    this.overscan = factory.overscanAmount;
    this.headerVisible = factory.headerVisible;
    this.rowPart = factory.rowPartFn;

    this.columns = factory.columns
      .map((column, index) => this.initColumn(column.type, index, column));

    this.dataSource = Array.isArray(dataOrSource) ?
      new ɵSciArrayDataSource(dataOrSource, this.columns) as unknown as SciDataSource<T, ID> :
      dataOrSource;

    void this.initColumnWidths();
  }

  public setTotalCount(totalCount: number): void {
    this._totalCount.set(totalCount);
  }

  public async loadPage({page, sortCriteria, filterCriteria}: Pick<SciTableRequest, 'page' | 'sortCriteria' | 'filterCriteria'>): Promise<SciTableResponse<T>> {
    const pageSize = this.dataSource.pageSize;
    return coercePromise(this.dataSource.loader({
      start: page * pageSize,
      end: page * pageSize + pageSize,
      pageSize: pageSize,
      page,
      sortCriteria,
      filterCriteria,
    }));
  }

  public updateRows({items, totalCount, page}: SciTableResponse<T> & {page: number}): void {
    this._totalCount.set(totalCount);
    this._rows.update(rows => {
      const start = page * this.dataSource.pageSize;
      return rows.slice(0, start).concat(this.mapItemsToRow(items), rows.slice(start + this.dataSource.pageSize));
    });
  }

  public sort(columnName: string, multi: boolean): void {
    if (!this.sortable) {
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
    if (!this.filterable) {
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
    this._columnWidths.update(columns => new Map(columns).set(columnName, width));

    const columnWidths = [...this.columnWidths().entries()]
      .filter(([columnName]) => this.columns.find(c => c.name === columnName)?.named)
      .map(([columnName, width]) => ({width, columnName}));

    if (!this.name || columnWidths.length === 0) {
      return;
    }

    void this.tableStorage.store(this.storageKey, JSON.stringify({columnWidths}));
  }

  public updateActiveItem(updateFn: (id: ID | undefined) => ID | undefined): void {
    this._activeItem.update(updateFn);
  }

  public setActiveItem(id: ID | undefined): void {
    this._activeItem.set(id);
  }

  public updateSelectedItems(updateFn: (ids: Set<ID>) => Set<ID>): void {
    this._selectedItems.update(updateFn);
  }

  private initColumn(type: ColumnType, index: number, config: SciColumnDescriptors<T>): SciColumns<T> {
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
      index,
      name: config.name ?? UUID.randomUUID(),
      named: !!config.name,
      filter: typeof config.filter === 'function' ? config.filter : defaultFilter,
      sort: typeof config.sort === 'function' ? config.sort : defaultSort,
      sortable: sortable && this.sortable,
      filterable: filterable && this.filterable,
      resizable: (config.resizable ?? true) && this.resizable,
      header: coerceSignal(config.header, {defaultValue: ''}),
      width: coerceSignal(config.width, {defaultValue: 'min-content'}),
      minWidth: coerceSignal(config.minWidth, {defaultValue: '100px'}),
      maxWidth: coerceSignal(config.maxWidth, {defaultValue: null}),
    } as SciColumns<T>;
  }

  private get storageKey(): string {
    return `sci-table-${this.name}`;
  }

  private mapItemsToRow(items: T[]): SciRow<T, ID>[] {
    return items.map(item => ({
      item: item,
      id: this.dataSource.identity(item),
      cells: this.columns.map(column => ({
        value: column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item)) : undefined,
        component: column.type === 'component' ? column.component(item) : undefined,
        template: column.type === 'template' ? coerceSignal(column.template(item)) : undefined,
        type: column.type,
        columnName: column.name,
        part: column.part?.(item) ?? null,
      } as SciCells)),
    }));
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
