/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciColumnLike} from '../table.model';
import {computed, effect, inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';
import {clamp} from '@scion/toolkit/util';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciTableViewportRefDirective} from '../table-viewport-ref.directive';
import {cssMinmax} from '../common';

@Injectable()
export class SciColumnService {

  private readonly _table = inject(ɵSCI_TABLE);
  private readonly _tableViewport = inject(SciTableViewportRefDirective).viewport;

  /**
   * State while resizing a column.
   */
  private readonly _resizingState = signal<ColumnResizingState | undefined>(undefined);

  /**
   * Provides the calculated CSS `grid-template-columns` value based on configured and resized column widths.
   */
  public readonly gridTemplateColumns = this.computeGridTemplateColumns();

  constructor() {
    this.notifyOnColumnResize();
  }

  /**
   * Computes the CSS `grid-template-columns` value.
   *
   * Columns are layed out according to their configured widths. While resizing a column, absolute pixel widths are used.
   */
  private computeGridTemplateColumns(): Signal<string> {
    return computed(() => {
      const columns = this._table().columns();

      if (this._resizingState()) {
        const absoluteColumnWidths = this._resizingState()!.columnWidths();
        return columns
          .map(column => `${absoluteColumnWidths.get(column.name)}px`)
          .join(' ');
      }
      else {
        return columns
          .map(column => column.width().endsWith('fr') ? cssMinmax({min: column.minWidth, max: column.maxWidth ?? column.width()}) : column.width())
          .join(' ');
      }
    });
  }

  public startResize(column: SciColumnLike): void {
    const columns = this._table().columns();
    const columnIndex = columns.indexOf(column);

    // Lock columns to the left (permanently).
    columns.slice(0, columnIndex).forEach(column => {
      column.width.set(`${column.location.width}px`);
    });

    const columnWidth = column.location.width;
    const columnWidths = signal(this.calculateAbsoluteColumnWidths(column, columnWidth));
    this._resizingState.set({column, columnWidths});
  }

  public resize(columnWidth: number): void {
    const state = this._resizingState()!;
    const clampedWidth = clamp(columnWidth, {min: state.column.minWidth, max: state.column.maxWidth ?? columnWidth});

    if (clampedWidth !== state.columnWidths().get(state.column.name)) {
      const columnWidths = this.calculateAbsoluteColumnWidths(state.column, clampedWidth);
      state.columnWidths.set(columnWidths);
    }
  }

  public endResize(): void {
    const state = this._resizingState()!;
    const columns = this._table().columns();

    const totalFlexWidth = columns
      .filter(column => column !== state.column)
      .filter(column => column.width().endsWith('fr'))
      .filter(column => column.location.width < (column.maxWidth ?? Infinity))
      .reduce((sum, column) => sum + column.location.width, 0);

    columns.forEach(column => {
      if (column.name === state.column.name) {
        column.width.set(`${column.location.width}px`);
      }
      if (column.width().endsWith('fr')) {
        column.width.set(`${column.location.width / totalFlexWidth}fr`);
      }
      return column;
    });

    this._resizingState.set(undefined);
  }

  /**
   * Calculates absolute column widths based on the resized column's new width.
   *
   * Remaining viewport space is distributed proportionally among flex-sized (`fr`) columns using their current width ratio.
   */
  private calculateAbsoluteColumnWidths(columnToResize: SciColumnLike, newColumnWidth: number): Map<`column:${string}`, number> {
    const columns = this._table().columns();
    const viewportWidth = this._tableViewport.clientWidth;

    // Flex-sized columns already at max width do not contribute to flex space distribution.

    // Calculate the total width occupied by fixed-sized columns.
    const totalFixedWidth = columns
      .filter(column => column !== columnToResize)
      .filter(column => !column.width().endsWith('fr') || column.location.width >= (column.maxWidth ?? Infinity))
      .reduce((sum, column) => sum + column.location.width, 0);

    // Calculate the total width occupied by flex-sized columns.
    const flexColumns = columns
      .filter(column => column !== columnToResize)
      .filter(column => column.width().endsWith('fr') && column.location.width < (column.maxWidth ?? Infinity))
      .reduce((set, column) => set.add(column), new Set<SciColumnLike>());
    const totalFlexWidth = [...flexColumns].reduce((sum, column) => sum + column.location.width, 0);

    // Calculate the total viewport space available for flex-sized distribution.
    const availableFlexWidth = Math.max(0, viewportWidth - totalFixedWidth - newColumnWidth);

    // Calculate the absolute width per column, distributing available flex space proportionally to the column's ratio.
    return columns.reduce((map, column) => {
      if (column === columnToResize) {
        return map.set(column.name, newColumnWidth);
      }
      if (flexColumns.has(column)) {
        const ratio = column.location.width / totalFlexWidth;
        const absoluteWidth = ratio * availableFlexWidth;
        return map.set(column.name, clamp(absoluteWidth, {min: column.minWidth, max: column.maxWidth ?? absoluteWidth}));
      }
      return map.set(column.name, column.location.width);
    }, new Map<`column:${string}`, number>());
  }

  /**
   * Notifies {@link SciColumn} when resizing it.
   */
  private notifyOnColumnResize(): void {
    effect(onCleanup => {
      const column = this._resizingState()?.column;
      if (column) {
        column.resizing.set(true);
        onCleanup(() => column.resizing.set(false));
      }
    });
  }
}

/**
 * State of an active column resize operation.
 */
interface ColumnResizingState {
  /**
   * Column being resized.
   */
  column: SciColumnLike;
  /**
   * Map of column names to their current pixel widths.
   */
  columnWidths: WritableSignal<Map<`column:${string}`, number>>;
}
