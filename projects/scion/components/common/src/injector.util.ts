/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext as ngAssertInInjectionContext, DestroyableInjector, DestroyRef, inject, Injector, Provider} from '@angular/core';

/**
 * Creates an injector that can be destroyed.
 *
 * Unlike when creating an injector using `Injector.create`, this injector also gets destroyed when the parent injector is destroyed,
 * plus, does not error when invoking destroyed if already destroyed.
 *
 * `parent`: (optional) A parent injector.
 * `name`: (optional) A developer-defined identifying name for the new injector.
 */
export function createDestroyableInjector(options?: {parent?: Injector; providers?: Provider[]; name?: string}): DestroyableInjector {
  const parentInjector = options?.parent ?? inject(Injector);
  const injector = Injector.create({parent: parentInjector, providers: options?.providers ?? [], name: options?.name});
  // Destroy injector manually as not destroyed when the parent injector is destroyed, unless used in the injection context of a component.
  parentInjector.get(DestroyRef).onDestroy(() => injector.destroy());

  const destroyFnDelegate = injector.destroy.bind(injector);
  const destroyRef = injector.get(DestroyRef);

  injector.destroy = () => {
    if (!destroyRef.destroyed) {
      destroyFnDelegate();
    }
  };
  return injector;
}

/**
 * Asserts that the current stack frame is within an injection context and has access to inject.
 *
 * Delegates to `assertInInjectionContext` from @angular/core, adding the given message to the error if the assertion fails.
 */
export function assertInInjectionContext(debugFn: Function, message: string): void { // eslint-disable-line @typescript-eslint/no-unsafe-function-type
  try {
    ngAssertInInjectionContext(debugFn);
  }
  catch {
    throw Error([`${debugFn.name}() can only be used within an injection context.`].concat(message ? message : []).join(' '));
  }
}
