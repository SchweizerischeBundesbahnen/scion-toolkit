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
      .addMenu({label: 'Menu 1'}, menu => menu
        .addMenuItem({label: 'Menu 1', onSelect})
        .addMenuItem({label: 'Menu 2', onSelect})
        .addMenuItem({label: 'Menu 3', onSelect}),
      )
      .addMenu({label: 'Menu 2'}, menu => menu
        .addMenuItem({label: 'Menu 1', onSelect})
        .addMenu({label: 'Menu 1'}, menu => menu
          .addMenuItem({label: 'Menu 1', onSelect})
          .addMenuItem({label: 'Menu 2', onSelect})
          .addMenuItem({label: 'Menu 3', onSelect}),
        )
        .addMenuItem({label: 'Menu 2', onSelect}),
      )
      .addMenu({label: 'Menu 3'}, menu => menu
        .addMenuItem({label: 'Menu 1', onSelect})
        .addMenuItem({label: 'Menu 2', onSelect})
        .addMenuItem({label: 'Menu 3', onSelect}),
      ),
    );

    contributeMenu({location: 'menubar:demo', position: 'start'}, menu => menu
      .addMenu({label: 'File', menu: {name: 'menu:file', filter: {placeholder: 'Filter files', notFoundMessage: 'No file found'}}}, menu => menu
        .addMenuItem({label: 'New', icon: 'scion.add', onSelect})
        .addMenuItem({label: 'Open', icon: 'folder_open', onSelect})
        .addMenuItem({label: 'Make a Copy', icon: 'scion.duplicate', onSelect}),
      ),
    );

    contributeMenu({location: 'menu:file'}, menu => menu
      .addMenu({label: 'Share', icon: 'person_add', menu: {name: 'menu:share'}}, menu => menu
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
