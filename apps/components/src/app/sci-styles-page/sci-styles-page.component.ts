/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component} from '@angular/core';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'sci-styles-page',
  templateUrl: './sci-styles-page.component.html',
  styleUrls: ['./sci-styles-page.component.scss'],
  imports: [
    SciTabbarComponent,
    SciTabDirective,
    SciMaterialIconDirective,
  ],
})
export default class SciStylesPageComponent {
}
