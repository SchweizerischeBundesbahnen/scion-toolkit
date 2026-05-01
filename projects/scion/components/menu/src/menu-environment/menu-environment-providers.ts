/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, inject, InjectionToken, Injector, Provider, Signal} from '@angular/core';
import {coerceSignal} from '@scion/components/common';
import {Arrays, Objects} from '@scion/toolkit/util';
import {SciMenuAcceleratorTargetProviderFn, SciMenuContextProviderFn, SciMenuInjectionContextProviderFn} from './menu-environment.provider';
import {coerceElement} from '@angular/cdk/coercion';

/**
 * Injects the context for menu locations and contributions based on the current injection context.
 *
 * Must be called within an injection context, or an explicit {@link Injector} passed.
 *
 * @see provideMenuContextProvider
 * @docs-private Not public API. For internal use only.
 */
export function injectMenuContext(options?: {injector?: Injector}): Signal<Map<string, unknown>> {
  const injector = options?.injector ?? inject(Injector);
  const providers = injector.get(SCI_MENU_CONTEXT_PROVIDERS, [], {optional: true});

  // Get contexts available in the current injection context.
  const contexts = providers.map(providerFn => coerceSignal(providerFn()));

  // Merge contexts.
  return computed(() => new Map(contexts.flatMap(context => [...context()])), {equal: Objects.isEqual});
}

/**
 * Injects dependency injection providers of the given menu context based on the current injection context.
 *
 * Must be called within an injection context, or an explicit {@link Injector} passed.
 *
 * @see provideMenuInjectionContextProvider
 * @docs-private Not public API. For internal use only.
 */
export function injectMenuInjectionContextProviders(menuContext: Map<string, unknown>, options?: {injector?: Injector}): Provider[] {
  const injector = options?.injector ?? inject(Injector);
  const providers = injector.get(SCI_MENU_INJECTION_CONTEXT_PROVIDERS, [], {optional: true});

  return providers.flatMap(providerFn => providerFn(menuContext));
}

/**
 * Injects accelerator targets for menu locations based on the current injection context.
 *
 * Must be called within an injection context, or an explicit {@link Injector} passed.
 *
 * @see provideMenuAcceleratorTargetProvider
 * @docs-private Not public API. For internal use only.
 */
export function injectMenuAcceleratorTargets(options?: {injector?: Injector}): Signal<Element[]> {
  const injector = options?.injector ?? inject(Injector);
  const providers = injector.get(SCI_MENU_ACCELERATOR_TARGET_PROVIDERS, [], {optional: true});

  // Get accelerator targets available in the current injection context.
  const acceleratorTargets = providers.map(providerFn => coerceSignal(providerFn()));

  // Concat accelerator targets.
  return computed(() => acceleratorTargets.flatMap(acceleratorTarget => Arrays.coerce(acceleratorTarget?.())).map(coerceElement), {equal: Objects.isEqual});
}

/**
 * Multi-DI token for registering a {@link SciMenuContextProviderFn} in a specific environment.
 *
 * @see provideMenuContextProvider
 */
export const SCI_MENU_CONTEXT_PROVIDER = new InjectionToken<SciMenuContextProviderFn[]>('SCI_MENU_CONTEXT_PROVIDER');

/**
 * DI token to inject {@link SciMenuContextProviderFn} functions based on the current injection context.
 *
 * @see injectMenuContext
 */
export const SCI_MENU_CONTEXT_PROVIDERS = new InjectionToken<SciMenuContextProviderFn[]>('SCI_MENU_CONTEXT_PROVIDERS');

/**
 * Multi-DI token for registering a {@link SciMenuInjectionContextProviderFn} in a specific environment.
 *
 * @see provideMenuInjectionContextProvider
 */
export const SCI_MENU_INJECTION_CONTEXT_PROVIDER = new InjectionToken<SciMenuInjectionContextProviderFn[]>('SCI_MENU_INJECTION_CONTEXT_PROVIDER');

/**
 * DI token to inject {@link SciMenuInjectionContextProviderFn} functions based on the current injection context.
 *
 * @see injectMenuInjectionContextProviders
 */
export const SCI_MENU_INJECTION_CONTEXT_PROVIDERS = new InjectionToken<SciMenuInjectionContextProviderFn[]>('SCI_MENU_INJECTION_CONTEXT_PROVIDERS');

/**
 * Multi-DI token for registering a {@link SciMenuAcceleratorTargetProviderFn} in a specific environment.
 *
 * @see provideMenuAcceleratorTargetProvider
 */
export const SCI_MENU_ACCELERATOR_TARGET_PROVIDER = new InjectionToken<SciMenuAcceleratorTargetProviderFn[]>('SCI_MENU_ACCELERATOR_TARGET_PROVIDER');

/**
 * DI token to inject {@link SciMenuAcceleratorTargetProviderFn} functions based on the current injection context.
 *
 * @see injectMenuAcceleratorTargets
 */
export const SCI_MENU_ACCELERATOR_TARGET_PROVIDERS = new InjectionToken<SciMenuAcceleratorTargetProviderFn[]>('SCI_MENU_ACCELERATOR_TARGET_PROVIDERS');
