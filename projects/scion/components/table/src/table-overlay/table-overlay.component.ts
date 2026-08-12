/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, ElementRef, inject, input, output, Signal, viewChildren} from '@angular/core';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {ɵSCI_TABLE, ɵSciTable} from '../ɵtable.model';
import {SciColumnLike} from '../table.model';
import {TableRowComponent} from '../table-row/table-row.component';
import {toObservable} from '@angular/core/rxjs-interop';
import {firstValueFrom, skip} from 'rxjs';

export const TABLE_OVERLAY_SELECTOR = 'sci-table-overlay';

@Component({
  selector: TABLE_OVERLAY_SELECTOR,
  imports: [
    SciSplitterComponent,
  ],
  host: {
    '(wheel)': 'onMouseWheel($event)',
  },
  templateUrl: './table-overlay.component.html',
  styleUrl: './table-overlay.component.scss',
})
export class TableOverlayComponent<T> {

  public readonly columnWidths = input.required<Map<`column:${string}`, number>>();
  public readonly hasOverflow = input.required<boolean>();
  public readonly rows = input.required<ReadonlyArray<TableRowComponent<unknown>>>();

  public readonly scrollBy = output<number>();

  protected table = inject(ɵSCI_TABLE) as Signal<ɵSciTable<T>>;

  private readonly _splitters = viewChildren(SciSplitterComponent, {read: ElementRef});
  private readonly _columnWidths$ = toObservable(this.columnWidths);
  protected readonly resizing = computed(() => this.table().resizingState() !== undefined);

  protected onResizeStart(column: SciColumnLike<T>): void {
    this.table().resizingState.set({
      column,
      hadOverflow: this.hasOverflow(),
      initialColumnWidths: new Map(this.columnWidths()),
      initialFractionColumns: new Set(this.table().columns().filter(c => !c.absoluteWidth && c.isFraction && c !== column).map(column => column.name)),
      temporaryColumnWidths: this.calculateTemporaryColumns(column),
    });
  }

  protected onResize(column: SciColumnLike<T>, event: SplitterMoveEvent): void {
    const columnIndex = this.table().columns().findIndex(c => c.name === column.name);
    const splitter = this._splitters()[columnIndex]?.nativeElement as HTMLElement | undefined;
    if (columnIndex < 0 || !splitter) {
      return;
    }

    const splitterRect = splitter.getBoundingClientRect();
    const splitterStart = splitterRect.left;
    const splitterEnd = splitterRect.left + splitterRect.width;

    // Ignore the event if outside the splitter's action scope.
    const eventPos = event.position.clientPos;
    // The column should not grow after moved the mouse pointer beyond the left bounds of the column and now moving the mouse pointer back toward the current column.
    if (event.distance > 0 && eventPos < splitterStart) {
      return;
    }

    // The column should not shrink after moved the mouse pointer beyond the right bounds of the column and now moving the mouse pointer back toward the current column.
    if (event.distance < 0 && eventPos > splitterEnd) {
      return;
    }

    this.table().resizingState.update(state => {
      if (!state) {
        return state;
      }

      const width = this.fromPx(state.temporaryColumnWidths.get(column.name)!) + event.distance;
      const boundedWidth = Math.max(column.minWidth, Math.min(column.maxWidth ?? width, width));
      const temporaryColumnWidths = this.calculateTemporaryColumns(state.column).set(column.name, `${boundedWidth}px`);

      return ({
        ...state,
        temporaryColumnWidths,
      });
    });
  }

  protected onResizeEnd(): void {
    const {column, temporaryColumnWidths, initialFractionColumns} = this.table().resizingState()!;
    // Recalculate fraction ratios based on the remaining flexible space.
    const fractionRatios = this.calculateFractionRatios(initialFractionColumns);
    this.table().columns.update(columns => columns.map(c => {
      if (c.name === column.name) {
        c.absoluteWidth = this.fromPx(temporaryColumnWidths.get(c.name)!);
      }

      if (fractionRatios.has(c.name)) {
        c.width = fractionRatios.get(c.name)!;
      }

      return c;
    }));

    this.table().resizingState.set(undefined);
  }

  public async onResizeAuto(column: SciColumnLike<T>): Promise<void> {
    this.onResizeStart(column);
    const cellWidths = this.rows().map(row => row.getCellWidth(column.name));
    const previousWidth = this.table().resizingState()!.temporaryColumnWidths.get(column.name)!;
    // Get the maximum cell width, bounded by the min/max width.
    const maxWidth = `${Math.min(Math.max(...cellWidths, column.minWidth), column.maxWidth ?? Infinity)}px`;

    // Only apply the change if the columnWidth actually changed.
    if (maxWidth !== previousWidth) {
      this.table().resizingState.update(state => state ? ({
        ...state,
        temporaryColumnWidths: new Map(state.temporaryColumnWidths).set(column.name, maxWidth),
      }) : undefined);

      // Wait until the resize is reflected in the DOM.
      // Skip first emission, because a `toObservable` always emits upon subscription.
      await firstValueFrom(this._columnWidths$.pipe(skip(1)));
    }

    this.onResizeEnd();
  }

  protected onMouseLeave(): void {
    // Reset hovered item on mouse leave, because hovering a splitter prevents the reset.
    // This makes sure the row actions disappear when leaving a splitter for another element than a row (i.e. the header)
    this.table().setHoveredIndex(undefined);
  }

  protected onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    this.scrollBy.emit(event.deltaY);
  }

  private calculateFractionRatios(factionColumns: Set<`column:${string}`>): Map<`column:${string}`, string> {
    const columnWidths = this.columnWidths();

    // Skip fractionColumns which are already at max width. They should not contribute to the flex width.
    const actualFractionColumns = this.table().columns()
      .filter(column => factionColumns.has(column.name) && columnWidths.get(column.name)! < (column.maxWidth ?? Infinity))
      .reduce((set, column) => set.add(column.name), new Set<`column:${string}`>());

    const totalFlexWidth = [...columnWidths.entries()].reduce((sum, [name, width]) => actualFractionColumns.has(name) ? sum + width : sum, 0);
    return this.table().columns().reduce((map, column) => {
      if (!factionColumns.has(column.name)) {
        return map;
      }
      return map.set(column.name, `${(columnWidths.get(column.name) ?? 0) / totalFlexWidth}fr`);
    }, new Map<`column:${string}`, string>());
  }

  private calculateTemporaryColumns(resizingColumn: SciColumnLike<T>): Map<`column:${string}`, string> {
    const columnIndex = this.table().columns().indexOf(resizingColumn);
    const columnWidths = this.columnWidths();
    // Only allow columns to the right of the resized column to flex.
    const fractionColumns = new Set(this.table().columns()
      .filter((column, i) => i > columnIndex && column.isFraction && !column.absoluteWidth)
      .map(column => column.name));
    const fractionRatios = this.calculateFractionRatios(fractionColumns);

    return this.table().columns().reduce((map, column) => {
      // 1. Check if column was already resized and use this value.
      // 2. Check if column is a fraction, use the fraction ratio.
      // 3. Use the computed column width in px.
      const absoluteWidth = column.absoluteWidth ? `${column.absoluteWidth}px` : null;
      return map.set(column.name, absoluteWidth ?? fractionRatios.get(column.name) ?? `${columnWidths.get(column.name)}px`);
    }, new Map<`column:${string}`, string>());
  }

  private fromPx(value: string): number {
    return +value.substring(0, value.length - 2);
  }
}
