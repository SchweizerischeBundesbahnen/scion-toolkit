/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, inject, input} from '@angular/core';
import {SciColumnLike} from '../table.model';
import {ColumnFilterComponent} from '../column-filter/column-filter.component';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciIconComponent} from '../../../icon/src/icon.component';
import {SciTextPipe} from '@scion/components/text';

@Component({
  selector: 'sci-column-header',
  imports: [
    ColumnFilterComponent,
    SciIconComponent,
    SciTextPipe,
  ],
  templateUrl: './column-header.component.html',
  styleUrl: './column-header.component.scss',
  host: {
    '[class.filterable]': 'table().filterable()',
    '[attr.data-column]': 'column().name',
  },
})
export class ColumnHeaderComponent<T> {

  public readonly column = input.required<SciColumnLike<T>>();

  protected readonly table = inject(ɵSCI_TABLE);

  protected readonly columnSort = computed(() => this.table().sortCriteria().find(s => s.columnName === this.column().name)?.direction);

  protected onSort(event: PointerEvent): void {
    if (!this.column().sortable()) {
      return;
    }
    this.table().sort(this.column().name, event.ctrlKey || event.metaKey);
  }
}
