/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, forwardRef, inject, input, linkedSignal, NgZone, output, signal, untracked, viewChild, viewChildren} from '@angular/core';
import {SciColumns, SciRow, SciTable} from './table.model';
import {ColumnHeaderComponent} from './column-header/column-header.component';
import {ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {fromBoundingClientRect$} from '@scion/toolkit/observable';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {TableRowComponent} from './table-row/table-row.component';
import {combineLatestWith, filter, fromEvent, switchMap} from 'rxjs';
import {subscribeIn} from '@scion/toolkit/operators';
import {SciScrollableDirective, SciScrollbarComponent} from '@scion/components/viewport';
import {map, startWith} from 'rxjs/operators';
import {clamp} from './common';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--ɵsci-table-virtual-scroll-height]': 'height()',
    '[style.--ɵsci-table-header-height]': '`${headerHeight()}px`',
    '[style.--ɵsci-table-columns]': 'columnWidths()',
    '[style.--ɵsci-table-item-size]': '`${sciTable().itemSize}px`',
    '[style.--ɵsci-table-width]': 'tableWidth()',
  },
  imports: [
    ColumnHeaderComponent,
    TableRowComponent,
    SciScrollbarComponent,
    SciScrollableDirective,
  ],
  providers: [
    {
      provide: ɵSCI_TABLE,
      useFactory: <T>(component: SciTableComponent<T>) => computed(() => component.table() as ɵSciTable<T>),
      deps: [forwardRef(() => SciTableComponent)],
    },
  ],
})
export class SciTableComponent<T> {

  public readonly table = input.required<SciTable<T>>();

  public readonly activateItem = output<T | undefined>();
  public readonly selectItems = output<T[]>();

  private readonly _viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly _header = viewChild<ElementRef<HTMLElement>>('header');
  private readonly _rows = viewChildren(TableRowComponent);
  private readonly _headers = viewChildren(ColumnHeaderComponent);

  private readonly _zone = inject(NgZone);
  private readonly _element = inject(ElementRef);

  protected readonly activeItem = signal<T | undefined>(undefined);
  protected readonly selectedItems = signal<T[]>([]);
  protected readonly range = signal<{start: number; end: number}>({start: 0, end: 0});
  private readonly _totalCount = signal(0);
  protected readonly rows = linkedSignal({
    source: () => ({count: this._totalCount(), sort: this.table().sortCriteria(), filter: this.table().filterCriteria()}), // reset rows as soon as count, filter or sort change
    computation: ({count}) => new Array<SciRow<T>>(count).fill({} as SciRow<T>),
  });

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T>);

  protected readonly visibleRows = computed(() => {
    const {start, end} = this.range();
    return this.rows().slice(start, end);
  });

  protected readonly headerHeight = toSignal(toObservable(this._header).pipe(
    filter(element => !!element),
    switchMap(({nativeElement}) => fromBoundingClientRect$(nativeElement)),
    map(({height}) => height),
    takeUntilDestroyed(),
  ));
  private readonly _containerHeight = toSignal(fromBoundingClientRect$(this._element.nativeElement as HTMLElement).pipe(
    map(({height}) => height),
    takeUntilDestroyed(),
  ));

  private readonly _count = computed(() => {
    const containerHeight = this._containerHeight();
    const itemSize = this.sciTable().itemSize;
    const overscan = this.sciTable().overscan;

    if (containerHeight === undefined) {
      return 0;
    }

    return Math.ceil(containerHeight / itemSize) + overscan * 2;
  });
  protected readonly height = computed(() => `${this._totalCount() * this.sciTable().itemSize}px`);
  protected readonly columnWidths = computed(() => {
    const columns = this.sciTable().columns;
    const overrides = this.sciTable().columnWidths();

    return columns
      .map(c => clamp(c.minWidth(), overrides.has(c.name) ? `${overrides.get(c.name)}px` : c.width(), c.maxWidth()))
      .join(' ');
  });
  protected readonly tableWidth = computed(() => {
    const columns = this.sciTable().columns;
    const overrides = this.sciTable().columnWidths();
    const headers = this._headers();

    return untracked(() => {
      const width = columns
        .reduce((sum, c) => {
          // Since c.width(), can contain non-px values, if there is no override width defined, get the actual width in px from the header
          const columnWidth = overrides.has(c.name) ?
            overrides.get(c.name)! :
            headers.find(h => h.column().name === c.name)?.getWidth() ?? 0;

          return sum + columnWidth;
        }, 0);

      return `max(100%, ${Math.floor(width)}px)`;
    });
  });

  constructor() {
    effect(() => {
      this.activateItem.emit(this.activeItem());
    });

    effect(() => {
      this.selectItems.emit(this.selectedItems());
    });

    this.installDataFetcher();
    this.installScrollListener();
  }

  public getMaxRowWidth(columnName: string): number {
    const cellWidths = this._rows().map(row => row.getCellWidth(columnName));
    return Math.max(...cellWidths, 0);
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

  protected onResize(column: SciColumns<T>, width: number): void {
    this.sciTable().setResizedColumn(column.name, width);
  }

  protected onResizeAuto(column: SciColumns<T>): void {
    const maxWidth = this.getMaxRowWidth(column.name);
    this.sciTable().setResizedColumn(column.name, maxWidth);
  }

  private installDataFetcher(): void {
    effect(onCleanup => {
      const table = this.sciTable();
      const sortCriteria = table.sortCriteria();
      const filterCriteria = table.filterCriteria();
      const {start, end} = this.range();

      untracked(() => {
        const subscription = table.getRows({
          start,
          end,
          limit: end - start,
          sortCriteria,
          filterCriteria,
        }).subscribe(response => {
          this._totalCount.set(response.totalCount);
          this.rows.update(items => items.toSpliced(start, response.items.length, ...response.items));
        });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  private installScrollListener(): void {
    const count$ = toObservable(this._count);
    const overscan$ = toObservable(computed(() => this.sciTable().overscan));
    const itemSize$ = toObservable(computed(() => this.sciTable().itemSize));

    effect(onCleanup => {
      const element = this._viewport()?.nativeElement;
      const height = this._containerHeight(); // wait for height to be calculated

      if (!element || height === undefined) {
        return;
      }

      untracked(() => {
        const subscription = fromEvent(element, 'scroll', {passive: true}).pipe(
          startWith(null),
          combineLatestWith(overscan$, count$, itemSize$),
          subscribeIn(fn => this._zone.runOutsideAngular(fn)),
        ).subscribe(([_, overscan, count, itemSize]) => {
          const firstVisible = Math.floor(element.scrollTop / itemSize);
          const start = Math.max(0, firstVisible - overscan);
          this.range.set({start, end: start + count});
        });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }
}
