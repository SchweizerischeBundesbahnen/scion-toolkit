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
import {ɵSciTable} from '../ɵtable.model';

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
    '(keydown.enter)': 'onRowEnter()',
    '[part]': 'part()',
  },
  imports: [
    TableCellComponent,
  ],
})
export class TableRowComponent<T> {

  public readonly row = input.required<Partial<SciRow<T>>>();
  public readonly table = input.required<ɵSciTable<T>>();

  // TODO [eg]: Move row selection to service
  public readonly selectedItems = input.required<T[]>();
  public readonly activeItem = input<T>();
  public readonly activateItem = output();
  public readonly selectItem = output<{ctrlKey: boolean}>();

  protected readonly cells = viewChildren(TableCellComponent);

  protected readonly item = computed(() => this.row().item);
  protected readonly isActive = computed(() => this.item() === this.activeItem());
  protected readonly isSelected = computed(() => this.item() && this.selectedItems().includes(this.item()!));
  protected readonly loading = computed(() => !this.item());
  protected readonly part = computed(() => this.item() ? this.table().rowPart?.(this.item()!) : undefined);

  public getCellWidth(columnId: string): number {
    return this.cells().find(cell => cell.cell().columnName === columnId)?.getWidth() ?? 0;
  }

  protected onRowEnter(): void {
    if (this.loading()) {
      return;
    }
    this.activateItem.emit();
  }

  protected onRowClick(event: PointerEvent): void {
    if (this.loading()) {
      return;
    }
    this.selectItem.emit({ctrlKey: event.ctrlKey || event.metaKey});
  }
}
