import {Component, inject} from '@angular/core';
import {contributeMenu, SciMenuService} from '@scion/components/menu';
import {noop} from 'rxjs';

@Component({
  selector: 'app-context-menu-page',
  template: '',
  imports: [],
  host: {
    '(contextmenu)': 'onContextmenuOpen($event)',
  },
})
export class ContextMenuPageComponent {

  private _menuService = inject(SciMenuService);

  constructor() {
    // Contribute the menu.
    contributeMenu('menu:testee', menu => {
      for (let i = 0; i < 20; i++) {
        menu.addMenuItem({label: `Menu Item ${i}`, onSelect: noop});
      }
    });
  }

  protected onContextmenuOpen(event: PointerEvent): void {
    this._menuService.open('menu:testee', {
      anchor: event,
    });
  }
}
