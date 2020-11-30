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
    path: 'sci-viewport',
    loadChildren: (): any => import('./sci-viewport-page/sci-viewport-page.module').then(m => m.SciViewportPageModule),
    data: {internal: false},
  },
  {
    path: 'sci-sashbox',
    loadChildren: (): any => import('./sci-sashbox-page/sci-sashbox-page.module').then(m => m.SciSashboxPageModule),
    data: {internal: false},
  },
  {
    path: 'sci-form-field',
    loadChildren: (): any => import('./sci-form-field-page/sci-form-field-page.module').then(m => m.SciFormFieldPageModule),
    data: {internal: true},
  },
  {
    path: 'sci-list',
    loadChildren: (): any => import('./sci-list-page/sci-list-page.module').then(m => m.SciListPageModule),
    data: {internal: true},
  },
  {
    path: 'sci-accordion',
    loadChildren: (): any => import('./sci-accordion-page/sci-accordion-page.module').then(m => m.SciAccordionPageModule),
    data: {internal: true},
  },
  {
    path: 'sci-qualifier-chip-list',
    loadChildren: (): any => import('./sci-qualifier-chip-list-page/sci-qualifier-chip-list-page.module').then(m => m.SciQualifierChipListPageModule),
    data: {internal: true},
  },
  {
    path: 'sci-property',
    loadChildren: (): any => import('./sci-property-page/sci-property-page.module').then(m => m.SciPropertyPageModule),
    data: {internal: true},
  },
  {
    path: 'sci-params-enter',
    loadChildren: (): any => import('./sci-params-enter-page/sci-params-enter-page.module').then(m => m.SciParamsEnterPageModule),
    data: {internal: true},
  },
  {
    path: 'sci-filter-field',
    loadChildren: (): any => import('./sci-filter-field-page/sci-filter-field-page.module').then(m => m.SciFilterFieldPageModule),
    data: {internal: true},
  },
  {
    path: 'sci-checkbox',
    loadChildren: (): any => import('./sci-checkbox-page/sci-checkbox-page.module').then(m => m.SciCheckboxPageModule),
    data: {internal: true},
  },
  {
    path: 'sci-tabbar',
    loadChildren: (): any => import('./sci-tabbar-page/sci-tabbar-page.module').then(m => m.SciTabbarPageModule),
    data: {internal: true},
  },
  {
    path: 'sci-throbber',
    loadChildren: (): any => import('./sci-throbber-page/sci-throbber-page.module').then(m => m.SciThrobberPageModule),
    data: {internal: false},
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {useHash: true})],
  exports: [RouterModule],
})
export class AppRoutingModule {
}
