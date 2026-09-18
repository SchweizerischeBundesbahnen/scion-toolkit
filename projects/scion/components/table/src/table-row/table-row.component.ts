/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, inject, input, output, viewChild} from '@angular/core';
import {SciRow} from '../table.model';
import {TableCellComponent} from '../table-cell/table-cell.component';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {TableSelectionService} from '../table-selection.service';
import {TABLE_SPLITTERS_SELECTOR} from '../column-splitters/column-splitters.component';
import {contributeMenu, SciToolbarComponent} from '@scion/components/menu';
import {UUID} from '@scion/toolkit/uuid';

@Component({
  selector: 'sci-table-row',
  templateUrl: './table-row.component.html',
  styleUrl: './table-row.component.scss',
  imports: [
    TableCellComponent,
    SciToolbarComponent,
  ],
  host: {
    '[attr.data-active]': `row().active() ? '' : null`,
    '[attr.data-selected]': `row().selected() ? '' : null`,
    '[attr.data-hovered]': `row().hovered() ? '' : null`,
    '[class]': 'row().bindings?.cssClass?.()',
    '(click)': 'onRowClick($event)',
    '(dblclick)': 'onRowDblClick()',
    '(keydown.enter)': 'onRowEnter()',
    '(mouseenter)': 'onRowMouseEnter()',
    '(mouseleave)': 'onRowMouseLeave($event)',
  },
})
export class SciTableRowComponent<T> {

  public readonly row = input.required<SciRow<T>>();
  public readonly primaryAction = output<void>();

  protected readonly table = inject(ɵSCI_TABLE);
  protected readonly rowActionToolbar = viewChild(SciToolbarComponent);
  protected readonly rowActionsToolbarName = `toolbar:${UUID.randomUUID()}` as const;

  private readonly _selectionService = inject(TableSelectionService);

  constructor() {
    this.contributeRowActions();
  }

  protected onRowEnter(): void {
    if (this.row().loading) {
      return;
    }
    this.primaryAction.emit();
  }

  protected onRowClick(event: PointerEvent): void {
    if (this.row().loading) {
      return;
    }
    void this._selectionService.onRowClick(this.row().index, event);
  }

  protected onRowDblClick(): void {
    if (this.row().loading) {
      return;
    }
    this.primaryAction.emit();
  }

  protected onRowMouseEnter(): void {
    this.table().hoveredIndex.set(this.row().index);
  }

  protected onRowMouseLeave(event: MouseEvent): void {
    const next = event.relatedTarget;
    // Do not unset hovered row when hovering a column resize splitter.
    if (next instanceof Element && next.closest(TABLE_SPLITTERS_SELECTOR)) {
      return;
    }

    this.table().hoveredIndex.set(-1);
  }

  protected onActionToolbarClick(event: PointerEvent): void {
    event.stopPropagation(); // prevent selecting the row
    this.table().activeItem.set(this.row().item);
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
