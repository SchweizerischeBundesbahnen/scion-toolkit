/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationConfig} from '@angular/core';
import {provideRouter, withHashLocation} from '@angular/router';
import {provideAnimations} from '@angular/platform-browser/animations';
import {routes} from './app.routes';
import {provideTableStorage} from '../../../../projects/scion/components/table/src/table-storage';
import {SciTableStorage} from '@scion/components/table';

class TableSessionStorage implements SciTableStorage {
  public load(name: string): Promise<string | null> | string | null {
    return sessionStorage.getItem(name);
  }

  public store(name: string, value: string): Promise<void> | void {
    sessionStorage.setItem(name, value);
  }
}

/**
 * Central place to configure the application.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withHashLocation()),
    provideAnimations(),
    provideTableStorage(TableSessionStorage),
  ],
};
