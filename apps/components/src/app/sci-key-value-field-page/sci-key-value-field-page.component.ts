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
import {FormArray, FormBuilder} from '@angular/forms';
import {SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';
import {Dictionary} from '@scion/toolkit/util';
import {JsonPipe} from '@angular/common';

@Component({
  selector: 'sci-key-value-field-page',
  templateUrl: './sci-key-value-field-page.component.html',
  styleUrls: ['./sci-key-value-field-page.component.scss'],
  imports: [
    JsonPipe,
    SciKeyValueFieldComponent,
  ],
})
export default class SciKeyValueFieldPageComponent {

  public formArray: FormArray;
  public output: Dictionary | null = null;

  constructor(fb: FormBuilder) {
    this.formArray = fb.array([]);
  }

  public onPrint(): void {
    this.output = SciKeyValueFieldComponent.toDictionary(this.formArray);
  }
}
