/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciThrobberComponent} from '@scion/components/throbber';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {NgFor} from '@angular/common';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';

@Component({
  selector: 'sci-throbber-page',
  templateUrl: './sci-throbber-page.component.html',
  styleUrls: ['./sci-throbber-page.component.scss'],
  standalone: true,
  imports: [
    NgFor,
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciThrobberComponent,
    SciCheckboxComponent,
    SciTabDirective,
    SciTabbarComponent,
  ],
})
export default class SciThrobberPageComponent implements OnInit {

  public types = ['ellipsis', 'ripple', 'roller', 'spinner'];
  public form = this._formBuilder.group({
    type: this._formBuilder.control<'ellipsis' | 'ripple' | 'roller' | 'spinner'>('spinner'),
    color: this._formBuilder.control(''),
    size: this._formBuilder.control(''),
    duration: this._formBuilder.control(''),
  });

  @ViewChild(SciThrobberComponent, {static: true, read: ElementRef})
  public throbberComponent!: ElementRef<HTMLElement>;

  constructor(private _formBuilder: NonNullableFormBuilder) {
  }

  public ngOnInit(): void {
    this.form.controls.color.setValue(this.readCssVariableDefault('--sci-throbber-color'));
    this.form.controls.size.setValue(this.readCssVariableDefault('--sci-throbber-size'));
    this.form.controls.duration.setValue(this.readCssVariableDefault('--sci-throbber-duration'));
  }

  private readCssVariableDefault(cssVariable: string): string {
    return getComputedStyle(this.throbberComponent.nativeElement).getPropertyValue(cssVariable);
  }
}
