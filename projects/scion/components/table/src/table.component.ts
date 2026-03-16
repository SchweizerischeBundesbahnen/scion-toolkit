/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, inject, input, linkedSignal, output, signal, untracked, viewChild, viewChildren, ViewEncapsulation} from '@angular/core';
import {SciColumns, SciRow, SciTable} from './table.model';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {SciScrollableDirective, SciScrollbarComponent} from '@scion/components/viewport';
import {TableRowComponent} from './table-row/table-row.component';
import {SciFilterCriterion, SciSortCriterion} from './table-data-source';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {combineLatestWith, map, startWith, switchMap} from 'rxjs/operators';
import {clamp} from './common';
import {ColumnHeaderComponent} from './column-header/column-header.component';
import {TableStateService} from './table-state.service';
import {ɵSciTable} from './ɵtable.model';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[style.--ɵsci-table-columns]': 'columnWidths()',
    '[style.--ɵsci-table-width]': 'tableWidth()',
    '[style.--ɵsci-table-scroll-offset]': 'scrollOffset()',
    '[style.--ɵsci-table-item-size]': 'itemSize()',
  },
  imports: [
    SciScrollableDirective,
    SciScrollbarComponent,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    TableRowComponent,
    ColumnHeaderComponent,
  ],
  providers: [
    TableStateService,
  ],
})
export class SciTableComponent<T> {

  public readonly table = input.required<SciTable<T>>();

  public readonly activateItem = output<T | undefined>();
  public readonly selectItems = output<T[]>();

  private readonly _rows = viewChildren<TableRowComponent<T>>(TableRowComponent);
  private readonly _headers = viewChildren<ColumnHeaderComponent<T>>(ColumnHeaderComponent);
  private readonly _viewport = viewChild.required(CdkVirtualScrollViewport);

  private readonly _range$ = toObservable(this._viewport).pipe(
    switchMap(viewport => viewport.renderedRangeStream),
    startWith({start: 0, end: 0}),
  );

  private readonly _tableStateService = inject(TableStateService);

  protected readonly activeItem = signal<T | undefined>(undefined);
  protected readonly selectedItems = signal<T[]>([]);
  protected readonly sort = signal<SciSortCriterion[]>([]);
  protected readonly filter = signal<SciFilterCriterion[]>([]);
  protected readonly offset = toSignal(this._range$.pipe(map(({start}) => start)));

  private readonly _totalCount = signal<number>(0, {equal: (a, b) => a === b});

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T>);
  protected readonly columns = computed(() => this.sciTable().columns);

  protected readonly rows = linkedSignal({
    source: () => ({count: this._totalCount()}),
    computation: ({count}) => new Array<SciRow<T>>(count).fill({} as SciRow<T>),
  });

  protected readonly itemSize = computed(() => `${this.sciTable().itemSize}px`);
  protected readonly scrollOffset = computed(() => `${(this.offset() ?? 0) * this.sciTable().itemSize * -1}px`); // scroll offset to position the header correctly
  protected readonly tableWidth = computed(() => {
    const columns = this.columns();
    const overrides = this._tableStateService.columnWidths();
    const headers = this._headers();

    return untracked(() => {
      const width = columns
        .reduce((sum, c) => sum + (overrides.get(c.name) ?? headers.find(h => h.column().name === c.name)?.getWidth() ?? 0), 0);

      // sum all column widths together, should always be at least 100% of the container width
      return `max(100%, ${width}px)`;
    });
  });
  protected readonly columnWidths = computed(() => {
    const columns = this.columns();
    const overrides = this._tableStateService.columnWidths();

    return columns
      .map(c => clamp(c.minWidth(), overrides.has(c.name) ? `${overrides.get(c.name)}px` : c.width(), c.maxWidth()))
      .join(' ');
  });

  constructor() {
    effect(() => {
      this.activateItem.emit(this.activeItem());
    });

    effect(() => {
      this.selectItems.emit(this.selectedItems());
    });

    effect(() => {
      const headers = this._headers().map(header => ({
        column: header.column(),
        width: header.getWidth(),
      }));
      this._tableStateService.init(this.table().name, headers);
    });

    this._range$.pipe(
      combineLatestWith(
        toObservable(this.sciTable),
        toObservable(computed(() => this.sciTable().sortCriteria())),
        toObservable(computed(() => this.sciTable().filterCriteria())),
      ),
      switchMap(([{start, end}, table, sortCriteria, filterCriteria]) => table.getRows({
        start,
        end,
        limit: end - start,
        sortCriteria,
        filterCriteria,
      }).pipe(map(r => ({response: r, start})))),
    ).subscribe(({response, start}) => {
      this._totalCount.set(response.totalCount);
      this.rows.update(items => items.toSpliced(start, response.items.length, ...response.items));
    });
  }

  protected readonly trackBy = (i: number, row: SciRow<T>): unknown => {
    return this.sciTable().trackBy(row.item, i);
  };

  protected onSort(column: SciColumns<T>, event: MouseEvent): void {
    this.sciTable().sort(column.name, event.ctrlKey || event.metaKey);
  }

  protected onFilter(column: SciColumns<T>, text: string | boolean | number | null): void {
    this.sciTable().filter(column.name, text);
  }

  protected onSelectRow(row: T, {ctrlKey}: {ctrlKey: boolean}): void {
    this.selectRow(row, !ctrlKey);
  }

  protected onActivateRow(item: T): void {
    this.selectRow(item, true);
  }

  private selectRow(item: T, replace: boolean): void {
    this.activeItem.set(item);

    if (!this.sciTable().selectable()) {
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
    const cellWidths = this._rows().map(row => row.getCellWidth(column.name));
    const maxWidth = Math.max(...cellWidths, 0) + 20; // TODO [eg]: configurable buffer?
    this._tableStateService.setResizedColumn(column.name, maxWidth);
  }
}
