import {provideTableStorage} from '@scion/components/table';
import {booleanAttribute, EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';

/**
 * Provides a {@link SciTableStorage} which does nothing.
 */
export function provideNullTableStorage(): EnvironmentProviders {
  const tableStorageEnabled = booleanAttribute(new URL(window.location.href).searchParams.get('sci-table-storage'));
  if (!tableStorageEnabled) {
    console.info(`[SciTable] Storage disabled. Storage can be enabled by setting the 'sci-table-storage' query parameter.`);

    return provideTableStorage(class {
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
