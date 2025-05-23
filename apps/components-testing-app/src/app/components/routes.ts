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

export default [
  {
    path: 'sci-viewport',
    loadChildren: () => import('./sci-viewport/routes'),
  },
  {
    path: 'sci-sashbox',
    loadChildren: () => import('./sci-sashbox/routes'),
  },
  {
    path: 'sci-splitter',
    loadChildren: () => import('./sci-splitter/routes'),
  },
] satisfies Routes;
