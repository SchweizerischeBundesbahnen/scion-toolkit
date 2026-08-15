/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, input, NgZone, output, Provider, Signal, untracked, viewChild, viewChildren, ViewEncapsulation} from '@angular/core';
import {SciTable} from './table.model';
import {ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {concat, fromEvent, map, of, switchMap, timer} from 'rxjs';
import {subscribeIn} from '@scion/toolkit/operators';
import {SciScrollbarComponent} from '@scion/components/viewport';
import {startWith} from 'rxjs/operators';
import {cssMinmax} from './common';
import {dimension} from '@scion/components/dimension';
import {TableSelectionService} from './table-selection.service';
import {ColumnHeaderComponent} from './column-header/column-header.component';
import {TableRowComponent} from './table-row/table-row.component';
import {TableKeyboardNavigatorDirective} from './keyboard-navigator.directive';
import {ColumnSplittersComponent} from './column-splitters/column-splitters.component';
import {SciTextPipe} from '@scion/components/text';
import {SciSpinnerThrobberComponent} from '../../throbber/src/spinner-throbber/spinner-throbber.component';
import {SciTableGridComponent} from './table-grid.component';
import {SciTableBodyComponent} from './table-body.component';
import {SciTableHeaderComponent} from './table-header.component';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[style.--ɵsci-table-columns]': 'columnWidths()',
    '[style.--ɵsci-table-scrolling]': 'sciTable().scrolling() ? `true` : null',
    '[style.--ɵsci-table-resizing]': 'resizing() ? `true` : null',
    '[style.--ɵsci-table-width]': 'tableWidth()',
    '[style.--ɵsci-table-virtual-scroll-offset-top]': '`${virtualScrollOffsetTop()}px`',
    '[style.--ɵsci-table-virtual-scroll-offset-bottom]': '`${virtualScrollOffsetBottom()}px`',
    // Header visible cannot be computed inside CSS with :has because Firefox currently has a bug which does not allow :has on a ShadowRoot.
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1979910
    '[style.--ɵsci-table-header-visible]': 'headerVisible() ? `true` : null',
  },
  imports: [
    SciScrollbarComponent,
    ColumnHeaderComponent,
    TableKeyboardNavigatorDirective,
    TableRowComponent,
    SciTextPipe,
    SciSpinnerThrobberComponent,
    ColumnSplittersComponent,
    SciTableGridComponent,
    SciTableBodyComponent,
    SciTableHeaderComponent,

  ],
  providers: [
    provideSciTable(),
    TableSelectionService,
  ],
})
export class SciTableComponent<T> {

  public readonly table = input.required<SciTable<T>>();

  public readonly primaryAction = output<T>();

  private readonly _viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly _viewportClient = viewChild.required(SciTableGridComponent, {read: ElementRef});
  private readonly _header = viewChild(SciTableHeaderComponent, {read: ElementRef});
  private readonly _tableBody = viewChild(SciTableBodyComponent, {read: ElementRef});
  private readonly _headers = viewChildren(ColumnHeaderComponent);
  private readonly _itemSizeElement = viewChild.required<ElementRef<HTMLElement>>('itemSizeElement');
  protected readonly rows = viewChildren(TableRowComponent);

  private readonly _headerHeight = computed(() => this.headerDimension()?.offsetHeight ?? 0);

