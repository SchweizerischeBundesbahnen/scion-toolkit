import {EnvironmentProviders, InjectionToken, makeEnvironmentProviders, Type} from '@angular/core';

/**
 * Provides persistent storage for the sci-table.
 */
export interface SciTableStorage {

  /**
   * Method invoked to load a value from persisted storage.
   */
  load(name: `table:${string}`): Promise<string | null> | string | null;

  /**
   * Method invoked to write a value to persisted storage.
   */
  store(name: `table:${string}`, value: string): Promise<void> | void;
}

export const SCI_TABLE_STORAGE = new InjectionToken<SciTableStorage>('SCI_TABLE_STORAGE', {factory: () => ({
  load: (name: `table:${string}`) => localStorage.getItem(name),
  store: (name: `table:${string}`, value: string) => localStorage.setItem(name, value),
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
