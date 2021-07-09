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
import {FormArray} from '@angular/forms';
import {SciParamsEnterComponent} from '@scion/toolkit.internal/widgets';
import {Dictionary} from '@scion/toolkit/util';

@Component({
  selector: 'sci-params-enter-page',
  templateUrl: './sci-params-enter-page.component.html',
  styleUrls: ['./sci-params-enter-page.component.scss'],
})
export class SciParamsEnterPageComponent {

  public formArray = new FormArray([]);
  public output: Dictionary;

  public onPrint(): void {
    this.output = SciParamsEnterComponent.toParamsDictionary(this.formArray);
  }
}
