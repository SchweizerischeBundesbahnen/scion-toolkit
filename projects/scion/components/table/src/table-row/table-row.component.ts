/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, input, output, viewChildren} from '@angular/core';
import {SciRow} from '../table.model';
import {TableCellComponent} from '../table-cell/table-cell.component';

@Component({
  selector: 'sci-table-row',
  templateUrl: './table-row.component.html',
  styleUrl: './table-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.active]': 'isActive()',
    '[class.selected]': 'isSelected()',
    '(click)': 'onRowClick($event)',
    '(keydown.enter)': 'onRowEnter()',
  },
  imports: [
    TableCellComponent,
  ],
})
export class TableRowComponent<T> {

  public readonly row = input.required<SciRow<T>>();
  public readonly index = input.required<number>();

  // TODO [eg]: Move row selection to service
  public readonly selectedRows = input.required<number[]>();
  public readonly activeRow = input<number>();
  public readonly activateRow = output();
  public readonly selectRow = output<{ctrlKey: boolean}>();

  protected readonly cells = viewChildren(TableCellComponent);

  protected readonly isActive = computed(() => this.index() === this.activeRow());
  protected readonly isSelected = computed(() => this.selectedRows().includes(this.index()));

  // TODO [eg]: Should we access this differently?
  public getCellWidth(columnId: string): number {
    return this.cells().find(cell => cell.cell().columnName === columnId)?.getWidth() ?? 0;
  }

  protected onRowEnter(): void {
    this.activateRow.emit();
  }

  protected onRowClick(event: PointerEvent): void {
    this.selectRow.emit({ctrlKey: event.ctrlKey || event.metaKey});
  }
}
