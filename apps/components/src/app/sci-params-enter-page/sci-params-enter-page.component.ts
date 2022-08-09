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
import {SciParamsEnterComponent} from '@scion/components.internal/params-enter';
import {Dictionary} from '@scion/toolkit/util';

@Component({
  selector: 'sci-params-enter-page',
  templateUrl: './sci-params-enter-page.component.html',
  styleUrls: ['./sci-params-enter-page.component.scss'],
})
export class SciParamsEnterPageComponent {

  public formArray: FormArray;
  public output: Dictionary | null = null;

  constructor(fb: FormBuilder) {
    this.formArray = fb.array([]);
  }

  public onPrint(): void {
    this.output = SciParamsEnterComponent.toParamsDictionary(this.formArray);
  }
}
