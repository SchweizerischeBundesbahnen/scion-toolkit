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
import {CommonModule} from '@angular/common';
import {SciThrobberPageComponent} from './sci-throbber-page.component';
import {RouterModule} from '@angular/router';
import {SciFormFieldModule} from '@scion/components.internal/form-field';
import {ReactiveFormsModule} from '@angular/forms';
import {SciThrobberModule} from '@scion/components/throbber';

const routes = [
  {path: '', component: SciThrobberPageComponent},
];

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule.forChild(routes),
    SciFormFieldModule,
    SciThrobberModule,
  ],
  declarations: [
    SciThrobberPageComponent,
  ],
})
export class SciThrobberPageModule {
}
