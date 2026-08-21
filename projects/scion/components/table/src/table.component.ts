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
import {SciScrollRange, ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {concat, fromEvent, map, mergeWith, of, switchMap, timer} from 'rxjs';
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
import {clamp, Objects} from '@scion/toolkit/util';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[style.--ɵsci-table-columns]': 'columnWidths()',
    '[style.--ɵsci-table-scrolling]': 'table().scrolling() ? `true` : null',
    '[style.--ɵsci-table-resizing]': 'resizing() ? `true` : null',
    '[style.--ɵsci-table-width]': 'tableWidth()',
    '[style.--ɵsci-table-virtual-scroll-offset-top]': '`${virtualScrollOffsetTop()}px`',
    '[style.--ɵsci-table-virtual-scroll-offset-bottom]': '`${virtualScrollOffsetBottom()}px`',
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

  public readonly table = input.required({transform: (table: SciTable<T>) => table as ɵSciTable<T>});

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

  protected readonly itemSize = computed(() => this._itemSizeDimension().clientHeight);

  protected readonly resizing = computed(() => !!this.table().resizingState());
  protected readonly columnWidths = this.computeColumnWidths();
  protected readonly headerDimension = dimension(this._header);

  protected readonly virtualScrollOffsetTop = computed(() => {
    return (this.table().scrollRange()?.start ?? 0) * this.itemSize();
  });

  protected readonly virtualScrollOffsetBottom = computed(() => {
    const rangeEnd = Math.min(this.table().scrollRange()?.end ?? 0, this.table().totalCount() ?? 0);
    const totalCount = this.table().totalCount() ?? 0;
    return (totalCount - rangeEnd) * this.itemSize();
  });

  protected readonly absoluteColumnWidths = computed(() => {
    // TODO [Etienne] Does only work if header columns -> use splitters instead
    const headers = this._headers();
    const columns = this.table().columns();

    // While loading the table definition from storage, the columns are empty.
    // Calculating the widths only makes sense, when the column definitions are ready.
    if (!columns.length) {
      return new Map<`column:${string}`, number>();
    }

    return columns.reduce((map, column, i) => map.set(column.name, headers[i]?.boundingClientRect().width ?? 0), new Map<`column:${string}`, number>());
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
    if (!this.table().columns().length) {
      return '100%';
    }

    const viewportWidth = this._viewportDimension().clientWidth;
    // ViewportClient cannot be used, because it does not grow with its children.
    const tableBodyWidth = this._tableBodyDimension()?.offsetWidth ?? 0;
    const hasFullFractionColumn = this.table().columns().some(column => column.isFraction && !column.userWidth && !column.maxWidth);

    // Only allow full width table when at least one column takes the remaining space.
    return tableBodyWidth < viewportWidth && hasFullFractionColumn ? '100%' : `${tableBodyWidth}px`;
  });

  private readonly _scrollTop = this.computeScrollTop();

  constructor() {
    this.installActiveItemWatcher();
    this.installScrollRangeTracker();
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
      this.table().criteria(); // track criteria

      // as soon as the table criteria change (and on init), scroll to the top.
      this._viewport().nativeElement.scrollTo({top: 0});
    });
  }

  private installScrollRangeTracker(): void {
    const scrollRange = this.computeScrollRange();
    effect(() => this.table().scrollRange.set(scrollRange()));
  }

  /**
   * Computes the visible row count based on the viewport size.
   */
  private computeScrollRange(): Signal<SciScrollRange> {
    return computed(() => {
      const viewportDimension = this._viewportDimension();
      const itemSize = this._itemSizeDimension().offsetHeight;
      const bufferSize = this.table().bufferSize();
      const scrollTop = this._scrollTop() - this._headerHeight();
      const visibleRowCount = Math.ceil((viewportDimension.clientHeight - this._headerHeight()) / itemSize) + bufferSize * 2;
      const firstVisible = Math.floor(scrollTop / itemSize);
      const totalCount = this.table().totalCount() ?? Number.MAX_SAFE_INTEGER; // max value if no data loaded yet
      const start = clamp(firstVisible - bufferSize, {min: 0, max: totalCount});
      const end = Math.min(start + visibleRowCount, totalCount);
      return {start, end};
    }, {equal: Objects.isEqual});
  }

  /**
   * Tracks {@link HTMLElement.scrollTop} of the viewport.
   */
  private computeScrollTop(): Signal<number> {
    const zone = inject(NgZone);
    const viewportDimension$ = toObservable(this._viewportDimension);
    const viewportClientDimension$ = toObservable(this._viewportClientDimension);

    return toSignal(toObservable(this._viewport)
      .pipe(
        switchMap(viewport => fromEvent(viewport.nativeElement, 'scroll', {passive: true})
          .pipe(
            mergeWith(viewportDimension$),
            mergeWith(viewportClientDimension$),
            startWith(undefined),
            subscribeIn(fn => zone.runOutsideAngular(fn)),
            map(() => viewport.nativeElement.scrollTop),
          ),
        ),
      ), {initialValue: 0});
  }

  private installActiveItemWatcher(): void {
    effect(() => {
      const activeIndex = this.table().activeIndex();

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
        this.table().scrolling.set(scrolling);
      });
  }

  private computeColumnWidths(): Signal<string> {
    return computed(() => {
      const columns = this.table().columns();
      const resizingState = this.table().resizingState();
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
