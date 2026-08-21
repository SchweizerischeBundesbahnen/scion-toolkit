import {provideTableStorage} from '@scion/components/table';
import {EnvironmentProviders} from '@angular/core';

export function provideSessionTableStorage(): EnvironmentProviders {
  return provideTableStorage(class {
    public load(name: string): Promise<string | null> | string | null {
      return sessionStorage.getItem(name);
    }

    public store(name: string, value: string): Promise<void> | void {
      sessionStorage.setItem(name, value);
    }
  });
}
