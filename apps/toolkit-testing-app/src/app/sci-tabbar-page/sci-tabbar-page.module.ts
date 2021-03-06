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
import { SciTabbarPageComponent } from './sci-tabbar-page.component';
import { RouterModule } from '@angular/router';
import { SciCheckboxModule, SciFormFieldModule, SciTabbarModule } from '@scion/toolkit.internal/widgets';
import { ReactiveFormsModule } from '@angular/forms';
import { SplitPipe } from './split.pipe';

const routes = [
  {path: '', component: SciTabbarPageComponent},
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SciCheckboxModule,
    SciFormFieldModule,
    SciTabbarModule,
  ],
  declarations: [
    SciTabbarPageComponent,
    SplitPipe,
  ],
})
export class SciTabbarPageModule {
}
