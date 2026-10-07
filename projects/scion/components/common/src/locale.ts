/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {inject, InjectionToken, LOCALE_ID, signal, WritableSignal} from '@angular/core';

/**
 * DI token providing the current locale to SCION components for localizing dates and numbers.
 *
 * Defaults to {@link LOCALE_ID}. Changing the locale updates formatting in SCION components, unless overridden at the component level.
 *
 * Change the locale at runtime as follows:
 * ```ts
 * inject(SCI_LOCALE).set('de-CH');
 * ```
 *
 * Angular includes only `en-US` by default. Register other locales via `registerLocaleData()`, typically in an environment initializer at app startup:
 *
 * ```ts
 * import {bootstrapApplication} from '@angular/platform-browser';
 * import {provideEnvironmentInitializer} from '@angular/core';
 * import {registerLocaleData} from '@angular/common';
 *
 * import localeDeCH from '@angular/common/locales/de-CH';
 * import localeFrCH from '@angular/common/locales/fr-CH';
 * import localeItCH from '@angular/common/locales/it-CH';
 *
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideEnvironmentInitializer(() => {
 *       registerLocaleData(localeDeCH);
 *       registerLocaleData(localeFrCH);
 *       registerLocaleData(localeItCH);
 *     }),
 *   ],
 * });
 * ```
 */
export const SCI_LOCALE = new InjectionToken<WritableSignal<string>>('SCI_LOCALE', {
  providedIn: 'root',
  factory: () => signal(inject(LOCALE_ID)),
});
