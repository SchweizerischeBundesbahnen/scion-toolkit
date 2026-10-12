/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {EnvironmentProviders} from '@angular/core';
import {provideComponentsStorage} from '@scion/components/common';

export function provideTableStorage(storage: Storage): EnvironmentProviders {
  return provideComponentsStorage(class {
    public load(name: string): Promise<string | null> | string | null {
      return storage.getItem(name);
    }

    public store(name: string, value: string): Promise<void> | void {
      storage.setItem(name, value);
    }
  });
}
