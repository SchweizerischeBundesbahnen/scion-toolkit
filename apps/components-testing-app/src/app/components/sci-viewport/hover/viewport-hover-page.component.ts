/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component} from '@angular/core';
import {SciViewportComponent} from '@scion/components/viewport';

@Component({
  selector: 'e2e-viewport-hover-page',
  templateUrl: './viewport-hover-page.component.html',
  styleUrls: ['./viewport-hover-page.component.scss'],
  standalone: true,
  imports: [SciViewportComponent],
})
export class ViewportHoverPageComponent {
}
