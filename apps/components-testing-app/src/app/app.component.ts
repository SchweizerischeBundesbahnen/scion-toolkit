/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationRef, Component, inject} from '@angular/core';
import {RouterOutlet} from '@angular/router';

@Component({
  selector: 'app-root',
  template: '<router-outlet></router-outlet>',
  styleUrl: './app.component.scss',
  imports: [RouterOutlet],
})
export class AppComponent {

  constructor() {
    this.provideWhenAngularStable();
  }

  /**
   * Provides `window.__whenAngularStable` function for tests to wait for Angular to finish pending microtasks and stabilize.
   */
  private provideWhenAngularStable(): void {
    const applicationRef = inject(ApplicationRef);
    (window as unknown as Record<string, unknown>)['__whenAngularStable'] = async (): Promise<void> => {
      await applicationRef.whenStable();
    };
  }
}
