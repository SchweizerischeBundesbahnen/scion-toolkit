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
import {NgFor, NgIf} from '@angular/common';

@Component({
  selector: 'sci-tabbar-page',
  templateUrl: './sci-tabbar-page.component.html',
  styleUrls: ['./sci-tabbar-page.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    ReactiveFormsModule,
    SciCheckboxComponent,
    SciTabbarComponent,
    SciTabDirective,
    SciFormFieldComponent,
    SplitPipe,
  ],
})
export default class SciTabbarPageComponent {

  public form = this._formBuilder.group({
    shortContentTabVisible: this._formBuilder.control(true),
    longContentTabVisible: this._formBuilder.control(true),
    textareaTabVisible: this._formBuilder.control(true),
    dynamicTabs: this._formBuilder.control('Tab 1,Tab 2,Tab 3'),
    selectedTabName: this._formBuilder.control<string | undefined>(undefined),
  });

  @ViewChild(SciTabbarComponent, {static: true})
  public tabbar!: SciTabbarComponent;

  constructor(private _formBuilder: NonNullableFormBuilder) {
  }

  public onActivateTab(): void {
    this.tabbar.activateTab(this.form.controls.selectedTabName.value);
  }
}
