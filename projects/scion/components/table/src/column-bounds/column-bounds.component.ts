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
import {SciColumnComponent} from '../column/column.component';

@Component({
  selector: 'sci-column-bounds',
  templateUrl: './column-bounds.component.html',
  styleUrl: './column-bounds.component.scss',
  imports: [
    SciColumnComponent,
  ],
})
export class ColumnBoundsComponent {

  protected readonly table = inject(ɵSCI_TABLE);
}
