/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Routes} from '@angular/router';
import {ViewportFocusPageComponent} from './focus/viewport-focus-page.component';
import {ViewportOverlapPageComponent} from './overlap/viewport-overlap-page.component';
import {ViewportHoverPageComponent} from './hover/viewport-hover-page.component';

export const routes: Routes = [
  {path: 'focus', component: ViewportFocusPageComponent},
  {path: 'overlap', component: ViewportOverlapPageComponent},
  {path: 'hover', component: ViewportHoverPageComponent},
];
