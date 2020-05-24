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
import { SciListModule } from '@scion/~toolkit/widgets';
import { RouterModule, Routes } from '@angular/router';
import { SciListPageComponent } from './sci-list-page.component';

const routes: Routes = [
  {path: '', component: SciListPageComponent},
];

@NgModule({
  imports: [
    CommonModule,
    SciListModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    SciListPageComponent,
  ],
})
export class SciListPageModule {
}
