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
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'sci-sash-box',
    loadChildren: (): any => import('./sci-sashbox-page/sci-sashbox-page.module').then(m => m.SciSashboxPageModule),
  },
  {
    path: 'sci-form-field',
    loadChildren: (): any => import('./sci-form-field-page/sci-form-field-page.module').then(m => m.SciFormFieldPageModule),
  },
  {
    path: 'sci-list',
    loadChildren: (): any => import('./sci-list-page/sci-list-page.module').then(m => m.SciListPageModule),
  },
  {
    path: 'sci-accordion',
    loadChildren: (): any => import('./sci-accordion-page/sci-accordion-page.module').then(m => m.SciAccordionPageModule),
  },
  {
    path: 'sci-qualifier-chip-list-page',
    loadChildren: (): any => import('./sci-qualifier-chip-list-page/sci-qualifier-chip-list-page.module').then(m => m.SciQualifierChipListPageModule),
  },
  {
    path: 'sci-property-page',
    loadChildren: (): any => import('./sci-property-page/sci-property-page.module').then(m => m.SciPropertyPageModule),
  },
  {
    path: 'sci-params-enter-page',
    loadChildren: (): any => import('./sci-params-enter-page/sci-params-enter-page.module').then(m => m.SciParamsEnterPageModule),
  },
  {
    path: 'sci-filter-field-page',
    loadChildren: (): any => import('./sci-filter-field-page/sci-filter-field-page.module').then(m => m.SciFilterFieldPageModule),
  },
  {
    path: 'sci-checkbox-page',
    loadChildren: (): any => import('./sci-checkbox-page/sci-checkbox-page.module').then(m => m.SciCheckboxPageModule),
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
