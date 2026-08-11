/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, forwardRef, inject, Injector, input, NgZone, output, signal, Signal, untracked, viewChild, viewChildren, ViewEncapsulation} from '@angular/core';
import {SciTable} from './table.model';
import {ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {concat, EMPTY, fromEvent, map, of, switchMap, timer} from 'rxjs';
import {subscribeIn} from '@scion/toolkit/operators';
import {SciScrollableDirective, SciScrollbarComponent} from '@scion/components/viewport';
import {startWith} from 'rxjs/operators';
import {minmax} from './common';
import {dimension} from '@scion/components/dimension';
import {TableSelectionService} from './table-selection.service';
import {contributeMenu, SciToolbarComponent} from '@scion/components/menu';
import {ColumnHeaderComponent} from './column-header/column-header.component';
import {TableRowComponent} from './table-row/table-row.component';
import {TableKeyboardNavigatorDirective} from './keyboard-navigator.directive';
import {TABLE_OVERLAY_SELECTOR, TableOverlayComponent} from './table-overlay/table-overlay.component';
import {SciTextPipe} from '@scion/components/text';
import {SciSpinnerThrobberComponent} from '../../throbber/src/spinner-throbber/spinner-throbber.component';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[style.--ɵsci-table-height]': '`${containerDimension()?.clientHeight ?? 0}px`',
    '[style.--ɵsci-table-virtual-scroll-height]': 'virtualScrollHeight()',
    '[style.--ɵsci-table-columns]': 'columnWidths()',
    '[style.--ɵsci-table-scrolling]': 'scrolling() ? `true` : null',
    '[style.--ɵsci-table-resizing]': 'resizing() ? `true` : null',
    '[style.--ɵsci-table-toolbar-offset]': '`${rowActionToolbarOffset()}px`',
    '[style.--ɵsci-table-width]': 'tableWidth()',
  },
  imports: [
    SciScrollbarComponent,
    SciScrollableDirective,
    SciToolbarComponent,
    ColumnHeaderComponent,
    TableKeyboardNavigatorDirective,
    TableRowComponent,
    TableOverlayComponent,
    SciTextPipe,
    SciSpinnerThrobberComponent,
  ],
  providers: [
    {
      provide: ɵSCI_TABLE,
      useFactory: <T>(component: SciTableComponent<T>) => computed(() => component.table() as ɵSciTable<T>),
      deps: [forwardRef(() => SciTableComponent)],
    },
    TableSelectionService,
  ],
})
export class SciTableComponent<T> {

  public readonly table = input.required<SciTable<T>>();

  public readonly primaryAction = output<T>();

  private readonly _verticalViewport = viewChild.required<ElementRef<HTMLElement>>('verticalViewport');
  private readonly _header = viewChild<ElementRef<HTMLElement>>('header');
  private readonly _headers = viewChildren(ColumnHeaderComponent);
  private readonly _itemSizeElement = viewChild<ElementRef<HTMLElement>>('itemSizeElement');
  protected readonly rows = viewChildren(TableRowComponent);

  private readonly _zone = inject(NgZone);
  private readonly _element = inject(ElementRef);
  private readonly _injector = inject(Injector);

