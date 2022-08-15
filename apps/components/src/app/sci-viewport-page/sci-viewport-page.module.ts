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
import {SciViewportPageComponent} from './sci-viewport-page.component';
import {RouterModule} from '@angular/router';
import {SciFormFieldModule} from '@scion/components.internal/form-field';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SciViewportModule} from '@scion/components/viewport';
import {CoreModule} from '../core/core.module';

const routes = [
  {path: '', component: SciViewportPageComponent},
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule.forChild(routes),
    SciFormFieldModule,
    SciViewportModule,
    CoreModule,
  ],
  declarations: [
    SciViewportPageComponent,
  ],
})
export class SciViewportPageModule {
}
