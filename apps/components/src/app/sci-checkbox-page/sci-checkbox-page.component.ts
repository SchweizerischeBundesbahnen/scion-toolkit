/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component} from '@angular/core';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';

@Component({
  selector: 'sci-checkbox-page',
  templateUrl: './sci-checkbox-page.component.html',
  styleUrls: ['./sci-checkbox-page.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SciCheckboxComponent,
    SciFormFieldComponent,
    SciTabDirective,
    SciTabbarComponent,
  ],
})
export default class SciCheckboxPageComponent {

  protected form = this._formBuilder.group({
    checkbox: this._formBuilder.control<boolean>(true),
    state: this._formBuilder.group({
      disabled: this._formBuilder.control<boolean>(false),
    }),
  });

  constructor(private _formBuilder: NonNullableFormBuilder) {
    this.installCheckboxDisabler();
  }

  private installCheckboxDisabler(): void {
    this.form.controls.state.controls.disabled.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(disabled => {
        if (disabled) {
          this.form.controls.checkbox.disable();
        }
        else {
          this.form.controls.checkbox.enable();
        }
      });
  }
}
