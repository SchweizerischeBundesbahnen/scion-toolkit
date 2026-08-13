/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, inject, Injector, input, NgZone, output, Provider, signal, Signal, untracked, viewChild, viewChildren, ViewEncapsulation} from '@angular/core';
import {SciTable} from './table.model';
import {ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {concat, fromEvent, map, of, switchMap, timer} from 'rxjs';
import {subscribeIn} from '@scion/toolkit/operators';
import {SciScrollbarComponent} from '@scion/components/viewport';
import {startWith} from 'rxjs/operators';
import {cssMinmax} from './common';
import {dimension} from '@scion/components/dimension';
import {TableSelectionService} from './table-selection.service';
import {contributeMenu} from '@scion/components/menu';
import {ColumnHeaderComponent} from './column-header/column-header.component';
import {TableRowComponent} from './table-row/table-row.component';
import {TableKeyboardNavigatorDirective} from './keyboard-navigator.directive';
import {TableOverlayComponent} from './table-overlay/table-overlay.component';
import {SciTextPipe} from '@scion/components/text';
import {SciSpinnerThrobberComponent} from '../../throbber/src/spinner-throbber/spinner-throbber.component';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[style.--ɵsci-table-columns]': 'columnWidths()',
    '[style.--ɵsci-table-scrolling]': 'scrolling() ? `true` : null',
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
    TableOverlayComponent,

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
  private readonly _viewportClient = viewChild.required<ElementRef<HTMLElement>>('viewport_client');
  private readonly _header = viewChild<ElementRef<HTMLElement>>('header');
  private readonly _headers = viewChildren(ColumnHeaderComponent);
  private readonly _itemSizeElement = viewChild.required<ElementRef<HTMLElement>>('itemSizeElement');
  protected readonly rows = viewChildren(TableRowComponent);

  private readonly _zone = inject(NgZone);
  private readonly _injector = inject(Injector);
  private readonly _headerHeight = computed(() => this.headerDimension()?.offsetHeight ?? 0);

  // TODO change properties to private if not used in the template or host binding
  protected readonly viewportDimension = dimension(this._viewport);
  protected readonly viewportClientDimension = dimension(this._viewportClient);
  protected readonly itemSizeDimension = dimension(this._itemSizeElement);

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T>);
  protected readonly itemSize = computed(() => this.itemSizeDimension().clientHeight);

  protected readonly rowActionToolbarName = computed(() => `toolbar:${this.sciTable().instanceId}` as const);

  protected readonly scrolling = this.computeScrolling(this._viewport);
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

    return headers.reduce((map, header, i) => {
      return map.set(columns[i]!.name, header.boundingClientRect().width);
    }, new Map<`column:${string}`, number>());
  });

  protected readonly hasHorizontalOverflow = computed(() => {
    const viewportWidth = this.viewportDimension().clientWidth;
    const viewportClientWidth = this.viewportClientDimension().offsetWidth;
    return viewportWidth > viewportClientWidth;
  });

  /**
   * A grid will never grow beyond its parent unless explicitly set, that is why we need to set the table width.
   * This allows the grid to overflow when resizing.
   */
  protected readonly tableWidth = computed(() => {
    const hasHorizontalOverflow = this.hasHorizontalOverflow();
    const hasFullFractionColumn = this.sciTable().columns().some(column => column.isFraction && !column.userWidth && !column.maxWidth);

    // Only allow full width table when at least one column takes the remaining space.
    return !hasHorizontalOverflow && hasFullFractionColumn ? '100%' : `${this.viewportClientDimension().offsetWidth}px`;
  });

  private readonly _scrollTop = signal(0);

  constructor() {
    this.setupToolbar();
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
   * The row id is taken from the table model and used to create the row-actions toolbar.
   * The toolbar creation needs to be in an effect because the {@link SciTable} model is passed as an input to this component.
   */
  private setupToolbar(): void {
    effect(onCleanup => {
      const id = this.rowActionToolbarName();
      const menu = untracked(() => contributeMenu(id, toolbar => {
        const row = this.sciTable().hoveredRow();
        if (row?.item) {
          this.sciTable().rowActions?.(row.item, toolbar);
        }
      }, {injector: this._injector}));

      onCleanup(() => menu.dispose());
    });
  }

  /**
   * Sets the visible row count based on the internal table model.
   * The count is calculated based on container and item size.
   */
  private installDimensionWatcher(): void {
    effect(() => {
      const viewportDimension = this.viewportDimension();
      const itemSize = this.itemSizeDimension().offsetHeight;
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
   * Updates the range of currently visible rows on scroll.
   */
  private installScrollListener(): void {
    effect(onCleanup => {
      const viewport = this._viewport().nativeElement;

      untracked(() => {
        const subscription = fromEvent(viewport, 'scroll', {passive: true}).pipe(
          startWith(null),
          subscribeIn(fn => this._zone.runOutsideAngular(fn)),
        ).subscribe(() => {
          this._scrollTop.set(viewport.scrollTop);
          this.sciTable().setHoveredIndex(undefined);
        });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  private installActiveItemWatcher(): void {
    effect(() => {
      const activeIndex = this.sciTable().activeIndex();

      if (activeIndex < 0) {
        return;
      }

      untracked(() => this.scrollFocusedRowIntoViewport(activeIndex));
    });
  }

  /**
   * Computes whether currently scrolling the viewport.
   */
  private computeScrolling(viewport: Signal<ElementRef<HTMLElement>>): Signal<boolean> {
    const zone = inject(NgZone);

    return toSignal(toObservable(viewport)
      .pipe(
        switchMap(viewport => fromEvent(viewport.nativeElement, 'scroll', {passive: true}).pipe(subscribeIn(fn => zone.runOutsideAngular(fn)))),
        switchMap(() => concat(of(true), timer(150).pipe(map(() => false)))),
      ), {initialValue: false});
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
          .map(column => column.userWidth ? `${column.userWidth}px` : (hasResizedColumns || !column.isFraction ? column.width : cssMinmax({min: column.minWidth, max: column.maxWidth ?? column.width})))
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

  private scrollFocusedRowIntoViewport(focusedIndex: number): void {
    const viewport = this._viewport().nativeElement;
    const itemSize = this.itemSizeDimension().offsetHeight;
    if (!itemSize) {
      return;
    }

    const focusedRowTop = focusedIndex * itemSize;
    const focusedRowBottom = focusedRowTop + itemSize;
    const viewportHeight = viewport.clientHeight;
    const scrollTop = viewport.scrollTop;
    const viewportBottom = scrollTop + viewportHeight;

    if (focusedRowTop < scrollTop) {
      viewport.scrollTop = focusedRowTop;
    }
    else if (focusedRowBottom > viewportBottom) {
      viewport.scrollTop = focusedRowBottom - viewportHeight;
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