  protected readonly containerDimension = dimension(this._element.nativeElement as HTMLElement);
  protected readonly verticalViewportDimension = dimension(this._verticalViewport);
  protected readonly itemSizeDimension = dimension(this._itemSizeElement);

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T>);
  protected readonly headerHeight = computed(() => this.headerDimension()?.clientHeight ?? 0);
  protected readonly virtualScrollHeight = computed(() => `${(this.sciTable().totalCount() ?? 0) * (this.itemSize() ?? 0)}px`);
  protected readonly itemSize = computed(() => this.itemSizeDimension()?.clientHeight);

  protected readonly rowActionToolbarName = computed(() => `toolbar:${this.sciTable().instanceId}` as const);
  protected readonly rowActionToolbarOffset = computed(() => {
    const offset = this.sciTable().hoveredIndex() * (this.itemSize() ?? 0);
    return offset + this.headerHeight() - this._scrollTop();
  });

  protected readonly scrolling = this.computeScrolling(this._verticalViewport);
  protected readonly resizing = computed(() => !!this.sciTable().resizingState());
  protected readonly columnWidths = this.computeColumnWidths();
  protected readonly headerDimension = dimension(this._header);

  protected readonly absoluteColumnWidths = computed(() => {
    const headers = this._headers();
    const columns = this.sciTable().columns();

    return headers.reduce((map, header, i) => {
      const column = columns[i];
      if (column) {
        map.set(column.name, header.boundingClientRect().width);
      }
      return map;
    }, new Map<`column:${string}`, number>());
  });

  protected readonly hasOverflow = computed(() => {
    const clientWidth = this.containerDimension().clientWidth;
    const tableWidth = this.verticalViewportDimension().clientWidth;
    return tableWidth > clientWidth;
  });

  /**
   * A grid will never grow beyond its parent unless explicitly set, that is why we need to set the table width.
   * This allows the grid to overflow when resizing.
   */
  protected readonly tableWidth = computed(() => {
    const containerWidth = this.containerDimension().clientWidth;
    const tableWidth = this.verticalViewportDimension().clientWidth;
    const hasFullFractionColumn = this.sciTable().columns().some(column => column.isFraction && !column.absoluteWidth && !column.maxWidth);

    // Only allow full width table when at least one column takes the remaining space.
    return tableWidth < containerWidth && hasFullFractionColumn ? '100%' : `${tableWidth}px`;
  });

  private readonly _scrollTop = signal(0);

  constructor() {
    this.setupToolbar();
    this.installActiveItemWatcher();
    this.installDimensionWatcher();
    this.installCriteriaListener();
    this.installScrollListener();
  }

  protected onRowActionsMouseLeave(event: MouseEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Element && next.closest(TABLE_OVERLAY_SELECTOR)) {
      return;
    }
    // Only hide row actions when leaving the row actions and not hovering a column resize splitter (overlay).
    this.sciTable().setHoveredId(undefined);
  }

  protected onOverlayScrollBy(deltaY: number): void {
    this._verticalViewport().nativeElement.scrollBy({top: deltaY});
  }

  protected onRowActionsMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    this.onOverlayScrollBy(event.deltaY);
  }

  protected onRowPrimaryAction(item?: T): void {
    if (item) {
      this.primaryAction.emit(item);
    }
  }

  /**
   * Scrolls viewport to the top, as soon as either filter or sort criteria change
   */
  private installCriteriaListener(): void {
    effect(() => {
      this.sciTable().criteria(); // track criteria

      // as soon as the table criteria change (and on init), scroll to the top.
      this._verticalViewport().nativeElement.scrollTo({top: 0});
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
      const viewportDimension = this.verticalViewportDimension();
      const itemSize = this.itemSizeDimension()?.clientHeight;
      const overscan = this.sciTable().overscan();
      const scrollTop = this._scrollTop();
      if (itemSize) {
        const visibleRowCount = Math.ceil(viewportDimension.clientHeight / itemSize) + overscan * 2;
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
      const element = this._verticalViewport().nativeElement;

      untracked(() => {
        const subscription = fromEvent(element, 'scroll', {passive: true}).pipe(
          startWith(null),
          subscribeIn(fn => this._zone.runOutsideAngular(fn)),
        ).subscribe(() => {
          this._scrollTop.set(element.scrollTop);
          this.sciTable().setHoveredId(undefined);
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
  private computeScrolling(viewport: Signal<ElementRef<HTMLElement> | undefined>): Signal<boolean> {
    const zone = inject(NgZone);

    return toSignal(toObservable(viewport)
      .pipe(
        switchMap(viewport => viewport ? fromEvent(viewport.nativeElement, 'scroll', {passive: true}).pipe(subscribeIn(fn => zone.runOutsideAngular(fn))) : EMPTY),
        switchMap(() => concat(of(true), timer(150).pipe(map(() => false)))),
      ), {initialValue: false});
  }

  private computeColumnWidths(): Signal<string> {
    return computed(() => {
      const columns = this.sciTable().columns();
      const resizingState = this.sciTable().resizingState();
      const hasOverflow = this.hasOverflow();
      const hasResizedColumns = columns.some(column => column.absoluteWidth);

      if (!resizingState) {
        // Return the override width (absolutWidth) if the column was resized.
        // Else if there is one other resized column or the column is a fixed width (non-fraction) use the column width.
        // Else use the min/max grid definition (only for initial layouting).
        // Otherwise, unchanged fraction columns can change in size after resizing a column.
        return columns
          .map(column => column.absoluteWidth ? `${column.absoluteWidth}px` : (hasResizedColumns || !column.isFraction ? column.width : minmax(column.minWidth, column.width, column.maxWidth)))
          .join(' ');
      }

      const {temporaryColumnWidths, initialColumnWidths, hadOverflow} = resizingState;
      return columns
        .map(column => {
          if (temporaryColumnWidths.get(column.name)!.endsWith('fr')) {
            if (hasOverflow) {
              // Fix fraction columns, if the table was and still is overflowing.
              // If the table went from no overflow, to overflow, fraction columns should all be at minWidth.
              return hadOverflow ? `${initialColumnWidths.get(column.name)!}px` : `${column.minWidth}px`;
            }
            // If the table does not overflow, use the actual column definition.
            return minmax(column.minWidth, temporaryColumnWidths.get(column.name)!, column.maxWidth);
          }
          return temporaryColumnWidths.get(column.name)!;
        })
        .join(' ');
    });
  }

  private scrollFocusedRowIntoViewport(focusedIndex: number): void {
    const viewport = this._verticalViewport().nativeElement;
    const itemSize = this.itemSizeDimension()?.clientHeight;
    if (!itemSize) {
      return;
    }

    const focusedRowTop = focusedIndex * itemSize;
    const focusedRowBottom = focusedRowTop + itemSize;
    const viewportHeight = viewport.clientHeight;
    const viewportTop = viewport.scrollTop;
    const viewportBottom = viewportTop + viewportHeight;

    if (focusedRowTop < viewportTop) {
      viewport.scrollTop = focusedRowTop;
    }
    else if (focusedRowBottom > viewportBottom) {
      viewport.scrollTop = focusedRowBottom - viewportHeight;
    }
  }
}
