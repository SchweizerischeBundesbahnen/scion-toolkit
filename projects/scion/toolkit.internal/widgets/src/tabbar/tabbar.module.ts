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
import {SciTabbarComponent} from './tabbar.component';
import {SciTabDirective} from './tab.directive';
import {CommonModule} from '@angular/common';
import {SciViewportModule} from '@scion/toolkit/viewport';

@NgModule({
  imports: [
    CommonModule,
    SciViewportModule,
  ],
  declarations: [
    SciTabbarComponent,
    SciTabDirective,
  ],
  exports: [
    SciTabbarComponent,
    SciTabDirective,
  ],
})
export class SciTabbarModule {
}
