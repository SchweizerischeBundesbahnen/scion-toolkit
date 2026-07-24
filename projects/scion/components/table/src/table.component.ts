/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, forwardRef, inject, Injector, input, NgZone, Signal, untracked, viewChild, viewChildren, ViewEncapsulation} from '@angular/core';
import {SciColumnLike, SciTable} from './table.model';
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
import {SciNativeScrollbarTrackSizeProvider} from '../../viewport/src/native-scrollbar-track-size-provider.service';
import {ColumnHeaderComponent} from './column-header/column-header.component';
import {TableRowComponent} from './table-row/table-row.component';
import {TableKeyboardNavigatorDirective} from './keyboard-navigator.directive';
import {TableOverlayComponent} from './table-overlay/table-overlay.component';
import {SciTextPipe} from '@scion/components/text';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[style.--ɵsci-table-height]': '`${containerDimension()?.clientHeight ?? 0}px`',
    '[style.--ɵsci-table-virtual-scroll-height]': 'virtualScrollHeight()',
    '[style.--ɵsci-table-header-height]': '`${headerHeight()}px`',
    '[style.--ɵsci-table-columns]': 'columnWidths()',
    '[style.--ɵsci-table-item-size]': '`${sciTable().itemSize()}px`',
    '[style.--ɵsci-table-scrolling]': 'scrolling() ? `true` : null',
    '[style.--ɵsci-table-toolbar-offset]': '`${toolbarOffset()}px`',
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

  private readonly _verticalViewport = viewChild.required<ElementRef<HTMLElement>>('verticalViewport');
  private readonly _header = viewChild<ElementRef<HTMLElement>>('header');
  private readonly _headers = viewChildren(ColumnHeaderComponent);
  private readonly _rows = viewChildren(TableRowComponent);

  private readonly _zone = inject(NgZone);
  private readonly _element = inject(ElementRef);
  private readonly _injector = inject(Injector);

  protected readonly nativeScrollbarTrackSizeProvider = inject(SciNativeScrollbarTrackSizeProvider);

  protected readonly containerDimension = dimension(this._element.nativeElement as HTMLElement);
  protected readonly verticalViewPortDimension = dimension(this._verticalViewport);

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T, ID>);
  protected readonly activeRow = computed(() => this.sciTable().rowsByIndex().get(this.sciTable().activeIndex()));
  protected readonly headerHeight = computed(() => this.headerDimension()?.clientHeight ?? 0);
  protected readonly virtualScrollHeight = computed(() => `${this.sciTable().totalCount() * this.sciTable().itemSize()}px`);

  protected readonly toolbarId = computed(() => `toolbar:${this.sciTable().id}` as const);
  protected readonly toolbarOffset = computed(() => {
    const offset = this.sciTable().activeIndex() * this.sciTable().itemSize();
    return offset + this.headerHeight() - this.sciTable().scrollTop();
  });

  protected readonly scrolling = this.computeScrolling(this._verticalViewport);
  protected readonly columnWidths = this.computeColumnWidths(this.sciTable);

  protected readonly headerDimension = dimension(this._header);
  protected readonly headerWidths = computed(() => this._headers().map(h => h.boundingClientRect().width));

  protected readonly absoluteColumnWidths = computed(() => {
    const columns = this.sciTable().columns();
    const overrides = this.sciTable().columnWidths();
    const headers = this.headerWidths();

    // The width definition of columns can contain non-px values.
    // Prefer using the overwritten column width over the calculated header width from the DOM, because the DOM width can lag behind.
    return columns.map((column, i) => overrides.has(column.name) ?
      overrides.get(column.name)! :
      headers[i]!);
  });

  /**
   * A grid will never grow beyond its parent unless explicitly set, that is why we need to set the table width.
   * This allows the grid overflowing when resizing.
   */
  protected readonly tableWidth = computed(() => {
    const clientWidth = this.containerDimension().clientWidth;
    const tableWidth = this.verticalViewPortDimension().clientWidth;
    const fixedSize = this.sciTable().columnWidths().size > 0;

    // Allow table to grow and shrink with container.
    // When the minimal table width is larger than the container, or the column widths were manually adjusted fix the table width.
    return tableWidth > clientWidth || fixedSize ? `${tableWidth}px` : '100%';
  });

  constructor() {
    this.setupToolbar();
    this.installFocusedItemWatcher();
    this.installDimensionWatcher();
    this.installPageLoader();
    this.installCriteriaListener();
    this.installScrollListener();
  }

  protected onRowHover(id: ID | undefined): void {
    // TODO [table]: figure out how to do mouseleave. (if the mouse leaves for the toolbar it should not reset the active item)
    this.sciTable().setActiveItem(id);
  }

  /**
   * Freeze columns on first resize.
   * This prevents other column widths being changed while dragging.
   */
  protected onResizeStart(): void {
    const table = this.sciTable();
    const overrides = table.columnWidths();
    if (overrides.size > 0) {
      return;
    }

    const absoluteColumnWidths = this.absoluteColumnWidths();
    table.columns()
      .filter(c => !overrides.has(c.name))
      .forEach((column, index) => {
        table.setResizedColumn(column.name, absoluteColumnWidths[index] ?? 0);
      });
  }

  protected onResizeAuto(column: SciColumnLike<T>): void {
    const cellWidths = this._rows().map(row => row.getCellWidth(column.name));
    const maxWidth = Math.max(...cellWidths, 0);
    this.sciTable().setResizedColumn(column.name, maxWidth);
  }

  protected onResize({column, width}: {column: SciColumnLike<T>; width: number}): void {
    this.sciTable().setResizedColumn(column.name, width);
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
   * The toolbar creation needs to be in an effect because the model is passed as an input.
   */
  private setupToolbar(): void {
    effect(onCleanup => {
      const id = this.toolbarId();
      const menu = untracked(() => contributeMenu(id, toolbar => {
        const row = this.activeRow();
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
      const containerDimension = this.containerDimension();
      const itemSize = this.sciTable().itemSize();
      const overscan = this.sciTable().overscan();

      const count = Math.ceil(containerDimension.clientHeight / itemSize) + overscan * 2;
      this.sciTable().setVisibleRowCount(count);
    });
  }

  /**
   * Instructs the internal table model to load a set of pages.
   */
  private installPageLoader(): void {
    effect(onCleanup => {
      const table = this.sciTable();
      const pages = table.pages();
      const pageSize = table.pageSize();
      const sortCriteria = table.sortCriteria();
      const filterCriteria = table.filterCriteria();

      untracked(() => table.loadPages({
        pages,
        pageSize,
        sortCriteria,
        filterCriteria,
        onCleanup,
      }));
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
          this.sciTable().setScrollTop(element.scrollTop);
        });

        onCleanup(() => subscription.unsubscribe());
      });
    });
  }

  private installFocusedItemWatcher(): void {
    effect(() => {
      const focusedIndex = this.sciTable().focusedIndex();

      if (focusedIndex < 0) {
        return;
      }

      untracked(() => this.scrollFocusedRowIntoViewport(focusedIndex));
    });
  }

  /**
   * Computes whether currently scrolling the viewport.
   */
  private computeScrolling(viewport: Signal<ElementRef<HTMLElement> | undefined>): Signal<boolean> {
    const zone = inject(NgZone);

    return toSignal(toObservable(viewport)
      .pipe(
        switchMap(viewport => viewport ? fromEvent(viewport.nativeElement, 'scroll').pipe(subscribeIn(fn => zone.runOutsideAngular(fn))) : EMPTY),
        switchMap(() => concat(of(true), timer(150).pipe(map(() => false)))),
      ), {initialValue: false});
  }

  private computeColumnWidths(table: Signal<ɵSciTable<T, ID>>): Signal<string> {
    return computed(() => {
      const columns = table().columns();
      const overrides = table().columnWidths();

      return columns
        .map(column => overrides.has(column.name) ?
          `${overrides.get(column.name)}px` :
          minmax(column.minWidth(), column.width(), column.maxWidth()),
        )
        .join(' ');
    });
  }

  private scrollFocusedRowIntoViewport(focusedIndex: number): void {
    const table = this.sciTable();
    const viewport = this._verticalViewport().nativeElement;

    const focusedRowTop = focusedIndex * table.itemSize();
    const focusedRowBottom = focusedRowTop + table.itemSize();
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
