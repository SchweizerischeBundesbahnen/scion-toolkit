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
import {afterNextRender, computed, inject, Injectable, Injector, Signal, signal, WritableSignal} from '@angular/core';
import {clamp} from '@scion/toolkit/util';
import {ɵSCI_TABLE} from '../ɵtable.model';

@Injectable()
export class SciColumnService {

  private readonly _table = inject(ɵSCI_TABLE);
  private readonly _injector = inject(Injector);

  /**
   * State while resizing a column.
   */
  private readonly _resizingState = signal<ColumnResizingState | undefined>(undefined);

  /**
   * Provides the calculated CSS `grid-template-columns` value based on configured and resized column widths.
   */
  public readonly gridTemplateColumns = this.computeGridTemplateColumns();

  /**
   * Computes the CSS `grid-template-columns` value.
   *
   * Columns are layed out according to their configured widths. While resizing a column, absolute pixel widths are used.
   */
  private computeGridTemplateColumns(): Signal<string> {
    return computed(() => {
      return this._table().columns()
        .map(column => {
          const width = this._resizingState()?.columnWidths()?.get(column.name) ?? column.width();
          if (typeof width === 'number') {
            return `${width}px`;
          }
          if (width.endsWith('fr')) {
            return cssMinmax({min: column.minWidth, max: width});
          }
          return width;
        })
        .join(' ');
    });
  }

  public startResize(column: SciColumnLike): void {
    column.resizing.set(true);
    this._resizingState.set({column, columnWidths: signal(undefined)});
  }

  public resize(columnWidth: number | 'min-content'): void {
    const state = this._resizingState()!;
    const clampedWidth = typeof columnWidth === 'number' ? clamp(columnWidth, {min: state.column.minWidth}) : columnWidth;

    if (clampedWidth !== state.columnWidths()?.get(state.column.name)) {
      const columnWidths = this.calculateColumnWidths(state.column, clampedWidth);
      state.columnWidths.set(columnWidths);
    }
  }

  public endResize(): void {
    const {column} = this._resizingState()!;

    // Run on next render to update user settings with effective column widths read from the DOM.
    afterNextRender(() => {
      this.updateUserSettings(column);
      column.resizing.set(false);
      this._resizingState.set(undefined);
    }, {injector: this._injector});
  }

  /**
   * Updates user settings with current column widths.
   */
  private updateUserSettings(resizedColumn: SciColumnLike): void {
    const resizedColumnIndex = this._table().columns().indexOf(resizedColumn);
    this._table().userSettings.update(userSettings => ({
      ...userSettings,
      columns: this._table().columns().flatMap((column, index) => {
        const columnSettings = userSettings.columns?.find(it => it.name === column.name);
        // Store the width of the resized column and all columns to its left.
        if (index <= resizedColumnIndex) {
          return {
            ...columnSettings ?? {name: column.name},
            width: column.location.width,
          };
        }

        return columnSettings ?? [];
      }),
    }));
  }

  /**
   * Calculates absolute column widths based on the resized column's new width.
   *
   * Any remaining viewport space is distributed proportionally among flex-sized columns using their current width ratio.
   */
  private calculateColumnWidths(columnToResize: SciColumnLike, newColumnWidth: number | 'min-content'): Map<`column:${string}`, number | 'min-content'> {
    const columns = this._table().columns();
    const columnIndex = columns.indexOf(columnToResize);

    return columns.reduce((map, column, index) => {
      if (index < columnIndex) {
        return map.set(column.name, column.location.width); // columns to the left are fixed
      }
      if (index === columnIndex) {
        return map.set(column.name, newColumnWidth);
      }
      return map;
    }, new Map<`column:${string}`, number | 'min-content'>());
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
   * Map of column names to their pixel widths.
   */
  columnWidths: WritableSignal<Map<`column:${string}`, number | 'min-content'> | undefined>;
}

/**
 * Creates a minmax() CSS function with the given min/max for use in a CSS grid.
 */
function cssMinmax(minmax: {min: number; max: number | string}): string {
  const min = `${minmax.min}px`;
  const max = typeof minmax.max === 'number' ? `${minmax.max}px` : minmax.max;
  return `minmax(${min}, ${max})`;
}
