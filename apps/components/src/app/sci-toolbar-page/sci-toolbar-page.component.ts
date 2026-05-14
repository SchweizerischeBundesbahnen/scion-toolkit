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
import {InputToolbarControlComponent} from './input-toolbar-control/input-toolbar-control.component';

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
    const gitAction = signal('pull_rebase');
    const gitIcons = new Map<string, string>()
      .set('pull_merge', 'merge')
      .set('pull_rebase', 'download')
      .set('fetch', 'south')
      .set('fetch_all', 'keyboard_double_arrow_down')
      .set('fetch_and_prune', 'download_2');

    const gitLabels = new Map<string, string>()
      .set('pull_merge', 'Pull - Merge')
      .set('pull_rebase', 'Pull - Rebase')
      .set('fetch', 'Fetch')
      .set('fetch_all', 'Fetch All')
      .set('fetch_and_prune', 'Fetch and Prune All');

    const listStyleActive = signal(false);
    const selectedListStyle = signal('number_list');
    const listStyleIcons = new Map<string, string>()
      .set('number_list', 'format_list_numbered')
      .set('bullet_list', 'format_list_bulleted');
    const listStyleLabels = new Map<string, string>()
      .set('number_list', 'Number List')
      .set('bullet_list', 'Bullet List');

    contributeMenu('toolbar:demo', toolbar => toolbar
      .addToolbarMenu({label: 'File', cssClass: 'file-menu'}, menu => menu
        .addMenuItem({label: 'New', icon: 'article', onSelect})
        .addMenuItem({label: 'Open', icon: 'folder', onSelect})
        .addMenuItem({label: 'Make a Copy', icon: 'file_copy', onSelect}),
      )
      // TODO [menu]: Find better example for split button
      .addToolbarButton({
        icon: computed(() => gitIcons.get(gitAction())!),
        label: computed(() => gitLabels.get(gitAction())!),
        tooltip: computed(() => gitLabels.get(gitAction())!),
        accelerator: {ctrl: true, shift: true, key: 'G'},
        onSelect: () => console.log(`>>> Git Default Action: ${gitAction()}`),
      }, menu => menu
        .addMenuItem({label: 'Open Pull Dialog...', accelerator: {ctrl: true, key: 'ArrowDown'}, onSelect: () => console.log('>>> Opening Pull Dialog [Ctrl+Down]')})
        .addGroup(group => group
          .addMenuItem({icon: gitIcons.get('pull_merge'), label: 'Pull - Merge', onSelect})
          .addMenuItem({icon: gitIcons.get('pull_rebase'), label: 'Pull - Rebase', onSelect})
          .addMenuItem({icon: gitIcons.get('fetch'), label: 'Fetch', onSelect})
          .addMenuItem({icon: gitIcons.get('fetch_all'), label: 'Fetch All', onSelect})
          .addMenuItem({icon: gitIcons.get('fetch_and_prune'), label: 'Fetch and Prune All', onSelect}),
        )
        .addMenu({label: 'Set Default Pull Button Action'}, menu => menu
          .addMenuItem({checked: computed(() => gitAction() === 'pull_merge'), label: gitLabels.get('pull_merge')!, onSelect: () => setDefaultGitAction('pull_merge')})
          .addMenuItem({checked: computed(() => gitAction() === 'pull_rebase'), label: gitLabels.get('pull_rebase')!, onSelect: () => setDefaultGitAction('pull_rebase')})
          .addMenuItem({checked: computed(() => gitAction() === 'fetch'), label: gitLabels.get('fetch')!, onSelect: () => setDefaultGitAction('fetch')})
          .addMenuItem({checked: computed(() => gitAction() === 'fetch_all'), label: gitLabels.get('fetch_all')!, onSelect: () => setDefaultGitAction('fetch_all')})
          .addMenuItem({checked: computed(() => gitAction() === 'fetch_and_prune'), label: gitLabels.get('fetch_and_prune')!, onSelect: () => setDefaultGitAction('fetch_and_prune')}),
        ))
      // TODO [menu]: Find better example for checkable split button
      .addToolbarButton({
        icon: computed(() => listStyleIcons.get(selectedListStyle())!),
        tooltip: computed(() => listStyleLabels.get(selectedListStyle())!),
        checked: listStyleActive,
        onSelect: () => listStyleActive.update(active => !active),
      }, menu => menu
        .addMenuItem({icon: listStyleIcons.get('number_list'), label: listStyleLabels.get('number_list')!, onSelect: () => selectedListStyle.set('number_list')})
        .addMenuItem({icon: listStyleIcons.get('bullet_list'), label: listStyleLabels.get('bullet_list')!, onSelect: () => selectedListStyle.set('bullet_list')}))
      // TODO [menu]: Find better example for custom control
      .addToolbarControl({component: InputToolbarControlComponent, bindings: [inputBinding('placeholder', signal('Enter to filter'))]}, menu => menu
        .addMenuItem({label: 'Bold', onSelect: () => bold.update(bold => !bold)})
        .addMenuItem({label: 'Italic', onSelect: () => italic.update(italic => !italic)})
        .addMenuItem({label: 'Underline', onSelect: () => underlined.update(underlined => !underlined)})
        .addMenu({label: 'Menu'}, menu => menu),
      )
      .addGroup(group => group
        .addToolbarButton({icon: 'format_bold', checked: bold, onSelect: () => bold.update(bold => !bold)})
        .addToolbarButton({icon: 'format_italic', checked: italic, onSelect: () => italic.update(italic => !italic)})
        .addToolbarButton({icon: 'format_underlined', checked: underlined, onSelect: () => underlined.update(underlined => !underlined)}),
      )
      .addToolbarMenu({icon: 'palette', visualMenuHint: true, menu: {filter: true}}, menu => menu
        .addGroup(group => group
          .addMenuItem({label: 'Bold', checked: bold, onSelect: () => bold.update(bold => !bold)})
          .addMenuItem({label: 'Italic', checked: italic, onSelect: () => italic.update(italic => !italic)})
          .addMenuItem({label: 'Underline', checked: underlined, onSelect: () => underlined.update(underlined => !underlined)})
          .addMenuItem({label: 'Strikethrough', checked: strikethrough, onSelect: () => strikethrough.update(strikethrough => !strikethrough)}),
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
      .addToolbarMenu({icon: customToolbarIconComponent, visualMenuHint: false, menu: {filter: true, maxHeight: '300px'}}, menu => {
        menuItems().forEach(menuItem => {
          menu.addMenuItem({
            label: `Menu Item ${menuItem}`,
            active: computed(() => activeMenuItem() === menuItem),
            actions: actions => actions.addToolbarButton({
              icon: 'scion.close',
              tooltip: 'Close',
              onSelect: () => menuItems.update(menuItems => menuItems.filter(it => it !== menuItem)),
            }),
            onSelect: () => activeMenuItem.set(menuItem),
          });
        });
      })
      .addGroup(group => group
        .addToolbarButton({icon: 'undo', onSelect})
        .addToolbarButton({icon: 'redo', onSelect})
        .addToolbarButton({icon: 'content_cut', onSelect})
        .addToolbarButton({icon: 'content_copy', onSelect})
        .addToolbarButton({icon: 'content_paste', onSelect}),
      ),
    );

    function setDefaultGitAction(action: string): boolean {
      gitAction.set(action);
      return true;
    }
  }
}

function contributeHeadingGroupActions(toolbar: SciToolbarFactory): void {
  toolbar
    .addToolbarButton({icon: 'favorite', accelerator: {ctrl: true, shift: true, key: 'Enter'}, onSelect})
    .addToolbarMenu({icon: 'more_vert', visualMenuHint: false}, menu => menu
      .addMenuItem({label: 'Don\'t Show Again For This Project', onSelect})
      .addMenuItem({label: 'Don\'t Show Again', accelerator: {ctrl: true, shift: true, key: 'S'}, onSelect}),
    );
}

function onSelect(): void {
  console.log('>>> clicked');
}
