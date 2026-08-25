/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component} from '@angular/core';

/**
 * Represents a semantic element for the table header provided as slotted content.
 */
@Component({
  selector: 'sci-table-header',
  template: '<ng-content/>',
  host: {
    '(wheel)': 'onMouseWheel($event)',
  },
})
export class SciTableHeaderComponent {

  protected onMouseWheel(event: WheelEvent): void {
    // Prevent vertical scrolling on header, but not horizontal scrolling.
    if (!event.shiftKey) {
      event.preventDefault();
    }
  }
}
