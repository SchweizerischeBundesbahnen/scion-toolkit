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
import { CommonModule } from '@angular/common';
import { SciThrobberComponent } from './throbber.component';
import { SciEllipsisThrobberComponent } from './ellipsis-throbber/ellipsis-throbber.component';
import { SciRippleThrobberComponent } from './ripple-throbber/ripple-throbber.component';
import { SciRollerThrobberComponent } from './roller-throbber/roller-throbber.component';
import { SciSpinnerThrobberComponent } from './spinner-throbber/spinner-throbber.component';

/**
 * Provides {@link SciThrobberComponent}, an animated graphical control to indicate the execution of an action.
 */
@NgModule({
  declarations: [
    SciThrobberComponent,
    SciEllipsisThrobberComponent,
    SciRippleThrobberComponent,
    SciRollerThrobberComponent,
    SciSpinnerThrobberComponent,
  ],
  imports: [
    CommonModule,
  ],
  exports: [
    SciThrobberComponent,
  ],
})
export class SciThrobberModule {
}
