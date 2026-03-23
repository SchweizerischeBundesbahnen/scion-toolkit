/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {InjectionToken, signal, Signal} from '@angular/core';
import {SciDataSource, SciFilterCriterion, SciSortCriterion, SciTableRequest, SciTableResponse} from './table-data-source';
import {SciCells, SciColumns, SciRow, SciTable} from './table.model';
import {ɵSciTableFactory} from './ɵtable.factory';
import {ɵSciArrayDataSource} from './ɵarray-data-source';
import {Observable} from 'rxjs';
import {coerceObservable, coerceSignal} from './common';
import {map} from 'rxjs/operators';
import {SciTableStorage} from './table-storage';

interface StoredTable {
  columnWidths: {columnName: string; width: number}[];
}

export const ɵSCI_TABLE = new InjectionToken<Signal<ɵSciTable<unknown>>>('ɵSciTable');

export class ɵSciTable<T> implements SciTable<T> {

  public readonly columns: SciColumns<T>[];
  public readonly dataSource: SciDataSource<T>;
  public readonly tableStorage: SciTableStorage;
  public readonly name?: string;

  public readonly sortable: Signal<boolean>;
  public readonly filterable: Signal<boolean>;
  public readonly resizable: Signal<boolean>;
  public readonly selectable: Signal<boolean>;
  public readonly headerVisible: Signal<boolean>;

  public readonly itemSize: number;
  public readonly overscan: number;
  public readonly trackBy: (item: T, index: number) => unknown;
  public readonly identity?: (item: T) => unknown;
  public readonly rowPart?: (item: T) => string;

  private readonly _sortCriteria = signal<SciSortCriterion[]>([]);
  private readonly _filterCriteria = signal<SciFilterCriterion[]>([]);
  private readonly _activeIndex = signal<number | undefined>(undefined);
  private readonly _selectedIndices = signal<number[]>([]);
  private readonly _columnWidths = signal(new Map<string, number>());
  private readonly _ready = signal(false);

  public readonly sortCriteria = this._sortCriteria.asReadonly();
  public readonly filterCriteria = this._filterCriteria.asReadonly();
  public readonly columnWidths = this._columnWidths.asReadonly();
  public readonly activeIndex = this._activeIndex.asReadonly();
  public readonly selectedIndices = this._selectedIndices.asReadonly();
  public readonly ready = this._ready.asReadonly();

  constructor(factory: ɵSciTableFactory<T>, dataOrSource: T[] | SciDataSource<T>) {
    this.columns = factory.columns;
    this.name = factory.tableName;
    this.tableStorage = factory.tableStorage;
    this.sortable = factory.isSortable;
    this.filterable = factory.isFilterable;
    this.resizable = factory.isResizable;
    this.selectable = factory.isSelectable;
    this.itemSize = factory.rowItemSize;
    this.overscan = factory.overscanAmount;
    this.headerVisible = factory.isHeaderVisible;
    this.trackBy = factory.trackByFn;
    this.identity = factory.identityFn;
    this.rowPart = factory.rowPartFn;

    this.dataSource = Array.isArray(dataOrSource) ?
      new ɵSciArrayDataSource(dataOrSource, factory.columns) :
      dataOrSource;

    void this.initColumnWidths().then(() => {
      this._ready.set(true);
    });
  }

  public getRows(request: SciTableRequest): Observable<SciTableResponse<SciRow<T>>> {
    return coerceObservable(this.dataSource.getItems(request)).pipe(
      map(res => ({totalCount: res.totalCount, items: this.mapItemsToRow(res.items)})),
    );
  }

  public sort(columnName: string, multi: boolean): void {
    if (!this.sortable()) {
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
    if (!this.filterable()) {
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

    void this.tableStorage.store(this.storageKey, JSON.stringify({columnWidths} as StoredTable));
  }

  public isSameItem(a: T | undefined, b: T | undefined): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    return this.identity ? this.identity(a) === this.identity(b) : false;
  }

  private get storageKey(): string {
    return `sci-table-${this.name}`;
  }

  private mapItemsToRow(items: T[]): SciRow<T>[] {
    return items.map(item => ({
      item: item,
      cells: this.columns.map(column => ({
        value: column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item)) : undefined,
        component: column.type === 'component' ? column.component(item) : undefined,
        template: column.type === 'template' ? coerceSignal(column.template(item)) : undefined,
        type: column.type,
        columnName: column.name,
        part: column.part?.(item),
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
