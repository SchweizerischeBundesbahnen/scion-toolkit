/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, inject, input, viewChildren} from '@angular/core';
import {SciRow} from '../table.model';
import {TableCellComponent} from '../table-cell/table-cell.component';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {TableSelectionService} from '../table-selection.service';
import {TABLE_OVERLAY_SELECTOR} from '../table-overlay/table-overlay.component';

@Component({
  selector: 'sci-table-row',
  templateUrl: './table-row.component.html',
  styleUrl: './table-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.active]': 'isActive()',
    '[class.selected]': 'isSelected()',
    '[class.loading]': 'loading()',
    '(click)': 'onRowClick($event)',
    '(keydown.enter)': 'onRowEnter($event)',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave($event)',
  },
  imports: [
    TableCellComponent,
  ],
})
export class TableRowComponent<T> {

  public readonly row = input.required<SciRow<T>>();
  public readonly index = input.required<number>();

  private readonly _selectionService = inject(TableSelectionService);
  protected readonly table = inject(ɵSCI_TABLE);
  protected readonly cells = viewChildren(TableCellComponent);

  protected readonly item = computed(() => this.row().item);
  protected readonly id = computed(() => this.row().id);
  protected readonly loading = computed(() => this.item() === undefined); // Rows are initialized with an undefined item, before data is loaded
  protected readonly isActive = computed(() => this.item() !== undefined && this.item() === this.table().activeItem());
  protected readonly isSelected = computed(() => this.table().selectedIds().has(this.id()));

  public getCellWidth(columnId: string): number {
    return this.cells().find(cell => cell.cell().columnName === columnId)?.getWidth() ?? 0;
  }

  protected onRowEnter(event: Event): void {
    if (this.loading()) {
      return;
    }
    void this._selectionService.onRowClick(this.index(), event as KeyboardEvent);
  }

  protected onRowClick(event: PointerEvent): void {
    if (this.loading()) {
      return;
    }
    void this._selectionService.onRowClick(this.index(), event);
  }

  protected onMouseEnter(): void {
    this.table().setHoveredId(this.id());
  }

  protected onMouseLeave(event: MouseEvent): void {
    const next = event.relatedTarget;
    if (next instanceof Element && next.closest(`${TABLE_OVERLAY_SELECTOR}, sci-toolbar`)) {
      return;
    }
    // Only hide row actions when leaving the row and not hovering the actions itself or a column resize splitter (overlay).
    this.table().setHoveredId(undefined);
  }
}
