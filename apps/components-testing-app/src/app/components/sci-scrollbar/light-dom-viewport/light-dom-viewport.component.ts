/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component} from '@angular/core';
import {SciScrollableDirective, SciScrollbarComponent} from '@scion/components/viewport';

@Component({
  selector: 'app-light-dom-viewport',
  templateUrl: './light-dom-viewport.component.html',
  styleUrl: './light-dom-viewport.component.scss',
  imports: [
    SciScrollbarComponent,
    SciScrollableDirective,
  ],
})
export class LightDomViewportComponent {
}
