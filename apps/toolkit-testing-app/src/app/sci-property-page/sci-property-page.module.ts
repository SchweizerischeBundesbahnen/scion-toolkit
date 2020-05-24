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
import { SciPropertyModule } from '@scion/ɵtoolkit/widgets';
import { RouterModule, Routes } from '@angular/router';
import { SciPropertyPageComponent } from './sci-property-page.component';

const routes: Routes = [
  {path: '', component: SciPropertyPageComponent},
];

@NgModule({
  imports: [
    CommonModule,
    SciPropertyModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    SciPropertyPageComponent,
  ],
})
export class SciPropertyPageModule {
}
