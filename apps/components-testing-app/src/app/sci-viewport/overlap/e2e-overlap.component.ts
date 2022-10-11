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
import {SciViewportModule} from '@scion/components/viewport';

@Component({
  selector: 'e2e-overlap',
  templateUrl: './e2e-overlap.component.html',
  styleUrls: ['./e2e-overlap.component.scss'],
  standalone: true,
  imports: [
    SciViewportModule,
  ],
})
export class E2eOverlapComponent {

  public onClick(): void {
    console.debug('[E2eOverlapComponent] Button clicked');
  }
}
