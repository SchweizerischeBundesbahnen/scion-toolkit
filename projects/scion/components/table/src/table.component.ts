/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, forwardRef, inject, input, NgZone, output, untracked, viewChild, viewChildren} from '@angular/core';
import {SciColumns, SciTable} from './table.model';
import {ColumnHeaderComponent} from './column-header/column-header.component';
import {ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {toObservable} from '@angular/core/rxjs-interop';
import {TableRowComponent} from './table-row/table-row.component';
import {combineLatestWith, fromEvent} from 'rxjs';
import {subscribeIn} from '@scion/toolkit/operators';
import {SciScrollableDirective, SciScrollbarComponent} from '@scion/components/viewport';
import {startWith} from 'rxjs/operators';
import {clamp} from './common';
import {TableSelectionService} from './table-selection.service';
import {dimension} from '@scion/components/dimension';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--ɵsci-table-virtual-scroll-height]': 'height()',
    '[style.--ɵsci-table-header-height]': '`${headerDimension()?.clientHeight ?? 0}px`',
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
      useFactory: <T, ID>(component: SciTableComponent<T, ID>) => computed(() => component.table() as ɵSciTable<T, ID>),
      deps: [forwardRef(() => SciTableComponent)],
    },
    TableSelectionService,
  ],
})
export class SciTableComponent<T, ID = T> {

  public readonly table = input.required<SciTable<T>>();

  public readonly activateItem = output<ID | undefined>();
  public readonly selectItems = output<Set<ID>>();

  private readonly _viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly _header = viewChild<ElementRef<HTMLElement>>('header');
  private readonly _rows = viewChildren(TableRowComponent);
  private readonly _headers = viewChildren(ColumnHeaderComponent);

  private readonly _zone = inject(NgZone);
  private readonly _element = inject(ElementRef);

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T, ID>);
  protected readonly visibleRows = computed(() => {
    const {start, end} = this.sciTable().range();
    return this.sciTable().rows().slice(start, end);
  });

  protected readonly headerDimension = dimension(this._header);
  private readonly _containerDimension = dimension(this._element.nativeElement as HTMLElement);

  private readonly _count = computed(() => {
    const containerDimension = this._containerDimension();
    const itemSize = this.sciTable().itemSize;
    const overscan = this.sciTable().overscan;

    return Math.ceil(containerDimension.clientHeight / itemSize) + overscan * 2;
  });
  protected readonly height = computed(() => `${this.sciTable().totalCount() * this.sciTable().itemSize}px`);
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
      this.activateItem.emit(this.sciTable().activeItem());
    });

    effect(() => {
      this.selectItems.emit(this.sciTable().selectedItems());
    });

    this.installDataFetcher();
    this.installScrollListener();
  }

  public getMaxRowWidth(columnName: string): number {
    const cellWidths = this._rows().map(row => row.getCellWidth(columnName));
    return Math.max(...cellWidths, 0);
  }

  protected onResize(column: SciColumns<T>, width: number): void {
    this.sciTable().setResizedColumn(column.name, width);
  }

  protected onResizeAuto(column: SciColumns<T>): void {
    const maxWidth = this.getMaxRowWidth(column.name);
    this.sciTable().setResizedColumn(column.name, maxWidth);
  }

  /**
   * Fetches data from the data source as soon as the sort, filter or scroll changes
   * This has to be done here, since we can't set up an effect in the TableModel, because it's already created within a reactive context
   */
  private installDataFetcher(): void {
    effect(onCleanup => {
      const table = this.sciTable();
      const sortCriteria = table.sortCriteria();
      const filterCriteria = table.filterCriteria();
      const range = table.range();

      untracked(() => {
        const subscription = table.fetchData(sortCriteria, filterCriteria, range);
        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  private installScrollListener(): void {
    const count$ = toObservable(this._count);
    const table$ = toObservable(this.sciTable);

    effect(onCleanup => {
      const element = this._viewport()?.nativeElement;

      if (!element) {
        return;
      }

      untracked(() => {
        const subscription = fromEvent(element, 'scroll', {passive: true}).pipe(
          startWith(null),
          combineLatestWith(table$, count$),
          subscribeIn(fn => this._zone.runOutsideAngular(fn)),
        ).subscribe(([_, table, count]) => {
          const firstVisible = Math.floor(element.scrollTop / table.itemSize);
          const start = Math.max(0, firstVisible - table.overscan);
          this.sciTable().setRange(start, start + count);
        });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }
}
