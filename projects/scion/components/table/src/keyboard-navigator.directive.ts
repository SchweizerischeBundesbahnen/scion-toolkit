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
