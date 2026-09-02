/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, effect, ElementRef, inject, input, NgZone, output, Provider, Signal, untracked, viewChild, viewChildren, ViewEncapsulation} from '@angular/core';
import {SciTable} from './table.model';
import {SciScrollRange, ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {concat, fromEvent, map, mergeWith, of, switchMap, timer} from 'rxjs';
import {subscribeIn} from '@scion/toolkit/operators';
import {SciScrollbarComponent} from '@scion/components/viewport';
import {startWith} from 'rxjs/operators';
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
import {ColumnBoundsComponent} from './column-bounds/column-bounds.component';
import {SciTableViewportRefDirective} from './table-viewport-ref.directive';
import {SciAttributesDirective} from '@scion/components/common';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[attr.name]': 'name()', // Public API: Enables selecting the table by name in CSS (also if the table has a dynamic name input binding)
    // TODO [dwie] Move styles bindings to viewport component (hidden from outside)
    '[style.--ɵsci-table-scrolling]': 'table().scrolling() ? `true` : null',
    '[style.--ɵsci-table-resizing]': 'table().resizing() ? `true` : null',
    '[style.--ɵsci-table-virtual-scroll-offset-top]': '`${virtualScrollOffsetTop()}px`',
    '[style.--ɵsci-table-virtual-scroll-offset-bottom]': '`${virtualScrollOffsetBottom()}px`',
    '[style.--esci-table-gridlines]': 'table().gridlinesVisible() ? `true` : null',
  },
  imports: [
    SciScrollbarComponent,
    ColumnHeaderComponent,
    TableKeyboardNavigatorDirective,
    TableRowComponent,
    SciTextPipe,
    SciSpinnerThrobberComponent,
    ColumnSplittersComponent, // TODO [egob] Should start with Sci?
    ColumnBoundsComponent, // TODO [egob] Should start with Sci?
    SciTableGridComponent,
    SciTableBodyComponent,
    SciTableHeaderComponent,
    SciTableViewportRefDirective,
    SciAttributesDirective,
  ],
  providers: [
    provideSciTable(),
    TableSelectionService,
  ],
})
export class SciTableComponent<T> { // TODO [egob] Is this generic really helpful?

  /**
   * Specifies a unique table identifier, used as the key for storing user preferences.
   */
  public readonly name = input.required<`table:${string}`>();

  /**
   * Specifies the table definition and datasource.
   */
  public readonly table = input.required({transform: (table: SciTable<T>) => table as ɵSciTable<T>});

  public readonly primaryAction = output<T>();

  private readonly _viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly _viewportClient = viewChild.required(SciTableGridComponent, {read: ElementRef});
  private readonly _header = viewChild(SciTableHeaderComponent, {read: ElementRef});
  private readonly _itemSizeElement = viewChild.required<ElementRef<HTMLElement>>('itemSizeElement');
  protected readonly rows = viewChildren(TableRowComponent);

  private readonly _headerHeight = computed(() => this.headerDimension()?.offsetHeight ?? 0);

  private readonly _viewportDimension = dimension(this._viewport);
  private readonly _viewportClientDimension = dimension(this._viewportClient);
  private readonly _itemSizeDimension = dimension(this._itemSizeElement);

  protected readonly itemSize = computed(() => this._itemSizeDimension().clientHeight);

  protected readonly headerDimension = dimension(this._header);

  protected readonly virtualScrollOffsetTop = computed(() => {
    return (this.table().scrollRange()?.start ?? 0) * this.itemSize();
  });

  protected readonly virtualScrollOffsetBottom = computed(() => {
    const rangeEnd = Math.min(this.table().scrollRange()?.end ?? 0, this.table().totalCount() ?? 0);
    const totalCount = this.table().totalCount() ?? 0;
    return (totalCount - rangeEnd) * this.itemSize();
  });

  private readonly _scrollTop = this.computeScrollTop();

  constructor() {
    this.installActiveItemWatcher();
    this.installScrollRangeTracker();
    this.installCriteriaListener();
    this.installScrollListener();
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
      const viewportHeight = this._viewportDimension().clientHeight - this._headerHeight();
      const itemSize = this._itemSizeDimension().offsetHeight;
      const bufferSize = this.table().bufferSize();
      const scrollTop = this._scrollTop();

      const start = Math.floor(scrollTop / itemSize);
      const viewportRowCount = Math.ceil(viewportHeight / itemSize);
      const end = Math.min(start + viewportRowCount);

      const totalCount = this.table().totalCount() ?? viewportRowCount; // fill viewport if no data loaded yet

      return {
        start: clamp(start - bufferSize, {min: 0, max: Math.max(0, totalCount - viewportRowCount)}),
        end: clamp(end + bufferSize, {max: totalCount}),
      };
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
      effect(() => component.table().connect(component));
      return component.table;
    },
  };
}
