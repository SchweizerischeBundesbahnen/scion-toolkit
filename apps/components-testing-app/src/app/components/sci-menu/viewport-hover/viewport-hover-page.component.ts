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
import {FormsModule} from '@angular/forms';
import {contributeMenu, SciMenuService} from '@scion/components/menu';
import {noop} from 'rxjs';

@Component({
  selector: 'app-viewport-hover-page',
  template: '',
  imports: [FormsModule],
})
export class ViewportHoverPageComponent {

  constructor() {
    // Contribute the menu.
    contributeMenu('menu:testee', menu => {
      for (let i = 0; i < 20; i++) {
        menu.addMenuItem({label: `Menu Item ${i}`, onSelect: noop});
      }
    });

    // Open the menu.
    inject(SciMenuService).open('menu:testee', {
      anchor: {x: window.innerWidth / 2, y: 100},
      filter: true,
      maxHeight: '300px',
    });
  }
}
