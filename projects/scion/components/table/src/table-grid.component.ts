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
import {SciColumnService} from './column/column.service';

/**
 * Represents a semantic element for the table body provided as slotted content.
 */
@Component({
  selector: 'sci-table-grid',
  template: '<ng-content/>',
  providers: [
    SciColumnService,
  ],
  host: {
    '[style.--ɵsci-table-columns]': 'gridTemplateColumns()',
  },
})
export class SciTableGridComponent {

  protected readonly gridTemplateColumns = inject(SciColumnService).gridTemplateColumns;
}
