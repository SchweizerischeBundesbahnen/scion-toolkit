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
import {SciTableSelectionService} from './table-selection.service';
import {isFromButton, isFromInput} from './common';

@Directive({
  selector: '[sciTableKeyboardNavigator]',
  host: {
    '[attr.tabindex]': '0', // required for keyboard navigation

    '(keydown.arrowUp)': 'isFromInput($event) || selectionService.onArrowUp($event)',
    '(keydown.shift.arrowUp)': 'isFromInput($event) || selectionService.onArrowUp($event)',
    '(keydown.control.arrowUp)': 'isFromInput($event) || selectionService.onArrowUp($event)',
    '(keydown.meta.arrowUp)': 'isFromInput($event) || selectionService.onArrowUp($event)',
    '(keydown.shift.control.arrowUp)': 'isFromInput($event) || selectionService.onArrowUp($event)',
    '(keydown.shift.meta.arrowUp)': 'isFromInput($event) || selectionService.onArrowUp($event)',

    '(keydown.arrowDown)': 'isFromInput($event) || selectionService.onArrowDown($event)',
    '(keydown.shift.arrowDown)': 'isFromInput($event) || selectionService.onArrowDown($event)',
    '(keydown.control.arrowDown)': 'isFromInput($event) || selectionService.onArrowDown($event)',
    '(keydown.meta.arrowDown)': 'isFromInput($event) || selectionService.onArrowDown($event)',
    '(keydown.shift.control.arrowDown)': 'isFromInput($event) || selectionService.onArrowDown($event)',
    '(keydown.shift.meta.arrowDown)': 'isFromInput($event) || selectionService.onArrowDown($event)',

    '(keydown.arrowLeft)': 'isFromInput($event) || selectionService.onArrowLeft($event)',

    '(keydown.arrowRight)': 'isFromInput($event) || selectionService.onArrowRight($event)',

    '(keydown.space)': 'isFromInput($event) || isFromButton($event) || selectionService.onSpace($event)',
    '(keydown.control.space)': 'isFromInput($event) || isFromButton($event) || selectionService.onSpace($event)',
    '(keydown.meta.space)': 'isFromInput($event) || isFromButton($event) || selectionService.onSpace($event)',

    '(keydown.control.a)': 'isFromInput($event) || selectionService.onControlA($event)',
    '(keydown.meta.a)': 'isFromInput($event) || selectionService.onControlA($event)',

    '(keydown.pageUp)': 'isFromInput($event) || selectionService.onPageUp($event)',
    '(keydown.shift.pageUp)': 'isFromInput($event) || selectionService.onPageUp($event)',
    '(keydown.control.pageUp)': 'isFromInput($event) || selectionService.onPageUp($event)',
    '(keydown.meta.pageUp)': 'isFromInput($event) || selectionService.onPageUp($event)',
    '(keydown.shift.control.pageUp)': 'isFromInput($event) || selectionService.onPageUp($event)',
    '(keydown.shift.meta.pageUp)': 'isFromInput($event) || selectionService.onPageUp($event)',

    '(keydown.pageDown)': 'isFromInput($event) || selectionService.onPageDown($event)',
    '(keydown.shift.pageDown)': 'isFromInput($event) || selectionService.onPageDown($event)',
    '(keydown.control.pageDown)': 'isFromInput($event) || selectionService.onPageDown($event)',
    '(keydown.meta.pageDown)': 'isFromInput($event) || selectionService.onPageDown($event)',
    '(keydown.shift.control.pageDown)': 'isFromInput($event) || selectionService.onPageDown($event)',
    '(keydown.shift.meta.pageDown)': 'isFromInput($event) || selectionService.onPageDown($event)',

    '(keydown.home)': 'isFromInput($event) || selectionService.onHome($event)',
    '(keydown.shift.home)': 'isFromInput($event) || selectionService.onHome($event)',
    '(keydown.control.home)': 'isFromInput($event) || selectionService.onHome($event)',
    '(keydown.meta.home)': 'isFromInput($event) || selectionService.onHome($event)',
    '(keydown.shift.control.home)': 'isFromInput($event) || selectionService.onHome($event)',
    '(keydown.shift.meta.home)': 'isFromInput($event) || selectionService.onHome($event)',

    '(keydown.end)': 'isFromInput($event) || selectionService.onEnd($event)',
    '(keydown.shift.end)': 'isFromInput($event) || selectionService.onEnd($event)',
    '(keydown.control.end)': 'isFromInput($event) || selectionService.onEnd($event)',
    '(keydown.meta.end)': 'isFromInput($event) || selectionService.onEnd($event)',
    '(keydown.shift.control.end)': 'isFromInput($event) || selectionService.onEnd($event)',
    '(keydown.shift.meta.end)': 'isFromInput($event) || selectionService.onEnd($event)',
  },
})
export class SciTableKeyboardNavigatorDirective {

  protected readonly selectionService = inject(SciTableSelectionService);

  protected readonly isFromInput = isFromInput;
  protected readonly isFromButton = isFromButton;
}
