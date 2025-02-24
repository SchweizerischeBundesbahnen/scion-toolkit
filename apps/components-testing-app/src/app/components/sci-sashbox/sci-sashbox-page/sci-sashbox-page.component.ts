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
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';

@Component({
  selector: 'app-sashbox-page',
  templateUrl: './sci-sashbox-page.component.html',
  styleUrls: ['./sci-sashbox-page.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SciSashboxComponent,
    SciSashDirective,
    SciFormFieldComponent,
    SciTabDirective,
    SciTabbarComponent,
  ],
})
export default class SciSashboxPageComponent {

  protected readonly directionFormControl = inject(NonNullableFormBuilder).control<'column' | 'row'>('row');

  protected readonly sashes: Sash[] = [
    {size: '1'},
    {size: '1'},
    {size: '1'},
  ];

  protected onSashEnd(sashSizes: number[]): void {
    console.log(`[SciSashboxPageComponent:onSashEnd] ${JSON.stringify(sashSizes)}`);
  }

  protected onSashEnd2(sashSizes: {[sashKey: string]: number}): void {
    console.log(`[SciSashboxPageComponent:onSashEnd2] ${JSON.stringify(sashSizes)}`);
  }
}

export interface Sash {
  size?: string;
  minSize?: number;
  key?: string;
}
