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
import {SciFilterFieldComponent} from '@scion/components.internal/filter-field';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';

@Component({
  selector: 'sci-filter-field-page',
  templateUrl: './sci-filter-field-page.component.html',
  styleUrls: ['./sci-filter-field-page.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciFilterFieldComponent,
    SciCheckboxComponent,
    SciTabDirective,
    SciTabbarComponent,
  ],
})
export default class SciFilterFieldPageComponent {

  protected filterText: string | null = null;

  public form = this._formBuilder.group({
    filterField: this._formBuilder.control<string>(''),
    state: this._formBuilder.group({
      disabled: this._formBuilder.control<boolean>(false),
    }),
  });

  constructor(private _formBuilder: NonNullableFormBuilder) {
    this.installFilterFieldDisabler();
    this.installFilterFieldValuePrinter();
  }

  private installFilterFieldDisabler(): void {
    this.form.controls.state.controls.disabled.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(disabled => {
        if (disabled) {
          this.form.controls.filterField.disable();
        }
        else {
          this.form.controls.filterField.enable();
        }
      });
  }

  private installFilterFieldValuePrinter(): void {
    this.form.controls.filterField.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(filterText => {
        this.filterText = filterText;
      });
  }
}
