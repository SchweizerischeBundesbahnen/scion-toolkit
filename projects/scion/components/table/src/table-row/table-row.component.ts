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

@Component({
  selector: 'sci-table-row',
  templateUrl: './table-row.component.html',
  styleUrl: './table-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.active]': 'isActive()',
    '[class.selected]': 'isSelected()',
    '[class.loading]': 'loading()',
    '[part]': 'part()',
    '(click)': 'onRowClick($event)',
    '(keydown.enter)': 'onRowEnter()',
  },
  imports: [
    TableCellComponent,
  ],
})
export class TableRowComponent<T, ID> {

  public readonly row = input.required<Partial<SciRow<T, ID>>>();
  public readonly index = input.required<number>();

  private readonly _selectionService = inject(TableSelectionService);
  protected readonly table = inject(ɵSCI_TABLE);
  protected readonly cells = viewChildren(TableCellComponent);

  protected readonly item = computed(() => this.row().item);
  protected readonly id = computed(() => this.item() && this.table().dataSource.identity(this.item()));
  protected readonly isActive = computed(() => this.id() === this.table().activeItem());
  protected readonly isSelected = computed(() => this.table().selectedItems().has(this.id()));
  protected readonly loading = computed(() => !this.item());
  protected readonly part = computed(() => this.item() ? this.table().rowPart?.(this.item()!) : undefined);

  public getCellWidth(columnId: string): number {
    return this.cells().find(cell => cell.cell().columnName === columnId)?.getWidth() ?? 0;
  }

  protected onRowEnter(): void {
    if (this.loading()) {
      return;
    }
    this._selectionService.onRowClick(this.index(), {ctrlKey: false, metaKey: false, shiftKey: false});
  }

  protected onRowClick(event: PointerEvent): void {
    if (this.loading()) {
      return;
    }
    this._selectionService.onRowClick(this.index(), event);
  }
}
