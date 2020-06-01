/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SciSashboxPageComponent } from './sci-sashbox-page.component';
import { SciCheckboxModule, SciFormFieldModule } from '@scion/toolkit.internal/widgets';
import { FormsModule } from '@angular/forms';
import { SciSashboxModule } from '@scion/toolkit/sashbox';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {path: '', component: SciSashboxPageComponent},
];

@NgModule({
  imports: [
    CommonModule,
    SciSashboxModule,
    SciFormFieldModule,
    SciCheckboxModule,
    FormsModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    SciSashboxPageComponent,
  ],
})
export class SciSashboxPageModule {
}
