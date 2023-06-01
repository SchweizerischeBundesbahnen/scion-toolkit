/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Routes} from '@angular/router';

export const routes: Routes = [
  {
    path: 'sci-viewport',
    loadComponent: () => import('./sci-viewport-page/sci-viewport-page.component'),
    data: {internal: false},
  },
  {
    path: 'sci-sashbox',
    loadComponent: () => import('./sci-sashbox-page/sci-sashbox-page.component'),
    data: {internal: false},
  },
  {
    path: 'sci-form-field',
    loadComponent: () => import('./sci-form-field-page/sci-form-field-page.component'),
    data: {internal: true},
  },
  {
    path: 'sci-list',
    loadComponent: () => import('./sci-list-page/sci-list-page.component'),
    data: {internal: true},
  },
  {
    path: 'sci-accordion',
    loadComponent: () => import('./sci-accordion-page/sci-accordion-page.component'),
    data: {internal: true},
  },
  {
    path: 'sci-qualifier-chip-list',
    loadComponent: () => import('./sci-qualifier-chip-list-page/sci-qualifier-chip-list-page.component'),
    data: {internal: true},
  },
  {
    path: 'sci-property',
    loadComponent: () => import('./sci-property-page/sci-property-page.component'),
    data: {internal: true},
  },
  {
    path: 'sci-params-enter',
    loadComponent: () => import('./sci-params-enter-page/sci-params-enter-page.component'),
    data: {internal: true},
  },
  {
    path: 'sci-filter-field',
    loadComponent: () => import('./sci-filter-field-page/sci-filter-field-page.component'),
    data: {internal: true},
  },
  {
    path: 'sci-checkbox',
    loadComponent: () => import('./sci-checkbox-page/sci-checkbox-page.component'),
    data: {internal: true},
  },
  {
    path: 'sci-tabbar',
    loadComponent: () => import('./sci-tabbar-page/sci-tabbar-page.component'),
    data: {internal: true},
  },
  {
    path: 'sci-throbber',
    loadComponent: () => import('./sci-throbber-page/sci-throbber-page.component'),
    data: {internal: false},
  },
];
