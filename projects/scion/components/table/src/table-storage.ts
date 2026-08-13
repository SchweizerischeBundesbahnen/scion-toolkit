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
 * Provides persistent storage for the sci-table.
 */
export interface SciTableStorage {

  /**
   * Method invoked to load a value from persisted storage.
   */
  load(name: `scion.components.table:${string}`): Promise<string | null> | string | null;

  /**
   * Method invoked to write a value to persisted storage.
   */
  store(name: `scion.components.table:${string}`, value: string): Promise<void> | void;
}

export const SCI_TABLE_STORAGE = new InjectionToken<SciTableStorage>('SCI_TABLE_STORAGE', {factory: () => ({
  load: (name: `scion.components.table:${string}`) => localStorage.getItem(name),
  store: (name: `scion.components.table:${string}`, value: string) => localStorage.setItem(name, value),
})});

/**
 * Defaults to localStorage persistence.
 * @param storage
 */
export function provideTableStorage(storage: Type<SciTableStorage>): EnvironmentProviders {
  return makeEnvironmentProviders([
    {provide: SCI_TABLE_STORAGE, useClass: storage},
  ]);
}
