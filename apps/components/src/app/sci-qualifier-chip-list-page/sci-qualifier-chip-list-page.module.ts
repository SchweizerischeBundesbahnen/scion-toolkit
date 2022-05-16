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
import {SciQualifierChipListModule} from '@scion/components.internal/qualifier-chip-list';
import {RouterModule, Routes} from '@angular/router';
import {SciQualifierChipListPageComponent} from './sci-qualifier-chip-list-page.component';

const routes: Routes = [
  {path: '', component: SciQualifierChipListPageComponent},
];

@NgModule({
  imports: [
    CommonModule,
    SciQualifierChipListModule,
    RouterModule.forChild(routes),
  ],
  declarations: [
    SciQualifierChipListPageComponent,
  ],
})
export class SciQualifierChipListPageModule {
}
