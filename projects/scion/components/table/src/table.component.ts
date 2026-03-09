/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, input, linkedSignal, output, Signal, signal, viewChild, viewChildren} from '@angular/core';
import {SciColumns, SciRow, SciTable} from './table.model';
import {ɵSciTable} from './ɵtable.model';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {SciScrollableDirective, SciScrollbarComponent} from '@scion/components/viewport';
import {TableRowComponent} from './table-row/table-row.component';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {SciArrayDataSource, SciDataSource} from './data-source.model';
import {toObservable} from '@angular/core/rxjs-interop';
import {combineLatestWith, map, startWith, switchMap} from 'rxjs/operators';
import {rangeInSet} from './common';
import {EMPTY} from 'rxjs';

export function table<T>(dataSource: SciDataSource<T>, factory: (table: SciTable<T>) => SciTable<T>): SciTable<T>;
export function table<T>(data: Signal<T[]>, factory: (table: SciTable<T>) => SciTable<T>): SciTable<T>;
export function table<T>(dataOrSource: Signal<T[]> | SciDataSource<T>, factory: (table: SciTable<T>) => SciTable<T>): SciTable<T> {
  if (typeof dataOrSource === 'function') {
    return factory(new ɵSciTable<T>(new SciArrayDataSource(dataOrSource)));
  }

  return factory(new ɵSciTable<T>(dataOrSource));
}

function clamp(min: string | null, preferred: string, max: string | null): string {
  const maxDef = max === null ? preferred : `min(${preferred}, ${max})`;
  return `minmax(${min ?? 0}, ${maxDef})`;
}

export interface RowSelection<T> {
  index: number;
  row: T;
}

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--ɵsci-table-columns]': 'columnWidths()',
  },
  imports: [
    SciScrollableDirective,
    SciScrollbarComponent,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    TableRowComponent,
    SciSplitterComponent,
  ],
})
export class SciTableComponent<T> {

  public readonly table = input.required<SciTable<T>>();

  public readonly activateRow = output<RowSelection<T> | undefined>();
  public readonly selectRows = output<RowSelection<T>[]>();

  private readonly viewport = viewChild.required(CdkVirtualScrollViewport);

  protected readonly rows = viewChildren<TableRowComponent<T>>(TableRowComponent);

  protected readonly activeRow = signal<RowSelection<T> | undefined>(undefined);
  protected readonly selectedRows = signal<RowSelection<T>[]>([]);
  protected readonly sort = signal<{columnName: string; direction: 'asc' | 'desc'}[]>([]);
  protected readonly filter = signal<{columnName: string; text: string}[]>([]);

  private readonly _totalCount = signal<number>(0, {equal: (a, b) => a === b});
  private readonly _resizeContext = signal<{width: number; columnId: string} | undefined>(undefined);
  private readonly _resizedColumnWidths = signal<Map<string, string>>(new Map());

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T>); // TODO [eg]: Is there a better way to not expose the private ɵSciTable?
  protected readonly columns = computed(() => this.sciTable().columns());
  protected readonly sortAndFilter = computed(() => ({sortCriteria: this.sort(), filterCriteria: this.filter()}));

  // Reset to the cache as soon as either the total count, sort or filter changes
  protected readonly placeholderItems = linkedSignal(() => new Array<SciRow<T>>(this._totalCount()).fill({item: {} as T, cells: []}));
  protected readonly cachedItems = linkedSignal({
    source: () => this.sortAndFilter(),
    computation: () => new Map<number, SciRow<T>>(),
  });

  protected readonly selectedRowIndices = computed(() => this.selectedRows().map(selection => selection.index));

  protected readonly columnWidths = computed(() => {
    const columns = this.columns();
    const overrides = this._resizedColumnWidths();
    return columns
      .map(c => clamp(c.minWidth(), overrides.get(c.name) ?? c.width(), c.maxWidth()))
      .join(' ');
  });

  constructor() {
    effect(() => {
      this.activateRow.emit(this.activeRow());
    });

    effect(() => {
      this.selectRows.emit(this.selectedRows());
    });

    toObservable(this.viewport).pipe(
      switchMap(viewport => viewport.renderedRangeStream),
      startWith({start: 0, end: 30}),
      combineLatestWith(
        toObservable(this.sciTable),
        toObservable(this.columns),
        toObservable(this.sortAndFilter),
      ),
      switchMap(([{start, end}, table, columns, {sortCriteria, filterCriteria}]) => {
        // If all indices are already cached, don't call the backend
        if (rangeInSet(start, end, new Set(this.cachedItems().keys()))) {
          return EMPTY;
        }

        const response = table.dataSource.getItems({
          start: start,
          end: end,
          limit: end - start,
          sortCriteria,
          filterCriteria,
        }, columns);

        return response.pipe(map(r => ({response: r, start})));
      }),
    ).subscribe(({response, start}) => {
      this._totalCount.set(response.totalCount);
      this.cachedItems.update(cache => {
        const newCache = new Map(cache);
        for (let i = 0; i < response.items.length; i++) {
          newCache.set(start + i, response.items[i]!);
        }
        return newCache;
      });
    });
  }

  protected trackBy(i: number, row: SciRow<T>): any {
    return this.sciTable().trackByFn(i, row.item);
  }

  protected onSort(col: SciColumns<T>): void {
    if (!this.sciTable().isSortable() || !col.sortable()) {
      return;
    }

    this.sort.update(([sort]) => {
      if (col.name !== sort?.columnName) {
        return [{columnName: col.name, direction: 'asc'}];
      }

      return [{columnName: col.name, direction: sort.direction === 'asc' ? 'desc' : 'asc'}];
    });
  }

  protected onSelectRow(row: T, index: number, {ctrlKey}: {ctrlKey: boolean}): void {
    this.selectRow(row, index, !ctrlKey);
  }

  protected onActivateRow(row: T, index: number): void {
    this.selectRow(row, index, true);
  }

  private selectRow(row: T, index: number, replace: boolean): void {
    const rowSelection = {row, index};
    this.activeRow.set(rowSelection);

    if (!this.sciTable().isSelectable()) {
      return;
    }

    this.selectedRows.update(selection => {
      const existing = selection.find(s => s.index === index);
      if (existing) {
        // Deselect row, if it was already selected.
        return selection.filter(s => s !== existing);
      }

      if (replace) {
        return [rowSelection];
      }

      return [...selection, rowSelection];
    });
  }

  protected onResizeStart(column: SciColumns<T>, header: HTMLDivElement): void {
    this._resizeContext.set({width: header.offsetWidth, columnId: column.name});
  }

  protected onResize(column: SciColumns<T>, event: SplitterMoveEvent): void {
    const context = this._resizeContext();
    if (!context) {
      return;
    }

    const width = Math.max(20, context.width + event.distance);
    this._resizeContext.set({columnId: column.name, width: width});
    this._resizedColumnWidths.update(widths => new Map(widths).set(column.name, `${width}px`));
  }

  protected onResizeEnd(): void {
    this._resizeContext.set(undefined);
  }

  protected onResizeAuto(column: SciColumns<T>): void {
    const cellWidths = this.rows().map(row => row.getCellWidth(column.name));
    const maxWidth = Math.max(...cellWidths, 0) + 20; // TODO [eg]: configurable buffer?
    this._resizedColumnWidths.update(overrides => new Map(overrides).set(column.name, `${maxWidth}px`));
  }
}
