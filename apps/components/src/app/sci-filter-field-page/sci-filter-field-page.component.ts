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
import {NgIf} from '@angular/common';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'sci-filter-field-page',
  templateUrl: './sci-filter-field-page.component.html',
  styleUrls: ['./sci-filter-field-page.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    SciFilterFieldComponent,
    SciFormFieldComponent,
    SciCheckboxComponent,
  ],
})
export default class SciFilterFieldPageComponent {

  public output: string | null = null;

  public disabled = false;

  public onFilter(filterText: string): void {
    this.output = filterText;
  }
}
