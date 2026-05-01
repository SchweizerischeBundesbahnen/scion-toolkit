/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, inject, signal} from '@angular/core';
import {contributeMenu, installMenuAccelerators, SciMenuService} from '@scion/components/menu';

@Component({
  selector: 'sci-menu-page',
  templateUrl: './sci-menu-page.component.html',
  styleUrls: ['./sci-menu-page.component.scss'],
  imports: [],
})
export default class SciMenuPageComponent {

  private readonly _menuService = inject(SciMenuService);

  constructor() {
    this.contributeContextMenu();
  }

  private contributeContextMenu(): void {
    const navigateWithSingleClick = signal(false);
    const alwaysSelectOpenedElement = signal(false);

    const dockedPinned = signal(false);
    const dockedUnpinned = signal(true);
    const undock = signal(false);
    const float = signal(false);
    const window = signal(false);

    const moveTo = signal<string | undefined>(undefined);

    contributeMenu(`menu:contextmenu`, menu => menu
      .addMenuItem({icon: 'scion.expand_all', label: 'Expand All', accelerator: {ctrl: true, key: '+', location: 'numpad'}, onSelect: () => console.log('>>> Expand All')})
      .addMenuItem({icon: 'scion.collapse_all', label: 'Collapse All', accelerator: {ctrl: true, key: '-', location: 'numpad'}, onSelect: () => console.log('>>> Collapse All')})
      .addGroup(group => group
        .addMenuItem({label: 'Navigate with Single Click', checked: navigateWithSingleClick, onSelect: () => navigateWithSingleClick.update(navigateWithSingleClick => !navigateWithSingleClick)})
        .addMenuItem({label: 'Always Select Opened Element', checked: alwaysSelectOpenedElement, onSelect: () => alwaysSelectOpenedElement.update(alwaysSelectOpenedElement => !alwaysSelectOpenedElement)},
        )
        .addGroup(group => group
          .addMenuItem({label: 'Speed Search', icon: 'scion.search', onSelect}),
        )
        .addGroup(group => group
          .addMenu({label: 'View Mode'}, menu => menu
            .addMenuItem({label: 'Docked pinned', checked: dockedPinned, onSelect: () => dockedPinned.update(value => !value)})
            .addMenuItem({label: 'Docked unpinned', checked: dockedUnpinned, onSelect: () => dockedUnpinned.update(value => !value)})
            .addMenuItem({label: 'Undock', checked: undock, onSelect: () => undock.update(value => !value)})
            .addMenuItem({label: 'Float', checked: float, onSelect: () => float.update(value => !value)})
            .addMenuItem({label: 'Window', checked: window, onSelect: () => window.update(value => !value)}),
          )
          .addMenu({label: 'Move To'}, menu => menu
            .addMenuItem({label: 'Left Top', icon: 'dock_to_left', disabled: computed(() => moveTo() === 'left_top'), onSelect: () => moveTo.set('left_top')})
            .addMenuItem({label: 'Left Bottom', icon: 'dock_to_left', disabled: computed(() => moveTo() === 'left_bottom'), onSelect: () => moveTo.set('left_bottom')})
            .addMenuItem({label: 'Bottom Left', icon: 'dock_to_bottom', disabled: computed(() => moveTo() === 'bottom_left'), onSelect: () => moveTo.set('bottom_left')})
            .addMenuItem({label: 'Bottom Right', icon: 'dock_to_bottom', disabled: computed(() => moveTo() === 'bottom_right'), onSelect: () => moveTo.set('bottom_right')})
            .addMenuItem({label: 'Right Bottom', icon: 'dock_to_right', disabled: computed(() => moveTo() === 'right_bottom'), onSelect: () => moveTo.set('right_bottom')})
            .addMenuItem({label: 'Right Top', icon: 'dock_to_right', disabled: computed(() => moveTo() === 'right_top'), onSelect: () => moveTo.set('right_top')}),
          )
          .addMenu({label: 'Resize'}, menu => menu
            .addMenuItem({label: 'Stretch to Left', onSelect})
            .addMenuItem({label: 'Stretch to Right', onSelect})
            .addMenuItem({label: 'Stretch to Top', onSelect})
            .addMenuItem({label: 'Stretch to Bottom', onSelect})
            .addMenuItem({label: 'Maximize Tool Window', onSelect}),
          ),
        )
        .addMenuItem({label: 'Remove from Sidebar', onSelect}),
      ),
    );

    installMenuAccelerators('menu:contextmenu');
  }

  protected onContextMenuOpen(event: MouseEvent): void {
    this._menuService.open('menu:contextmenu', {
      anchor: event,
    });
  }
}

function onSelect(): void {
  console.log('>>> clicked');
}
