/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, signal} from '@angular/core';
import {SciViewportComponent} from '@scion/components/viewport';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-viewport-hover-page',
  templateUrl: './viewport-hover-page.component.html',
  styleUrls: ['./viewport-hover-page.component.scss'],
  imports: [SciViewportComponent, FormsModule],
})
export class ViewportHoverPageComponent {

  protected readonly verticalOverflow = signal(false);
  protected readonly horizontalOverflow = signal(false);
}
