/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, inject} from '@angular/core';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciColumnHeaderComponent} from '../column-header/column-header.component';
import {SciColumnFilterComponent} from '../column-filter/column-filter.component';

@Component({
  selector: 'sci-table-header',
  templateUrl: './table-header.component.html',
  styleUrl: './table-header.component.scss',
  host: {
    '(wheel)': 'onMouseWheel($event)',
  },
  imports: [
    SciColumnHeaderComponent,
    SciColumnFilterComponent,
  ],
})
export class SciTableHeaderComponent {

  protected readonly table = inject(ɵSCI_TABLE);

  protected onMouseWheel(event: WheelEvent): void {
    // Prevent vertical scrolling on header, but not horizontal scrolling.
    if (!event.shiftKey) {
      event.preventDefault();
    }
  }
}
