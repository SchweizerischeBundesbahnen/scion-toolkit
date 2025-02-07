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
import {SciDimensionDirective} from './dimension.directive';

/**
 * Provides a directive for observing changes to the size of the host element.
 *
 * @deprecated since version 19.0.0; Import standalone directive instead; API will be removed in a future release.
 *
 * @see fromDimension$
 */
@NgModule({ // TODO [Angular 20] Remove deprecated NgModule
  imports: [
    SciDimensionDirective,
  ],
  exports: [
    SciDimensionDirective,
  ],
})
export class SciDimensionModule {
}
