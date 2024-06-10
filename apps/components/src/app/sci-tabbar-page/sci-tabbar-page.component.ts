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
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SplitPipe} from '../common/split.pipe';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import loremIpsum from './lorem-ipsum.json';

@Component({
  selector: 'sci-tabbar-page',
  templateUrl: './sci-tabbar-page.component.html',
  styleUrls: ['./sci-tabbar-page.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SciCheckboxComponent,
    SciTabbarComponent,
    SciTabDirective,
    SciFormFieldComponent,
    SplitPipe,
  ],
})
export default class SciTabbarPageComponent {

  protected form = this._formBuilder.group({
    shortContentTabVisible: this._formBuilder.control(true),
    longContentTabVisible: this._formBuilder.control(true),
    textareaTabVisible: this._formBuilder.control(true),
    dynamicTabs: this._formBuilder.control('Tab 1,Tab 2,Tab 3'),
    selectedTabName: this._formBuilder.control<string | undefined>(undefined),
  });

  protected loremIpsum = loremIpsum;
  protected loremIpsumShort = loremIpsum.slice(0, 495);

  @ViewChild(SciTabbarComponent, {static: true})
  private _tabbar!: SciTabbarComponent;

  constructor(private _formBuilder: NonNullableFormBuilder) {
  }

  protected onActivateTab(): void {
    this._tabbar.activateTab(this.form.controls.selectedTabName.value);
  }
}
