/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {DestroyRef, inject, InjectionToken, Injector, runInInjectionContext} from '@angular/core';
import {createDestroyableInjector} from './injector.util';
import {TestBed} from '@angular/core/testing';

describe('Injector', () => {

  it('should destroy injector when parent injector is destroyed', async () => {
    const parentInjector = Injector.create({providers: []});
    const childInjector = createDestroyableInjector({providers: [], parent: parentInjector});
    const parentDestroyRef = parentInjector.get(DestroyRef);
    const childDestroyRef = childInjector.get(DestroyRef);

    // Destroy parent injector.
    parentInjector.destroy();

    // Expect injectors to be destroyed.
    expect(parentDestroyRef.destroyed).toBeTrue();
    expect(childDestroyRef.destroyed).toBeTrue();
  });

  it('should destroy providers when parent injector is destroyed', async () => {
    const parentInjector = Injector.create({providers: []});

    let providerDestroyed = false;
    const TOKEN = new InjectionToken<string>('TOKEN');
    const childInjector = createDestroyableInjector({
      parent: parentInjector,
      providers: [
        {
          provide: TOKEN,
          useFactory: () => inject(DestroyRef).onDestroy(() => providerDestroyed = true),
        },
      ],
    });

    // Inject token.
    childInjector.get(TOKEN);

    // Destroy parent injector.
    parentInjector.destroy();

    // Expect provider to be destroyed.
    expect(providerDestroyed).toBeTrue();
  });

  it('should destroy providers when injector is destroyed', async () => {
    let providerDestroyed = false;
    const TOKEN = new InjectionToken<string>('TOKEN');
    const injector = createDestroyableInjector({
      parent: TestBed.inject(Injector),
      providers: [
        {
          provide: TOKEN,
          useFactory: () => inject(DestroyRef).onDestroy(() => providerDestroyed = true),
        },
      ],
    });

    // Inject token.
    injector.get(TOKEN);

    // Destroy injector.
    injector.destroy();

    // Expect provider to be destroyed.
    expect(providerDestroyed).toBeTrue();
  });

  it('should not error when destroying already destroyed injector', async () => {
    const injector = createDestroyableInjector({providers: [], parent: TestBed.inject(Injector)});

    // Destroy injector.
    injector.destroy();

    // Expect no error when destroying already destroyed injector.
    expect(() => injector.destroy()).not.toThrow();
  });

  it('should use current injector as parent injector', async () => {
    const currentInjector = Injector.create({providers: []});

    const injector = runInInjectionContext(currentInjector, () => createDestroyableInjector({providers: []}));
    const currentDestroyRef = currentInjector.get(DestroyRef);
    const childDestroyRef = injector.get(DestroyRef);

    // Destroy current injector.
    currentInjector.destroy();

    // Expect injectors to be destroyed.
    expect(currentDestroyRef.destroyed).toBeTrue();
    expect(childDestroyRef.destroyed).toBeTrue();
  });

  /**
   * Tests whether this utility is still required in upcoming Angular versions.
   */
  it('should be removed if not required anymore', async () => {
    const parentInjector = Injector.create({providers: []});

    const childInjector = Injector.create({providers: [], parent: parentInjector});
    const childDestroyRef = childInjector.get(DestroyRef);

    // Destroy parent injector.
    parentInjector.destroy();

    // Expect child injector not to be destroyed.
    expect(childDestroyRef.destroyed).toBeFalse();

    // Expect error when destroying already destroyed injector.
    expect(() => parentInjector.destroy()).toThrow();
  });
});
