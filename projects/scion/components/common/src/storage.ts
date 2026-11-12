/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {EnvironmentProviders, InjectionToken, makeEnvironmentProviders, Type} from '@angular/core';

/**
 * Provides a {@link ɵSCI_COMPONENTS_STORAGE} for dependency injection.
 */
export function provideComponentsStorage(storage: Type<SciComponentsStorage>): EnvironmentProviders {
  return makeEnvironmentProviders([
    {provide: ɵSCI_COMPONENTS_STORAGE, useClass: storage},
  ]);
}

/**
 * Provides persistent storage interface.
 */
export interface SciComponentsStorage {

  /**
   * Method invoked to load a value from persisted storage.
   */
  load(name: `scion.components:${string}`): Promise<string | null> | string | null;

  /**
   * Method invoked to write a value to persisted storage.
   */
  store(name: `scion.components:${string}`, value: string): Promise<void> | void;
}

/**
 * DI token to inject {@link SciComponentsStorage}.
 *
 * Defaults to local storage.
 */
export const ɵSCI_COMPONENTS_STORAGE = new InjectionToken<SciComponentsStorage>('ɵSCI_COMPONENTS_STORAGE', {factory: () => ({
  load: (name: `scion.components:${string}`) => localStorage.getItem(name),
  store: (name: `scion.components:${string}`, value: string) => localStorage.setItem(name, value),
})});
