/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {signal, Signal} from '@angular/core';
import {coerceSignal} from './signal.util';

describe('coerceSignal', () => {

  // Do not remove type declarations to assert return type to be correct.
  it('should coerce value', async () => {
    const value1: Signal<string> = coerceSignal('value');
    expect(value1()).toEqual('value');

    const value2: Signal<string> = coerceSignal(signal('value'));
    expect(value2()).toEqual('value');

    const value3: Signal<string | undefined> = coerceSignal(signal<string | undefined>('value'));
    expect(value3()).toEqual('value');
  });

  // Do not remove type declarations to assert return type to be correct.
  it('should not coerce `undefined`', async () => {
    const value: Signal<string> | undefined = coerceSignal(undefined as unknown as string | undefined);
    expect(value).toBeUndefined();
  });

  // Do not remove type declarations to assert return type to be correct.
  it('should coerce `undefined` if `coerceUndefined` flag is set', async () => {
    const value: Signal<string | undefined> = coerceSignal(undefined as unknown as string | undefined, {coerceUndefined: true});
    expect(value()).toBeUndefined();
  });

  // Do not remove type declarations to assert return type to be correct.
  it('should coerce `signal(undefined)`', async () => {
    const value1: Signal<string | undefined> = coerceSignal(signal<string | undefined>(undefined));
    expect(value1()).toBeUndefined();

    const value2: Signal<string | undefined> = coerceSignal(signal<string | undefined>(undefined), {coerceUndefined: true});
    expect(value2()).toBeUndefined();
  });
});
