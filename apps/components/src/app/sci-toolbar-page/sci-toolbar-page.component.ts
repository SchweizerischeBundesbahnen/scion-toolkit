/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, inputBinding, signal} from '@angular/core';
import {contributeMenu, SciToolbarComponent, SciToolbarFactory} from '@scion/components/menu';
import {CustomToolbarIconComponent} from './custom-toolbar-icon/custom-toolbar-icon.component';
import {SciComponentDescriptor} from '@scion/components/common';

@Component({
  selector: 'sci-toolbar-page',
  templateUrl: './sci-toolbar-page.component.html',
  styleUrls: ['./sci-toolbar-page.component.scss'],
  imports: [
    SciToolbarComponent,

  ],
})
export default class SciToolbarPageComponent {

  constructor() {
    this.contributeToolbar();
  }

  private contributeToolbar(): void {
    const bold = signal(false);
    const italic = signal(false);
    const underlined = signal(false);
    const strikethrough = signal(false);
    const menuItems = signal(Array.from(Array(20).keys()).map(i => i + 1));
    const activeMenuItem = signal<number | undefined>(5);
    const customToolbarIconComponent: SciComponentDescriptor = {component: CustomToolbarIconComponent, bindings: [inputBinding('count', computed(() => menuItems().length))]};

    contributeMenu('toolbar:demo', toolbar => toolbar
      .addMenu({label: 'File', cssClass: 'file-menu'}, menu => menu
        .addMenuItem({label: 'New', icon: 'article', onSelect})
        .addMenuItem({label: 'Open', icon: 'folder', onSelect})
        .addMenuItem({label: 'Make a Copy', icon: 'file_copy', onSelect}),
      )
      .addGroup(group => group
        .addToolbarItem({icon: 'format_bold', checked: bold, onSelect: () => bold.update(bold => !bold)})
        .addToolbarItem({icon: 'format_italic', checked: italic, onSelect: () => italic.update(italic => !italic)})
        .addToolbarItem({icon: 'format_underlined', checked: underlined, onSelect: () => underlined.update(underlined => !underlined)}),
      )
      .addMenu({icon: 'palette', filter: true}, menu => menu
        .addGroup(group => group
          .addMenuItem({label: 'Bold', icon: 'format_bold', checked: bold, onSelect: () => bold.update(bold => !bold)})
          .addMenuItem({label: 'Italic', icon: 'format_italic', checked: italic, onSelect: () => italic.update(italic => !italic)})
          .addMenuItem({label: 'Underline', icon: 'format_underlined', checked: underlined, onSelect: () => underlined.update(underlined => !underlined)})
          .addMenuItem({label: 'Strikethrough', icon: 'strikethrough_s', checked: strikethrough, onSelect: () => strikethrough.update(strikethrough => !strikethrough)}),
        )
        .addGroup({label: 'Heading', collapsible: {collapsed: true}, actions: contributeHeadingGroupActions}, menu => menu
          .addMenuItem({icon: 'format_h1', label: 'H1', onSelect})
          .addMenuItem({icon: 'format_h2', label: 'H2', onSelect})
          .addMenuItem({icon: 'format_h3', label: 'H3', onSelect})
          .addMenuItem({icon: 'format_h4', label: 'H4', onSelect}),
        )
        .addMenu({label: 'Size', icon: 'format_size'}, menu => menu
          .addGroup(group => group
            .addMenuItem({icon: 'text_increase', label: 'Increase font size', onSelect})
            .addMenuItem({icon: 'text_decrease', label: 'Decrease font size', onSelect}),
          )
          .addMenuItem({icon: 'view_real_size', label: 'Reset font size', onSelect}),
        )
        .addMenu({label: 'Align', icon: 'format_align_center'}, menu => menu
          .addMenuItem({icon: 'format_align_left', label: 'Align left', onSelect})
          .addMenuItem({icon: 'format_align_center', label: 'Align center', onSelect})
          .addMenuItem({icon: 'format_align_right', label: 'Align right', onSelect})
          .addMenuItem({icon: 'format_align_justify', label: 'Align justify', onSelect}),
        )
        .addMenu({label: 'Style', icon: 'match_case'}, menu => menu
          .addMenuItem({icon: 'uppercase', label: 'Uppercase', onSelect})
          .addMenuItem({icon: 'lowercase', label: 'Lowercase', onSelect})
          .addMenuItem({icon: 'titlecase', label: 'Titlecase', onSelect}),
        )
        .addMenu({label: 'Rotate', icon: 'text_rotation_angledown'}, menu => menu
          .addMenuItem({icon: 'text_rotate_vertical', label: 'Rotate 90°', onSelect})
          .addMenuItem({icon: 'text_rotation_angledown', label: 'Rotate 45°', onSelect})
          .addMenuItem({icon: 'text_rotation_angleup', label: 'Rotate -45°', onSelect}),
        )
        .addMenu({icon: 'format_list_numbered', label: 'Enumeration'}, menu => menu
          .addMenuItem({icon: 'format_list_bulleted', label: 'Bullet list', onSelect})
          .addMenuItem({icon: 'format_list_numbered', label: 'Number list', onSelect}),
        ),
      )
      .addMenu({icon: customToolbarIconComponent, visualMenuHint: false, filter: true, maxHeight: '300px'}, menu => {
        menuItems().forEach(menuItem => {
          menu.addMenuItem({
            label: `Menu Item ${menuItem}`,
            active: computed(() => activeMenuItem() === menuItem),
            actions: actions => actions.addToolbarItem({
              icon: 'scion.close',
              tooltip: 'Close',
              onSelect: () => menuItems.update(menuItems => menuItems.filter(it => it !== menuItem)),
            }),
            onSelect: () => activeMenuItem.set(menuItem),
          });
        });
      })
      .addGroup(group => group
        .addToolbarItem({icon: 'undo', onSelect})
        .addToolbarItem({icon: 'redo', onSelect})
        .addToolbarItem({icon: 'content_cut', onSelect})
        .addToolbarItem({icon: 'content_copy', onSelect})
        .addToolbarItem({icon: 'content_paste', onSelect}),
      ),
    );
  }
}

function contributeHeadingGroupActions(toolbar: SciToolbarFactory): void {
  toolbar
    .addToolbarItem({icon: 'favorite', accelerator: {ctrl: true, shift: true, key: 'Enter'}, onSelect})
    .addMenu({icon: 'more_vert', visualMenuHint: false}, menu => menu
      .addMenuItem('Don\'t Show Again For This Project', onSelect)
      .addMenuItem({label: 'Don\'t Show Again', accelerator: {ctrl: true, shift: true, key: 'S'}, onSelect}),
    );
}

function onSelect(): void {
  console.log('>>> clicked');
}
