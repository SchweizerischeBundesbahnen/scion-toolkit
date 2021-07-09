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
import {RouterModule, Routes} from '@angular/router';
import {SciFilterFieldPageComponent} from './sci-filter-field-page.component';
import {SciCheckboxModule, SciFilterFieldModule, SciFormFieldModule} from '@scion/toolkit.internal/widgets';
import {FormsModule} from '@angular/forms';

const routes: Routes = [
  {path: '', component: SciFilterFieldPageComponent},
];

@NgModule({
  imports: [
    CommonModule,
    SciFilterFieldModule,
    FormsModule,
    RouterModule.forChild(routes),
    SciCheckboxModule,
    SciFormFieldModule,
  ],
  declarations: [
    SciFilterFieldPageComponent,
  ],
})
export class SciFilterFieldPageModule {
}
