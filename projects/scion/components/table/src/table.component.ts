/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, forwardRef, inject, input, linkedSignal, NgZone, output, resource, signal, untracked, viewChild, viewChildren, ViewEncapsulation} from '@angular/core';
import {SciColumns, SciTable} from './table.model';
import {ColumnHeaderComponent} from './column-header/column-header.component';
import {ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {toObservable} from '@angular/core/rxjs-interop';
import {TableRowComponent} from './table-row/table-row.component';
import {combineLatestWith, fromEvent} from 'rxjs';
import {subscribeIn} from '@scion/toolkit/operators';
import {SciScrollableDirective, SciScrollbarComponent} from '@scion/components/viewport';
import {startWith} from 'rxjs/operators';
import {clamp, rangeInclusive} from './common';
import {TableSelectionService} from './table-selection.service';
import {dimension} from '@scion/components/dimension';
import {TableKeyboardNavigatorDirective} from './keyboard-navigator.directive';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
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
    TableKeyboardNavigatorDirective,
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

  public readonly table = input.required<SciTable<T, ID>>();

  public readonly activateItem = output<ID | undefined>();
  public readonly selectItems = output<Set<ID>>();

  private readonly _viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly _header = viewChild<ElementRef<HTMLElement>>('header');
  private readonly _rows = viewChildren(TableRowComponent);
  private readonly _headers = viewChildren(ColumnHeaderComponent);

  private readonly _zone = inject(NgZone);
  private readonly _element = inject(ElementRef);

  protected readonly headerDimension = dimension(this._header);
  private readonly _containerDimension = dimension(this._element.nativeElement as HTMLElement);

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T, ID>);

  protected readonly range = signal<{start: number; end: number}>({start: 0, end: 0});

  /**
   * Count of currently visible rows
   */
  private readonly _count = computed(() => {
    const containerDimension = this._containerDimension();
    const itemSize = this.sciTable().itemSize;
    const overscan = this.sciTable().overscan;

    return Math.ceil(containerDimension.clientHeight / itemSize) + overscan * 2;
  });

  protected readonly visibleRows = computed(() => {
    const {start, end} = this.range();
    return this.sciTable().rows().slice(start, end);
  });

  private readonly _loadedPages = linkedSignal({
    source: () => this.sciTable().criteria(),
    computation: () => new Set<number>(),
  });

  private readonly _pages = computed(() => {
    const table = this.sciTable();
    const {start, end} = this.range();
    const loadedPages = this._loadedPages();

    return untracked(() => {
      const pageSize = table.dataSource.pageSize;
      const startPage = Math.floor(start / pageSize);
      const endPage = Math.floor(end / pageSize);
      return rangeInclusive(startPage, endPage).filter(page => !loadedPages.has(page));
    });
  }, {equal: (prev, curr) => prev.length === curr.length && prev.every(p => curr.includes(p))});

  protected readonly dataResource = resource({
    params: () => ({
      sortCriteria: this.sciTable().sortCriteria(),
      filterCriteria: this.sciTable().filterCriteria(),
      table: this.sciTable(),
      pages: this._pages(),
    }),
    loader: ({params}) => Promise.all(
      params.pages.map(page => params.table.loadPage({page, sortCriteria: params.sortCriteria, filterCriteria: params.filterCriteria})
        .then(response => ({...response, page})),
      ),
    ),
  });

  protected readonly height = computed(() => `${this.sciTable().totalCount() * this.sciTable().itemSize}px`);
  protected readonly columnWidths = computed(() => {
    const columns = this.sciTable().columns;
    const overrides = this.sciTable().columnWidths();

    return columns
      .map(c => clamp(c.minWidth(), overrides.has(c.name) ? `${overrides.get(c.name)}px` : c.width(), c.maxWidth()))
      .join(' ');
  });

  /**
   * A grid will never grow beyond its parent unless explicitly set, that is why we need to set the table width.
   * This allows the grid overflowing when resizing.
   */
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

      // Somehow we have a horizontal overflow, if we don't subtract some px from the whole width
      return `calc(max(100%, ${Math.ceil(width)}px) - 8px)`;
    });
  });

  constructor() {
    effect(() => {
      const activeItem = this.sciTable().activeItem();
      this.activateItem.emit(activeItem);

      if (!activeItem) {
        return;
      }

      untracked(() => {
        this.scrollActiveRowIntoViewport(activeItem);
      });
    });

    effect(() => {
      this.selectItems.emit(this.sciTable().selectedItems());
    });

    effect(() => {
      const table = this.sciTable();
      const viewport = this._viewport();
      const count = this._count();

      table.criteria(); // track sort criteria

      // as soon as the table criteria change (and on init), scroll to the top, and set initial count to show skeletons
      viewport?.nativeElement.scrollTo({top: 0});
      table.setTotalCount(count);
    });

    effect(() => {
      const table = this.sciTable();

      if (this.dataResource.status() !== 'resolved' && !this.dataResource.hasValue()) {
        return;
      }

      const responses = this.dataResource.value()!;

      // Update rows when page loading is finished
      for (const response of responses) {
        this._loadedPages.update(pages => new Set(pages).add(response.page));
        table.updateRows(response);
      }
    });

    this.installScrollListener();
  }

  protected onResizeAuto(column: SciColumns<T>): void {
    const cellWidths = this._rows().map(row => row.getCellWidth(column.name));
    const maxWidth = Math.max(...cellWidths, 0);
    this.sciTable().setResizedColumn(column.name, maxWidth);
  }

  /**
   * Updates the range of currently visible rows on scroll.
   */
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
          this.range.set({start, end: start + count});
        });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  private scrollActiveRowIntoViewport(activeItem: ID): void {
    const table = this.sciTable();
    const rows = table.rows();
    const viewport = this._viewport()?.nativeElement;
    const headerHeight = this.headerDimension()?.clientHeight;

    if (!viewport || headerHeight === undefined) {
      return;
    }

    const activeIndex = rows.findIndex(row => row.id === activeItem);
    const activeRowTop = activeIndex * table.itemSize;
    const activeRowBottom = activeRowTop + table.itemSize;
    const viewportHeight = viewport.clientHeight - headerHeight;
    const viewportTop = viewport.scrollTop;
    const viewportBottom = viewportTop + viewportHeight;

    if (activeRowTop < viewportTop) {
      viewport.scrollTop = activeRowTop;
    }
    else if (activeRowBottom > viewportBottom) {
      viewport.scrollTop = activeRowBottom - viewportHeight;
    }
  }
}
