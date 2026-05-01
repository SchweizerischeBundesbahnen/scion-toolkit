/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, input} from '@angular/core';
import {SciIconComponent} from '@scion/components/icon';

@Component({
  selector: 'app-custom-toolbar-icon',
  templateUrl: './custom-toolbar-icon.component.html',
  styleUrls: ['./custom-toolbar-icon.component.scss'],
  imports: [
    SciIconComponent,
  ],
})
export class CustomToolbarIconComponent {

  public readonly count = input.required<number>();
}
