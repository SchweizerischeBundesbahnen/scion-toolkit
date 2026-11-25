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
import {SciTableEvent} from '../table.model';
import {SciTableCellComponent} from '../table-cell/table-cell.component';
import {ɵSCI_TABLE, ɵSciTable} from '../ɵtable.model';
import {SciTableSelectionService} from '../table-selection.service';
import {contributeMenu, SciToolbarComponent} from '@scion/components/menu';
import {UUID} from '@scion/toolkit/uuid';
import {SciIconComponent} from '@scion/components/icon';
import {isFromButton, isFromInput} from '../common';
import {SciTreeTableRow} from '../table-tree.model';

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
    '[attr.data-level]': 'row().level()',
    '[attr.data-state]': `row().level() !== undefined && row().children.length ? (row().expanded() ? 'expanded' : 'collapsed') : null`,
    '[style.--ɵsci-table-row-level]': 'row().level()', // only set if hierarchical
    '(click)': 'onRowClick($event)',
    '(dblclick)': 'onRowDblClick($event)',
    '(mouseenter)': 'onRowMouseEnter()',
    '(mouseleave)': 'onRowMouseLeave($event)',
  },
})
export class SciTableRowComponent<T, ID> {

  public readonly row = input.required<SciTreeTableRow<T, ID>>();
  public readonly primaryAction = output<SciTableEvent<ID>>();

  protected readonly table = inject<Signal<ɵSciTable<T, ID>>>(ɵSCI_TABLE);
  private readonly _selectionService = inject(SciTableSelectionService);

  protected readonly rowActionToolbar = viewChild(SciToolbarComponent);
  protected readonly rowActionsToolbarName = `toolbar:${UUID.randomUUID()}` as const;

  constructor() {
    this.contributeRowActions();
  }

  protected onRowClick(event: PointerEvent): void {
    const row = this.row();
    if (row.loading()) {
      return;
    }
    void this._selectionService.onRowClick(row, event);
  }

  protected onRowDblClick(event: MouseEvent): void {
    const row = this.row();
    if (row.loading() || isFromInput(event) || isFromButton(event)) {
      return;
    }
    this.primaryAction.emit({sourceEvent: event, items: [row.id]});
  }

  protected onRowMouseEnter(): void {
    const row = this.row();
    if (row.loading()) {
      return;
    }
    this.table().setHoveredItem(row.id);
  }

  protected onRowMouseLeave(event: MouseEvent): void {
    const next = event.relatedTarget;
    // Do not unset hovered row when hovering a column resize splitter.
    if (next instanceof Element && next.closest('sci-splitter')) {
      return;
    }

    this.table().setHoveredItem(undefined);
  }

  protected onActionToolbarClick(event: PointerEvent): void {
    const row = this.row();
    if (row.loading()) {
      return;
    }
    event.stopPropagation(); // prevent selecting the row
    this.table().setActiveItem(row.id);
  }

  protected onTreeNodeHandle(event: PointerEvent): void {
    const row = this.row();
    if (row.loading()) {
      return;
    }
    event.stopPropagation(); // prevent selecting the row
    this.table().toggleRow(row.id);
  }

  private contributeRowActions(): void {
    contributeMenu(this.rowActionsToolbarName, toolbar => {
      const row = this.row();
      if (!row.loading()) {
        this.table().rowActions?.(toolbar, row.item()!, row.index());
      }
    });
  }
}
