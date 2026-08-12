/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Directive, inject} from '@angular/core';
import {TableSelectionService} from './table-selection.service';

@Directive({
  selector: '[sciTableKeyboardNavigator]',
  host: {
    '(keydown.arrowUp)': 'selectionService.onArrowUp($event)',
    '(keydown.shift.arrowUp)': 'selectionService.onArrowUp($event)',
    '(keydown.shift.control.arrowUp)': 'selectionService.onArrowUp($event)',
    '(keydown.shift.meta.arrowUp)': 'selectionService.onArrowUp($event)',
    '(keydown.control.arrowUp)': 'selectionService.onArrowUp($event)',
    '(keydown.meta.arrowUp)': 'selectionService.onArrowUp($event)',
    '(keydown.arrowDown)': 'selectionService.onArrowDown($event)',
    '(keydown.shift.arrowDown)': 'selectionService.onArrowDown($event)',
    '(keydown.shift.control.arrowDown)': 'selectionService.onArrowDown($event)',
    '(keydown.shift.meta.arrowDown)': 'selectionService.onArrowDown($event)',
    '(keydown.control.arrowDown)': 'selectionService.onArrowDown($event)',
    '(keydown.meta.arrowDown)': 'selectionService.onArrowDown($event)',
    '(keydown.control.space)': 'selectionService.onControlSpace($event)',
    '(keydown.meta.space)': 'selectionService.onControlSpace($event)',
    '(keydown.control.a)': 'selectionService.onControlA($event)',
    '(keydown.meta.a)': 'selectionService.onControlA($event)',
  },
})
export class TableKeyboardNavigatorDirective {
  protected selectionService = inject(TableSelectionService);
}
