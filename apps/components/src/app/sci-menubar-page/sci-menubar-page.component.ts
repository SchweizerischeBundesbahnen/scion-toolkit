/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component} from '@angular/core';
import {contributeMenu, SciMenubarComponent} from '@scion/components/menu';

@Component({
  selector: 'sci-menubar-page',
  templateUrl: './sci-menubar-page.component.html',
  styleUrls: ['./sci-menubar-page.component.scss'],
  imports: [
    SciMenubarComponent,
  ],
})
export default class SciMenubarPageComponent {

  constructor() {
    this.contributeMenubar();
  }

  private contributeMenubar(): void {
    contributeMenu('menubar:demo', menubar => menubar
      .addMenu('Menu 1', menu => menu
        .addMenuItem('Menu 1a', onSelect)
        .addMenuItem('Menu 1b', onSelect)
        .addMenuItem('Menu 1c', onSelect),
      )
      .addMenu({label: 'Menu 2'}, menu => menu
        .addMenuItem('Menu 2a', onSelect)
        .addMenu('Menu 2b', menu => menu
          .addMenuItem('Submenu 1', onSelect)
          .addMenuItem('Submenu 2', onSelect)
          .addMenuItem('Submenu 3', onSelect),
        )
        .addMenuItem('Menu 2c', onSelect),
      )
      .addMenu('Menu 3', menu => menu
        .addMenuItem('Menu 3a', onSelect)
        .addMenuItem('Menu 3b', onSelect)
        .addMenuItem('Menu 3c', onSelect),
      ),
    );

    contributeMenu({location: 'menubar:demo', position: 'start'}, menu => menu
      .addMenu({label: 'File', name: 'menu:file', filter: {placeholder: 'Filter files', notFoundText: 'No file found'}}, menu => menu
        .addMenuItem({label: 'New', icon: 'article', onSelect})
        .addMenuItem({label: 'Open', icon: 'folder', onSelect})
        .addMenuItem({label: 'Make a Copy', icon: 'file_copy', onSelect}),
      ),
    );

    contributeMenu({location: 'menu:file'}, menu => menu
      .addMenu({label: 'Share', name: 'menu:share', icon: 'person_add'}, menu => menu
        .addMenuItem({label: 'Share with others', icon: 'person_add', onSelect}),
      ),
    );

    contributeMenu({location: 'menu:share'}, menu => menu
      .addMenuItem({label: 'Publish to web', icon: 'public', onSelect}),
    );
  }
}

function onSelect(): void {
  console.log('>>> clicked');
}
