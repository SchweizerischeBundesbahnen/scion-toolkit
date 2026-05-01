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
 * Creates a {@link DestroyableInjector} bound to the lifecycle of its parent injector. Defaults to the current injector if not configuring a parent injector.
 *
 * Unlike injectors created via {@link Injector.create}, the returned injector:
 * - Is automatically destroyed with its parent, also if used outside a component injection context.
 * - Does not throw an error when invoking {@link DestroyableInjector.destroy} if already destroyed.
 * - Uses the current injection context as parent if no explicit parent injector is specified.
 *
 * @param options - Configures the injector.
 * @param options.parent - Specifies the parent injector. Defaults to the current injector.
 * @param options.providers - Specifies providers to associate with the injector.
 * @param options.name - Names the injector, useful for debugging the injector hierarchy.
 */
export function createDestroyableInjector(options?: {parent?: Injector; providers?: Provider[]; name?: string}): DestroyableInjector {
  const parentInjector = options?.parent ?? inject(Injector);
  const injector = Injector.create({parent: parentInjector, providers: options?.providers ?? [], name: options?.name});

  // Destroy injector manually since not destroyed when the parent injector is destroyed.
  // Angular only destroys child injectors in the scope of a component injector.
  parentInjector.get(DestroyRef).onDestroy(() => injector.destroy());

  // Patch `Injector.destroy` to not error if already destroyed.
  const realDestroyFn = injector.destroy;
  const destroyRef = injector.get(DestroyRef);
  injector.destroy = () => !destroyRef.destroyed && realDestroyFn.apply(injector);
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
