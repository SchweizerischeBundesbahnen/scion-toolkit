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
import {SciTableColumnLike} from '../table.model';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciIconComponent} from '@scion/components/icon';
import {text} from '@scion/components/text';
import {NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'sci-column-header',
  imports: [
    SciIconComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './column-header.component.html',
  styleUrl: './column-header.component.scss',
  host: {
    '[attr.data-column]': 'column().name',
    '[attr.title]': 'header()',
  },
})
export class SciColumnHeaderComponent<T> {

  public readonly column = input.required<SciTableColumnLike<T>>();

  protected readonly table = inject(ɵSCI_TABLE);
  protected readonly header = text(computed(() => this.column().header()));
  protected readonly sortDirection = computed(() => this.table().sortCriteria().find(criteria => criteria.columnName === this.column().name)?.direction);

  protected onSort(event: PointerEvent): void {
    this.table().sort(this.column().name, event.ctrlKey || event.metaKey);
  }
}
