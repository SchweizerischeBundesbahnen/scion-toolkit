import {booleanAttribute, EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';
import {provideComponentsStorage} from '@scion/components/common';

/**
 * Provides a {@link SciTableStorage} which does nothing.
 */
export function provideNullTableStorage(): EnvironmentProviders {
  const tableStorageEnabled = booleanAttribute(new URL(window.location.href).searchParams.get('sci-table-storage'));
  if (!tableStorageEnabled) {
    console.info(`[SciTable] Storage disabled. Storage can be enabled by setting the 'sci-table-storage' query parameter.`);

    return provideComponentsStorage(class {
      public load(): null {
        return null;
      }

      public store(): void {
        // NOOP
      }
    });
  }

  return makeEnvironmentProviders([]);
}
