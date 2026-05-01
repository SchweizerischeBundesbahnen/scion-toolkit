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
 * Represents a semantic element for the label of a menu item provided as slotted content.
 */
@Component({
  selector: 'sci-menu-item-label',
  template: '<ng-content/>',
})
export class SciMenuItemLabelComponent {
}
