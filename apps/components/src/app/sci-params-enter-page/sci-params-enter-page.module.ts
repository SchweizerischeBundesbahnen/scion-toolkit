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
import {SciParamsEnterModule} from '@scion/components.internal/params-enter';
import {RouterModule, Routes} from '@angular/router';
import {SciParamsEnterPageComponent} from './sci-params-enter-page.component';
import {ReactiveFormsModule} from '@angular/forms';

const routes: Routes = [
  {path: '', component: SciParamsEnterPageComponent},
];

@NgModule({
  imports: [
    CommonModule,
    SciParamsEnterModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    SciParamsEnterPageComponent,
  ],
})
export class SciParamsEnterPageModule {
}
