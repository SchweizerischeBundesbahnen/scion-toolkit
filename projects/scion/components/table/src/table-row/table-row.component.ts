/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, inject, input, output, Signal, viewChild} from '@angular/core';
import {SciTableEvent, SciTableRow, skeletonRowId} from '../table.model';
import {SciTableCellComponent} from '../table-cell/table-cell.component';
import {ɵSCI_TABLE, ɵSciTable} from '../ɵtable.model';
import {SciTableSelectionService} from '../table-selection.service';
import {contributeMenu, SciToolbarComponent} from '@scion/components/menu';
import {UUID} from '@scion/toolkit/uuid';
import {SciIconComponent} from '@scion/components/icon';

@Component({
  selector: 'sci-table-row',
  templateUrl: './table-row.component.html',
  styleUrl: './table-row.component.scss',
  imports: [
    SciTableCellComponent,
    SciToolbarComponent,
    SciIconComponent,
  ],
  host: {
    '[attr.data-active]': `row().active() ? '' : null`,
    '[attr.data-selected]': `row().selected() ? '' : null`,
    '[attr.data-hovered]': `row().hovered() ? '' : null`,
    '[attr.data-level]': 'row().level',
    '(click)': 'onRowClick($event)',
    '(dblclick)': 'onRowDblClick($event)',
    '(mouseenter)': 'onRowMouseEnter()',
    '(mouseleave)': 'onRowMouseLeave($event)',
  },
})
export class SciTableRowComponent<T, ID> {

  public readonly row = input.required<SciTableRow<T, ID>>();
  public readonly primaryAction = output<SciTableEvent<ID>>();

  protected readonly table = inject<Signal<ɵSciTable<T, ID>>>(ɵSCI_TABLE);
  protected readonly rowActionToolbar = viewChild(SciToolbarComponent);
  protected readonly rowActionsToolbarName = `toolbar:${UUID.randomUUID()}` as const;

  private readonly _selectionService = inject(SciTableSelectionService);

  constructor() {
    this.contributeRowActions();
  }

  protected onRowClick(event: PointerEvent): void {
    const row = this.row();
    if (row.id === skeletonRowId) {
      return;
    }
    const index = this.table().rowIndexById().get(row.id) ?? -1;
    void this._selectionService.onRowClick(index, event);
  }

  protected onRowDblClick(event: MouseEvent): void {
    const row = this.row();
    if (row.id === skeletonRowId) {
      return;
    }
    this.primaryAction.emit({sourceEvent: event, items: [row.id]});
  }

  protected onRowMouseEnter(): void {
    const row = this.row();
    if (row.id === skeletonRowId) {
      return;
    }
    const index = this.table().rowIndexById().get(row.id) ?? -1;
    this.table().hoveredIndex.set(index);
  }

  protected onRowMouseLeave(event: MouseEvent): void {
    const next = event.relatedTarget;
    // Do not unset hovered row when hovering a column resize splitter.
    if (next instanceof Element && next.closest('sci-splitter')) {
      return;
    }

    this.table().hoveredIndex.set(-1);
  }

  protected onActionToolbarClick(event: PointerEvent): void {
    const row = this.row();
    if (row.id === skeletonRowId) {
      return;
    }
    event.stopPropagation(); // prevent selecting the row
    this.table().setActiveItem(row.id);
  }

  private contributeRowActions(): void {
    contributeMenu(this.rowActionsToolbarName, toolbar => {
      if (this.row().id !== skeletonRowId) {
        this.table().rowActions?.(toolbar, this.row().item, this.row().index);
      }
    });
  }
}
