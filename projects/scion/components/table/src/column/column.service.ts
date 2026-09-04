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
import {computed, inject, Injectable, Signal, signal, WritableSignal} from '@angular/core';
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

  /**
   * Computes the CSS `grid-template-columns` value.
   *
   * Columns are layed out according to their configured widths. While resizing a column, absolute pixel widths are used.
   */
  private computeGridTemplateColumns(): Signal<string> {
    return computed(() => {
      return this._table().columns()
        .map(column => {
          const columnWidth = this._resizingState()?.columnWidths()?.get(column.name);
          if (columnWidth !== undefined) {
            return `${columnWidth}px`;
          }
          if (column.width().endsWith('fr')) {
            return cssMinmax({min: column.minWidth, max: column.width()});
          }
          return column.width();
        })
        .join(' ');
    });
  }

  public startResize(column: SciColumnLike): void {
    column.resizing.set(true);
    this._resizingState.set({column, columnWidths: signal(undefined)});
  }

  public resize(columnWidth: number): void {
    const state = this._resizingState()!;
    const clampedWidth = clamp(columnWidth, {min: state.column.minWidth});

    if (clampedWidth !== state.columnWidths()?.get(state.column.name)) {
      const columnWidths = this.calculateColumnWidths(state.column, clampedWidth);
      state.columnWidths.set(columnWidths);
    }
  }

  public endResize(): void {
    const {column, columnWidths} = this._resizingState()!;
    this.updateUserSettings(column, columnWidths()!);
    column.resizing.set(false);
    this._resizingState.set(undefined);
  }

  /**
   * Updates user settings with resized column widths.
   */
  private updateUserSettings(resizedColumn: SciColumnLike, columnWidths: Map<`column:${string}`, number>): void {
    const resizedColumnIndex = this._table().columns().indexOf(resizedColumn);
    this._table().userSettings.update(userSettings => ({
      ...userSettings,
      columns: this._table().columns().flatMap((column, index) => {
        const columnSettings = userSettings.columns?.find(it => it.name === column.name);
        // Store the width of the resized column and all columns to its left.
        if (index <= resizedColumnIndex) {
          return {
            ...columnSettings ?? {name: column.name},
            width: columnWidths.get(column.name),
          };
        }

        return columnSettings ?? [];
      }),
    }));
  }

  /**
   * Calculates absolute column widths based on the resized column's new width.
   *
   * Remaining viewport space is distributed proportionally among flex-sized (`fr`) columns using their current width ratio.
   */
  private calculateColumnWidths(columnToResize: SciColumnLike, newColumnWidth: number): Map<`column:${string}`, number> {
    const columns = this._table().columns();
    const viewportWidth = this._tableViewport.clientWidth;
    const columnIndex = columns.indexOf(columnToResize);

    // IMPORTANT:
    // Columns to the left are permanently fixed.

    // Calculate the total width occupied by fixed-sized columns, plus all columns to the left.
    const totalFixedWidth = columns
      .filter((column, index) => index <= columnIndex || !column.width().endsWith('fr'))
      .reduce((sum, column) => sum + (column === columnToResize ? newColumnWidth : column.location.width), 0);

    // Calculate the total width occupied by flex-sized columns.
    const flexColumns = columns
      .filter((column, index) => index > columnIndex && column.width().endsWith('fr'))
      .reduce((set, column) => set.add(column), new Set<SciColumnLike>());
    const totalFlexWidth = [...flexColumns].reduce((sum, column) => sum + column.location.width, 0);

    // Calculate the total viewport space available for flex-sized distribution.
    const availableFlexWidth = Math.max(0, viewportWidth - totalFixedWidth);

    // Calculate the absolute width per column, distributing available flex space proportionally to the column's ratio.
    return columns.reduce((map, column) => {
      if (column === columnToResize) {
        return map.set(column.name, newColumnWidth);
      }
      if (flexColumns.has(column)) {
        const ratio = column.location.width / totalFlexWidth;
        const absoluteWidth = ratio * availableFlexWidth;
        return map.set(column.name, clamp(absoluteWidth, {min: column.minWidth}));
      }
      return map.set(column.name, column.location.width);
    }, new Map<`column:${string}`, number>());
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
  columnWidths: WritableSignal<Map<`column:${string}`, number> | undefined>;
}
