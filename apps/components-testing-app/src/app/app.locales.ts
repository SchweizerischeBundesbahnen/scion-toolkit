/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {EnvironmentProviders, makeEnvironmentProviders, provideEnvironmentInitializer} from '@angular/core';
import {registerLocaleData} from '@angular/common';
import localeDeCH from '@angular/common/locales/de-CH';
import localeFrCH from '@angular/common/locales/fr-CH';
import localeItCH from '@angular/common/locales/it-CH';

/**
 * Provides locales to format dates and times in {@link SciTablePageComponent}.
 */
export function provideLocales(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideEnvironmentInitializer(() => registerLocaleData(localeDeCH)),
    provideEnvironmentInitializer(() => registerLocaleData(localeFrCH)),
    provideEnvironmentInitializer(() => registerLocaleData(localeItCH)),
  ]);
}
