/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, inject, input, output, viewChild, viewChildren} from '@angular/core';
import {SciRow} from '../table.model';
import {TableCellComponent} from '../table-cell/table-cell.component';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {TableSelectionService} from '../table-selection.service';
import {TABLE_SPLITTERS_SELECTOR} from '../column-splitters/column-splitters.component';
import {contributeMenu, SciToolbarComponent} from '@scion/components/menu';
import {UUID} from '@scion/toolkit/uuid';
import {ɵSCI_TABLE_FLAGS} from '../ɵtable-flags';

@Component({
  selector: 'sci-table-row',
  templateUrl: './table-row.component.html',
  styleUrl: './table-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TableCellComponent,
    SciToolbarComponent,
  ],
  host: {
    '[class.active]': 'isActive()',
    '[class.selected]': 'isSelected()',
    '[class.loading]': 'loading()',
    '[class.hover]': 'isHovered()',
    '[attr.data-row-index]': 'tableFlags?.rowIndexAttribute ? this.row().index : null',
    '[class]': 'row().bindings?.cssClass?.()',
    '(click)': 'onRowClick($event)',
    '(dblclick)': 'onRowDblClick()',
    '(keydown.enter)': 'onRowEnter()',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave($event)',
  },
})
export class TableRowComponent<T> {

  public readonly row = input.required<SciRow<T>>();

  public readonly primaryAction = output<void>();

  private readonly _selectionService = inject(TableSelectionService);
  protected readonly table = inject(ɵSCI_TABLE);
  protected readonly cells = viewChildren(TableCellComponent);

  protected readonly item = computed(() => this.row().item);
  protected readonly id = computed(() => this.row().id);
  protected readonly loading = computed(() => this.item() === undefined); // Rows are initialized with an undefined item, before data is loaded
  protected readonly isActive = computed(() => this.item() !== undefined && this.item() === this.table().activeItem());
  protected readonly isSelected = computed(() => this.table().selectedIds().has(this.id()));
  protected readonly isHovered = computed(() => this.table().hoveredRow() === this.row());
  protected readonly rowActionToolbar = viewChild(SciToolbarComponent);

  protected readonly rowActionsToolbarName = `toolbar:${UUID.randomUUID()}` as const;
  protected readonly tableFlags = inject(ɵSCI_TABLE_FLAGS, {optional: true});

  constructor() {
    this.contributeRowActions();
  }

  public getCellWidth(columnName: `column:${string}`): number {
    return this.cells().find(cell => cell.cell().columnName === columnName)?.getWidth() ?? 0;
  }

  protected onRowEnter(): void {
    if (this.loading()) {
      return;
    }
    this.primaryAction.emit();
  }

  protected onRowClick(event: PointerEvent): void {
    if (this.loading()) {
      return;
    }
    void this._selectionService.onRowClick(this.row().index, event);
  }

  protected onRowDblClick(): void {
    if (this.loading()) {
      return;
    }
    this.primaryAction.emit();
  }

  protected onMouseEnter(): void {
    this.table().hoveredIndex.set(this.row().index);
  }

  protected onMouseLeave(event: MouseEvent): void {
    const next = event.relatedTarget;
    // Do not unset hovered row when hovering a column resize splitter.
    if (next instanceof Element && next.closest(TABLE_SPLITTERS_SELECTOR)) {
      return;
    }

    this.table().hoveredIndex.set(-1);
  }

  protected onActionToolbarClick(event: PointerEvent): void {
    event.stopPropagation(); // prevent selecting the row
    this.table().activeItem.set(this.item());
  }

  private contributeRowActions(): void {
    contributeMenu(this.rowActionsToolbarName, toolbar => {
      const item = this.row().item;
      const rowActionsFactoryFn = this.table().rowActions;
      if (item && rowActionsFactoryFn) {
        rowActionsFactoryFn(item, toolbar);
      }
    });
  }
}
