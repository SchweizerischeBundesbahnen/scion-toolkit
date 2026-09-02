/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, inject, input, signal} from '@angular/core';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciColumnLike} from '../table.model';
import {TableRowComponent} from '../table-row/table-row.component';
import {clamp} from '@scion/toolkit/util';
import {SciColumnService} from '../column/column.service';

export const TABLE_SPLITTERS_SELECTOR = 'sci-column-splitters';

@Component({
  selector: TABLE_SPLITTERS_SELECTOR,
  templateUrl: './column-splitters.component.html',
  styleUrl: './column-splitters.component.scss',
  imports: [
    SciSplitterComponent,
  ],
})
export class ColumnSplittersComponent<T> {

  public readonly rows = input.required<readonly TableRowComponent<unknown>[]>();

  protected readonly table = inject(ɵSCI_TABLE);

  private readonly _hovered = signal(false);
  private readonly _columnService = inject(SciColumnService);

  protected onResizeStart(column: SciColumnLike): void {
    this._columnService.startResize(column);
  }

  protected onResize(column: SciColumnLike<T>, event: SplitterMoveEvent): void {
    const pointerPosition = event.position.clientPos; // TODO [dwie] Change to screen coordinates to work with microfrontends
    const columnStart = column.location.x - 1; // -1 because splitters are positioned at the end of cell content
    const newColumnWidth = pointerPosition - columnStart;
    this._columnService.resize(newColumnWidth);
  }

  protected onResizeEnd(): void {
    this._columnService.endResize();

    // Clear the hovered row when resizing ends outside the splitter (for example, above or below it).
    if (!this._hovered()) {
      this.table().hoveredIndex.set(-1);
    }
  }

  public async onResizeAuto(column: SciColumnLike): Promise<void> {
    // Get the maximum cell width, bounded by the min/max width.
    const maxCellWidth = Math.max(...this.rows().map(row => row.getCellWidth(column.name)));
    const packedWidth = clamp(maxCellWidth, {min: column.minWidth, max: column.maxWidth});

    this._columnService.startResize(column);
    this._columnService.resize(packedWidth);
    this._columnService.endResize();
  }

  protected onMouseEnter(): void {
    this._hovered.set(true);
  }

  protected onMouseLeave(): void {
    this._hovered.set(false);

    // Do not clear the hovered row while dragging the resize handle, or quick movements will accidentally clear it.
    // If the mouse leaves the splitter during drag (above or below), the hovered row is unset when resizing ends.
    if (!this.table().resizing()) {
      this.table().hoveredIndex.set(-1);
    }
  }
}