  private readonly _viewportDimension = dimension(this._viewport);
  private readonly _viewportClientDimension = dimension(this._viewportClient);
  private readonly _itemSizeDimension = dimension(this._itemSizeElement);
  private readonly _tableBodyDimension = dimension(this._tableBody);

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T>);
  protected readonly itemSize = computed(() => this._itemSizeDimension().clientHeight);
  protected readonly headerVisible = computed(() => this.sciTable().filterable() || this.sciTable().headerVisible());

  protected readonly resizing = computed(() => !!this.sciTable().resizingState());
  protected readonly columnWidths = this.computeColumnWidths();
  protected readonly headerDimension = dimension(this._header);

  protected readonly virtualScrollOffsetTop = computed(() => {
    return (this.sciTable().range()?.start ?? 0) * this.itemSize();
  });

  protected readonly virtualScrollOffsetBottom = computed(() => {
    const rangeEnd = Math.min(this.sciTable().range()?.end ?? 0, this.sciTable().totalCount() ?? 0);
    const totalCount = this.sciTable().totalCount() ?? 0;
    return (totalCount - rangeEnd) * this.itemSize();
  });

  protected readonly absoluteColumnWidths = computed(() => {
    const headers = this._headers();
    const columns = this.sciTable().columns();

    // While loading the table definition from storage, the columns are empty.
    // Calculating the widths only makes sense, when the column definitions are ready.
    if (!columns.length) {
      return new Map<`column:${string}`, number>();
    }

    return headers.reduce((map, header, i) => map.set(columns[i]!.name, header.boundingClientRect().width), new Map<`column:${string}`, number>());
  });

  protected readonly hasHorizontalOverflow = computed(() => {
    const viewportWidth = this._viewportDimension().clientWidth;
    const viewportClientWidth = this._viewportClientDimension().offsetWidth;
    return viewportClientWidth > viewportWidth;
  });

  /**
   * An element will never grow beyond its parent unless explicitly set, that is why we need to set the table width.
   * This allows the grid to overflow when resizing.
   */
  protected readonly tableWidth = computed(() => {
    const viewportWidth = this._viewportDimension().clientWidth;
    // ViewportClient cannot be used, because it does not grow with its children.
    const tableBodyWidth = this._tableBodyDimension()?.offsetWidth ?? 0;
    const hasFullFractionColumn = this.sciTable().columns().some(column => column.isFraction && !column.userWidth && !column.maxWidth);

    // Only allow full width table when at least one column takes the remaining space.
    return tableBodyWidth < viewportWidth && hasFullFractionColumn ? '100%' : `${tableBodyWidth}px`;
  });

  private readonly _scrollTop = this.computeScrollTop();

  constructor() {
    this.installActiveItemWatcher();
    this.installDimensionWatcher();
    this.installCriteriaListener();
    this.installScrollListener();
  }

  protected onOverlayScrollBy(deltaY: number): void {
    this._viewport().nativeElement.scrollBy({top: deltaY});
  }

  protected onRowPrimaryAction(item?: T): void {
    if (item) {
      this.primaryAction.emit(item);
    }
  }

  protected onHeaderMouseWheel(event: WheelEvent): void {
    event.preventDefault(); // TODO document: prevent scrolling on header; viewport contains sticky header, but should not be scrollable
  }

  /**
   * Scrolls viewport to the top, as soon as either filter or sort criteria change
   */
  private installCriteriaListener(): void {
    effect(() => {
      this.sciTable().criteria(); // track criteria

      // as soon as the table criteria change (and on init), scroll to the top.
      this._viewport().nativeElement.scrollTo({top: 0});
    });
  }

  /**
   * Sets the visible row count based on the internal table model.
   * The count is calculated based on container and item size.
   */
  private installDimensionWatcher(): void {
    effect(() => {
      const viewportDimension = this._viewportDimension();
      const itemSize = this._itemSizeDimension().offsetHeight;
      const overscan = this.sciTable().bufferSize();
      const scrollTop = this._scrollTop() - this._headerHeight();
      if (itemSize) {
        const visibleRowCount = Math.ceil((viewportDimension.clientHeight - this._headerHeight()) / itemSize) + overscan * 2;
        const firstVisible = Math.floor(scrollTop / itemSize);
        const start = Math.max(0, firstVisible - overscan);
        const end = start + visibleRowCount;
        this.sciTable().range.update(range => {
          // Only update range signal if there is an actual change.
          if (start === range?.start && end === range.end) {
            return range;
          }
          return {start, end};
        });
      }
    });
  }

  /**
   * Tracks {@link HTMLElement.scrollTop} of the viewport.
   */
  private computeScrollTop(): Signal<number> {
    const zone = inject(NgZone);

    return toSignal(toObservable(this._viewport)
      .pipe(
        switchMap(viewport => fromEvent(viewport.nativeElement, 'scroll', {passive: true})
          .pipe(
            startWith(undefined),
            subscribeIn(fn => zone.runOutsideAngular(fn)),
            map(() => viewport.nativeElement.scrollTop),
          ),
        ),
      ), {initialValue: 0});
  }

  private installActiveItemWatcher(): void {
    effect(() => {
      const activeIndex = this.sciTable().activeIndex();

      if (activeIndex < 0) {
        return;
      }

      untracked(() => this.scrollActiveRowIntoViewport(activeIndex));
    });
  }

  /**
   * Tracks whether currently scrolling the viewport.
   */
  private installScrollListener(): void {
    const zone = inject(NgZone);

    toObservable(this._viewport)
      .pipe(
        switchMap(viewport => fromEvent(viewport.nativeElement, 'scroll', {passive: true}).pipe(subscribeIn(fn => zone.runOutsideAngular(fn)))),
        switchMap(() => concat(of(true), timer(150).pipe(map(() => false)))),
        takeUntilDestroyed(),
      )
      .subscribe(scrolling => {
        this.sciTable().scrolling.set(scrolling);
      });
  }

  private computeColumnWidths(): Signal<string> {
    return computed(() => {
      const columns = this.sciTable().columns();
      const resizingState = this.sciTable().resizingState();
      const hasHorizontalOverflow = this.hasHorizontalOverflow();
      const hasResizedColumns = columns.some(column => column.userWidth !== undefined);

      if (!resizingState) {
        // Return the user's width (userWidth) if the column was resized.
        // Else if there is one other resized column or the column is a fixed width (non-fraction) use the column width.
        // Else use the min/max grid definition (only for initial layouting).
        // Otherwise, unchanged fraction columns can change in size after resizing a column.
        return columns
          .map(column => {
            if (column.userWidth) {
              return `${column.userWidth}px`;
            }

            return hasResizedColumns || !column.isFraction ? column.width : cssMinmax({min: column.minWidth, max: column.maxWidth ?? column.width});
          })
          .join(' ');
      }

      const {temporaryColumnWidths, initialColumnWidths, hadOverflow} = resizingState;
      return columns
        .map(column => {
          if (temporaryColumnWidths.get(column.name)!.endsWith('fr')) {
            if (hasHorizontalOverflow) {
              // Fix fraction columns, if the table was and still is overflowing.
              // If the table went from no overflow, to overflow, fraction columns should all be at minWidth.
              return hadOverflow ? `${initialColumnWidths.get(column.name)!}px` : `${column.minWidth}px`;
            }
            // If the table does not overflow, use the actual column definition.
            return cssMinmax({min: column.minWidth, max: column.maxWidth ?? temporaryColumnWidths.get(column.name)!});
          }
          return temporaryColumnWidths.get(column.name)!;
        })
        .join(' ');
    });
  }

  private scrollActiveRowIntoViewport(activeRowIndex: number): void {
    const viewport = this._viewport().nativeElement;
    const itemSize = this._itemSizeDimension().offsetHeight;
    if (!itemSize) {
      return;
    }

    const activeRowTop = activeRowIndex * itemSize;
    const activeRowBottom = activeRowTop + itemSize;
    const viewportHeight = viewport.clientHeight - this._headerHeight();
    const viewportClientTop = viewport.scrollTop;
    const viewportClientBottom = viewportClientTop + viewportHeight;

    if (activeRowTop < viewportClientTop) {
      viewport.scrollTop = activeRowTop;
    }
    else if (activeRowBottom > viewportClientBottom) {
      viewport.scrollTop = activeRowBottom - viewportHeight;
    }
  }
}

function provideSciTable(): Provider {
  return {
    provide: ɵSCI_TABLE,
    useFactory: () => {
      const component = inject(SciTableComponent);
      return computed(() => component.table() as ɵSciTable<unknown>);
    },
  };
}
