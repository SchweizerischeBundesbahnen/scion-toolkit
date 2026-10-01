/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, inject, input, output} from '@angular/core';
import {SciTableEvent, SciTableRow} from '../table.model';
import {SciTableCellComponent} from '../table-cell/table-cell.component';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciTableSelectionService} from '../table-selection.service';

@Component({
  selector: 'sci-table-row',
  templateUrl: './table-row.component.html',
  styleUrl: './table-row.component.scss',
  imports: [
    SciTableCellComponent,
  ],
  host: {
    '[attr.data-active]': `row().active() ? '' : null`,
    '[attr.data-selected]': `row().selected() ? '' : null`,
    '[attr.data-hovered]': `row().hovered() ? '' : null`,
    '[class]': 'row().bindings?.cssClass?.()',
    '(click)': 'onRowClick($event)',
    '(dblclick)': 'onRowDblClick($event)',
    '(mouseenter)': 'onRowMouseEnter()',
    '(mouseleave)': 'onRowMouseLeave($event)',
  },
})
export class SciTableRowComponent<T> {

  public readonly row = input.required<SciTableRow<T>>();
  public readonly primaryAction = output<SciTableEvent<T>>();

  protected readonly table = inject(ɵSCI_TABLE);

  private readonly _selectionService = inject(SciTableSelectionService);

  protected onRowClick(event: PointerEvent): void {
    if (this.row().loading) {
      return;
    }
    void this._selectionService.onRowClick(this.row().index, event);
  }

  protected onRowDblClick(event: MouseEvent): void {
    if (this.row().loading) {
      return;
    }
    this.primaryAction.emit({sourceEvent: event, items: [this.row().item!]});
  }

  protected onRowMouseEnter(): void {
    this.table().hoveredIndex.set(this.row().index);
  }

  protected onRowMouseLeave(event: MouseEvent): void {
    const next = event.relatedTarget;
    // Do not unset hovered row when hovering a column resize splitter.
    if (next instanceof Element && next.closest('sci-splitter')) {
      return;
    }

    if (next instanceof Element && next.closest('sci-toolbar.row-actions')) {
      return;
    }

    this.table().hoveredIndex.set(-1);
  }
}
