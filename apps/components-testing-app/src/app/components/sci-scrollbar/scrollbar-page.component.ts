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
import {ShadowDomViewportComponent} from './shadow-dom-viewport/shadow-dom-viewport.component';
import {LightDomViewportComponent} from './light-dom-viewport/light-dom-viewport.component';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-scrollbar-page',
  templateUrl: './scrollbar-page.component.html',
  styleUrl: './scrollbar-page.component.scss',
  imports: [
    ShadowDomViewportComponent,
    LightDomViewportComponent,
    FormsModule,
  ],
  host: {
    '[style.--vertical-viewport-overflow]': 'verticalViewportOverflow()',
    '[style.--horizontal-viewport-overflow]': 'horizontalViewportOverflow()',
  },
})
export class ScrollbarPageComponent {

  protected readonly verticalViewportOverflow = signal(true);
  protected readonly horizontalViewportOverflow = signal(false);
}
