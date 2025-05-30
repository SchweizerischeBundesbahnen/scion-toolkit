/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Routes} from '@angular/router';
import SciSashboxPageComponent from './sci-sashbox-page/sci-sashbox-page.component';
import SciSashboxAnimationPageComponent from './sci-sashbox-animation/sci-sashbox-animation-page.component';

export default [
  {path: '', component: SciSashboxPageComponent},
  {path: 'animation', component: SciSashboxAnimationPageComponent},
] satisfies Routes;
