/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {SciAccordionModule} from '@scion/components.internal/accordion';
import {SciCheckboxModule} from '@scion/components.internal/checkbox';
import {SciFormFieldModule} from '@scion/components.internal/form-field';
import {RouterModule, Routes} from '@angular/router';
import {SciAccordionPageComponent} from './sci-accordion-page.component';
import {ReactiveFormsModule} from '@angular/forms';

const routes: Routes = [
  {path: '', component: SciAccordionPageComponent},
];

@NgModule({
  imports: [
    CommonModule,
    SciAccordionModule,
    SciFormFieldModule,
    SciCheckboxModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    SciAccordionPageComponent,
  ],
})
export class SciAccordionPageModule {
}
