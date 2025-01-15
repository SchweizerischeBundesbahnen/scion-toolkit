/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
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
  selector: 'app-viewport-overlap-page',
  templateUrl: './viewport-overlap-page.component.html',
  styleUrls: ['./viewport-overlap-page.component.scss'],
  imports: [SciViewportComponent],
})
export class ViewportOverlapPageComponent {

  protected onClick(): void {
    console.debug('[ViewportOverlapPageComponent] Button clicked');
  }
}
