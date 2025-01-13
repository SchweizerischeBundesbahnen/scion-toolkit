/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, inject} from '@angular/core';
import {FormGroup, NonNullableFormBuilder} from '@angular/forms';
import {KeyValueEntry, SciKeyValueFieldComponent} from '@scion/components.internal/key-value-field';
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

  public readonly formArray = inject(NonNullableFormBuilder).array<FormGroup<KeyValueEntry>>([]);
  public output: Dictionary | null = null;

  public onPrint(): void {
    this.output = SciKeyValueFieldComponent.toDictionary(this.formArray);
  }
}
