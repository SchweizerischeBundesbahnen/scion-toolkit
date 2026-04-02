import {Directive, inject} from '@angular/core';
import {TableSelectionService} from './table-selection.service';

@Directive({
  selector: '[sciTableKeyboardNavigator]',
  host: {
    '(keydown.arrowUp)': 'selectionService.onArrowUp($event)',
    '(keydown.shift.arrowUp)': 'selectionService.onArrowUp($event)',
    '(keydown.arrowDown)': 'selectionService.onArrowDown($event)',
    '(keydown.shift.arrowDown)': 'selectionService.onArrowDown($event)',
    '(keydown.space)': 'selectionService.onSpace($event)',
  },
})
export class TableKeyboardNavigatorDirective {
  protected selectionService = inject(TableSelectionService);
}
