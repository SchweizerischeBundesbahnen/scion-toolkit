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
import {SciSplitterComponent} from './splitter.component';

/**
 * Provides a splitter, a visual element that allows the user to control the size of elements next to it.
 *
 * ### Usage:
 *
 * ```html
 * <sci-splitter (move)="onSplitterMove($event.distance)"></sci-splitter>
 * ```
 */
@NgModule({
  imports: [
    SciSplitterComponent,
  ],
  exports: [
    SciSplitterComponent,
  ],
})
export class SciSplitterModule {
}
