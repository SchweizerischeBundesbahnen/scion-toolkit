/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ViewChild} from '@angular/core';
import {SciTabbarComponent} from '@scion/components.internal/tabbar';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'sci-tabbar-page',
  templateUrl: './sci-tabbar-page.component.html',
  styleUrls: ['./sci-tabbar-page.component.scss'],
})
export class SciTabbarPageComponent {

  public shortContentTabVisible = new FormControl(true);
  public longContentTabVisible = new FormControl(true);
  public textareaTabVisible = new FormControl(true);
  public dynamicTabs = new FormControl('Tab 1,Tab 2,Tab 3');
  public selectedTabName = new FormControl();

  @ViewChild(SciTabbarComponent, {static: true})
  public tabbar!: SciTabbarComponent;

  public onActivateTab(): void {
    this.tabbar.activateTab(this.selectedTabName.value);
  }
}
