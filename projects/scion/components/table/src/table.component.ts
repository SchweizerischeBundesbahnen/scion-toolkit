/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, output, Signal, signal, viewChild, viewChildren} from '@angular/core';
import {SciColumns, SciRow, SciTable} from './table.model';
import {ɵSciTableFactory} from './ɵtable.factory';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {SciScrollableDirective, SciScrollbarComponent} from '@scion/components/viewport';
import {TableRowComponent} from './table-row/table-row.component';
import {SciDataSource, SciFilterCriterion, SciSortCriterion} from './data-source.model';
import {toObservable} from '@angular/core/rxjs-interop';
import {combineLatestWith, map, startWith, switchMap} from 'rxjs/operators';
import {rangeInSet} from './common';
import {EMPTY} from 'rxjs';
import {MapGetPipe} from './map-get.pipe';
import {ColumnHeaderComponent} from './column-header/column-header.component';
import {TableStateService} from './table-state.service';
import {ColumnFilterComponent} from './column-filter/column-filter.component';
import {SciTableFactory} from './table.factory';
import {ɵSciTable} from './ɵtable.model';

export function table<T>(dataSource: SciDataSource<T>, factoryFn: (table: SciTableFactory<T>) => void): Signal<SciTable<T>>;
export function table<T>(data: Signal<T[]>, factoryFn: (table: SciTableFactory<T>) => void): Signal<SciTable<T>>;
export function table<T>(dataOrSource: Signal<T[]> | SciDataSource<T>, factoryFn: (table: SciTableFactory<T>) => void): Signal<SciTable<T>> {
  return computed(() => {
    const factory = new ɵSciTableFactory<T>();
    factoryFn(factory);
    return new ɵSciTable(factory, dataOrSource);
  });
}

function clamp(min: string, preferred: string, max: string | null): string {
  const maxDef = max === null ? preferred : `min(${preferred}, ${max})`;
  return `minmax(${min}, ${maxDef})`;
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
    '[style.--ɵsci-table-width]': 'tableWidth()',
  },
  imports: [
    SciScrollableDirective,
    SciScrollbarComponent,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    TableRowComponent,
    MapGetPipe,
    ColumnHeaderComponent,
    ColumnFilterComponent,
  ],
  providers: [
    TableStateService,
  ],
})
export class SciTableComponent<T> {

  public readonly table = input.required<SciTable<T>>();

  public readonly activateItem = output<T | undefined>();
  public readonly selectItems = output<T[]>();

  protected readonly rows = viewChildren<TableRowComponent<T>>(TableRowComponent);
  private readonly _viewport = viewChild.required(CdkVirtualScrollViewport);

  private readonly _tableStateService = inject(TableStateService);

  protected readonly activeItem = signal<T | undefined>(undefined);
  protected readonly selectedItems = signal<T[]>([]);
  protected readonly sort = signal<SciSortCriterion[]>([]);
  protected readonly filter = signal<SciFilterCriterion[]>([]);

  private readonly _totalCount = signal<number>(0, {equal: (a, b) => a === b});

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T>);
  protected readonly columns = computed(() => this.sciTable().columns);

  protected readonly placeholderItems = linkedSignal(() => new Array<T>(this._totalCount()).fill({} as T));
  protected readonly cachedItems = linkedSignal({
    source: () => ({sort: this.sort(), filter: this.filter(), columns: this.columns()}),
    computation: () => new Map<number, SciRow<T>>(),
  });

  protected readonly tableWidth = computed(() => {
    const columns = this.columns();
    const overrides = this._tableStateService.columnWidths();

    const widths = columns
      .map(c => overrides.get(c.name) ?? c.minWidth())
      .join(' + ');

    return `max(100%, calc(${widths}))`;
  });
  protected readonly columnWidths = computed(() => {
    const columns = this.columns();
    const overrides = this._tableStateService.columnWidths();
    return columns
      .map(c => clamp(c.minWidth(), overrides.get(c.name) ?? c.width(), c.maxWidth()))
      .join(' ');
  });

  constructor() {
    effect(() => {
      this.activateItem.emit(this.activeItem());
    });

    effect(() => {
      this.selectItems.emit(this.selectedItems());
    });

    toObservable(this._viewport).pipe(
      switchMap(viewport => viewport.renderedRangeStream),
      startWith({start: 0, end: 0}),
      combineLatestWith(
        toObservable(this.sciTable),
        toObservable(this.sort),
        toObservable(this.filter),
      ),
      switchMap(([{start, end}, table, sortCriteria, filterCriteria]) => {
        // If all indices are already cached, don't call the backend
        // Never use cache if end === 0 (used for initial call and when no items are found)
        if (end !== 0 && rangeInSet(start, end, new Set(this.cachedItems().keys()))) {
          return EMPTY;
        }

        const response = table.getRows({
          start,
          end,
          limit: end - start,
          sortCriteria,
          filterCriteria,
        });

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

  protected trackBy(i: number, item: T): any {
    return this.sciTable().trackBy(item, i);
  }

  protected onSort(col: SciColumns<T>, event: MouseEvent): void {
    if (!this.sciTable().sortable || !col.sortable()) {
      return;
    }

    this.sort.update(sort => {
      const isMulti = event.ctrlKey || event.metaKey;
      const existing = sort.find(s => s.columnName === col.name);
      let nextDirection = 'asc' as 'asc' | 'desc' | undefined;
      if (existing) {
        nextDirection = existing.direction === 'asc' ? 'desc' : undefined;
      }

      const otherSorts = sort.filter(s => s.columnName !== col.name);
      if (!nextDirection) {
        return isMulti ? otherSorts : [];
      }

      const newSort = {columnName: col.name, direction: nextDirection};
      return isMulti ? [...otherSorts, newSort] : [newSort];
    });
  }

  protected onFilter(column: SciColumns<T>, text: string | boolean | number | null): void {
    this.filter.update(filter => {
      const other = filter.filter(f => f.columnName !== column.name);
      if (text === null) {
        return other;
      }

      return [
        ...other,
        {columnName: column.name, text},
      ];
    });
  }

  protected onSelectRow(row: T, {ctrlKey}: {ctrlKey: boolean}): void {
    this.selectRow(row, !ctrlKey);
  }

  protected onActivateRow(item: T): void {
    this.selectRow(item, true);
  }

  private selectRow(item: T, replace: boolean): void {
    this.activeItem.set(item);

    if (!this.sciTable().selectable) {
      return;
    }

    this.selectedItems.update(selection => {
      const existing = selection.indexOf(item);
      if (existing >= 0) {
        // Deselect row, if it was already selected.
        return selection.toSpliced(existing, 1);
      }

      if (replace) {
        return [item];
      }

      return [...selection, item];
    });
  }

  protected onResizeAuto(column: SciColumns<T>): void {
    const cellWidths = this.rows().map(row => row.getCellWidth(column.name));
    const maxWidth = Math.max(...cellWidths, 0) + 20; // TODO [eg]: configurable buffer?
    this._tableStateService.setResizedColumn(column.name, `${maxWidth}px`);
  }
}
