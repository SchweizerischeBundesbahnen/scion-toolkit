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
import {SciViewportComponent} from './viewport.component';
import {SciScrollbarComponent} from './scrollbar/scrollbar.component';
import {SciScrollableDirective} from './scrollable.directive';

/**
 * Provides a viewport component with scrollbars that sit on top of the viewport client.
 *
 * @deprecated since version 19.0.0; Import standalone components and directive instead; API will be removed in a future release.
 */
@NgModule({
  imports: [
    SciViewportComponent,
    SciScrollbarComponent,
    SciScrollableDirective,
  ],
  exports: [
    SciViewportComponent,
    SciScrollbarComponent,
    SciScrollableDirective,
  ],
})
export class SciViewportModule {
}
