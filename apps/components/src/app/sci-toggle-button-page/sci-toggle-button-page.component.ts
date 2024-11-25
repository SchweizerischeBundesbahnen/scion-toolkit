/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, inject} from '@angular/core';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciToggleButtonComponent} from '@scion/components.internal/toggle-button';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';

@Component({
  selector: 'sci-toggle-button-page',
  templateUrl: './sci-toggle-button-page.component.html',
  styleUrls: ['./sci-toggle-button-page.component.scss'],
  imports: [
    ReactiveFormsModule,
    SciToggleButtonComponent,
    SciCheckboxComponent,
    SciTabDirective,
    SciTabbarComponent,
  ],
})
export default class SciToggleButtonPageComponent {

  private readonly _formBuilder = inject(NonNullableFormBuilder);

  protected form = this._formBuilder.group({
    toggleButton: this._formBuilder.control<boolean>(true),
    state: this._formBuilder.group({
      disabled: this._formBuilder.control<boolean>(false),
    }),
  });

  constructor() {
    this.installToggleButtonDisabler();
  }

  private installToggleButtonDisabler(): void {
    this.form.controls.state.controls.disabled.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(disabled => {
        if (disabled) {
          this.form.controls.toggleButton.disable();
        }
        else {
          this.form.controls.toggleButton.enable();
        }
      });
  }
}
