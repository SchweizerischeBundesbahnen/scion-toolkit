/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ElementRef, inject, Injector, Provider, runInInjectionContext} from '@angular/core';
import {MaybeSignal} from '@scion/components/common';
import {SCI_MENU_ACCELERATOR_TARGET_PROVIDER, SCI_MENU_ACCELERATOR_TARGET_PROVIDERS, SCI_MENU_CONTEXT_PROVIDER, SCI_MENU_CONTEXT_PROVIDERS, SCI_MENU_INJECTION_CONTEXT_PROVIDER, SCI_MENU_INJECTION_CONTEXT_PROVIDERS} from './menu-environment-providers';
import {MaybeArray} from '@scion/toolkit/types';

/**
 * Registers a {@link SciMenuContextProviderFn} to provide context to menu locations and contributions.
 *
 * Provided context is applied to menu locations and contributions in the scope of the injector providing this function.
 * Individual locations and contributions can extend or override the provided context.
 *
 * Multiple providers can be registered. Providers at different injector tree levels form a hierarchy.
 *
 * @see SciMenuContextProviderFn
 */
export function provideMenuContextProvider(providerFn: SciMenuContextProviderFn): Provider[] {
  return [
    {
      provide: SCI_MENU_CONTEXT_PROVIDER,
      useValue: providerFn,
      multi: true,
    },
    {
      provide: SCI_MENU_CONTEXT_PROVIDERS,
      useFactory: (): SciMenuContextProviderFn[] => {
        // Collect providers registered in current and parent injectors.
        // Wrap function to execute in the injector of the function provider, not in the injector of the function caller.
        const injector = inject(Injector);
        return [
          ...inject(SCI_MENU_CONTEXT_PROVIDERS, {skipSelf: true, optional: true}) ?? [], // providers registered in parent injectors
          ...inject(SCI_MENU_CONTEXT_PROVIDER).map(fn => (callingInjector: Injector) => runInInjectionContext(injector, () => fn(callingInjector))), // providers registered in this injector
        ];
      },
    },
  ];
}

/**
 * Registers a {@link SciMenuInjectionContextProviderFn} to provide dependency injection tokens for a given menu context.
 *
 * Provided tokens are available for dependency injection for contributions registered in the scope of the injector providing this function.
 * Tokens can be injected in the factory passed to {@link contributeMenu}.
 *
 * Multiple providers can be registered. Providers at different injector tree levels form a hierarchy.
 *
 * @see SciMenuInjectionContextProviderFn
 */
export function provideMenuInjectionContextProvider(providerFn: SciMenuInjectionContextProviderFn): Provider[] {
  return [
    {
      provide: SCI_MENU_INJECTION_CONTEXT_PROVIDER,
      useValue: providerFn,
      multi: true,
    },
    {
      provide: SCI_MENU_INJECTION_CONTEXT_PROVIDERS,
      useFactory: (): SciMenuInjectionContextProviderFn[] => {
        // Collect providers registered in current and parent injectors.
        // Wrap function to execute in the injector of the function provider, not in the injector of the function caller.
        const injector = inject(Injector);
        return [
          ...inject(SCI_MENU_INJECTION_CONTEXT_PROVIDERS, {skipSelf: true, optional: true}) ?? [], // providers registered in parent injectors
          ...inject(SCI_MENU_INJECTION_CONTEXT_PROVIDER).map(fn => (context: Map<string, unknown>) => runInInjectionContext(injector, () => fn(context))), // providers registered in this injector
        ];
      },
    },
  ];
}

/**
 * Registers a {@link SciMenuAcceleratorTargetProviderFn} to provide accelerator targets to menu locations.
 *
 * Provided accelerator targets are available to menu locations in the scope of the injector providing this function.
 * Individual locations can override the provided targets.
 *
 * Multiple providers can be registered. Providers at different injector tree levels form a hierarchy.
 *
 * @see SciMenuAcceleratorTargetProviderFn
 */
export function provideMenuAcceleratorTargetProvider(providerFn: SciMenuAcceleratorTargetProviderFn): Provider[] {
  return [
    {
      provide: SCI_MENU_ACCELERATOR_TARGET_PROVIDER,
      useValue: providerFn,
      multi: true,
    },
    {
      provide: SCI_MENU_ACCELERATOR_TARGET_PROVIDERS,
      useFactory: (): SciMenuAcceleratorTargetProviderFn[] => {
        // Collect providers registered in current and parent injectors.
        // Wrap function to execute in the injector of the function provider, not in the injector of the function caller.
        const injector = inject(Injector);
        return [
          ...inject(SCI_MENU_ACCELERATOR_TARGET_PROVIDERS, {skipSelf: true, optional: true}) ?? [], // providers registered in parent injectors
          ...inject(SCI_MENU_ACCELERATOR_TARGET_PROVIDER).map(fn => (callingInjector: Injector) => runInInjectionContext(injector, () => fn(callingInjector))), // providers registered in this injector
        ];
      },
    },
  ];
}

/**
 * Signature of a function to provide context to menu locations and contributions.
 *
 * A menu location is a toolbar, menubar, or menu. A location or contribution can have a context (`Map`)
 * describing its environment. A contribution is eligible for a location only if the location's context fully
 * contains the contribution's context.
 *
 * Register this provider using the {@link provideMenuContextProvider} function.
 *
 * The function can call `inject` to get dependencies from the injector providing this function.
 *
 * @param callingInjector - Use to inject dependencies from the injector calling this function, e.g., the injector of the menu location.
 */
export type SciMenuContextProviderFn = (callingInjector: Injector) => MaybeSignal<Map<string, unknown> | undefined>;

/**
 * Signature of a function to provide dependency injection tokens for a given menu context.
 *
 * The passed menu context is the context of a menu location (toolbar, menubar, or menu) describing its environment.
 * Returned tokens are available for dependency injection in the menu factory passed to {@link contributeMenu}.
 *
 * Register this provider using the {@link provideMenuInjectionContextProvider} function.
 *
 * The function can call `inject` to get any required dependencies.
 */
export type SciMenuInjectionContextProviderFn = (context: Map<string, unknown>) => Provider[];

/**
 * Signature of a function to provide accelerator targets to menu locations.
 *
 * An accelerator target is a DOM element on which a menu location (toolbar, menubar, or menu) listens
 * for keyboard events for accelerators configured on menu items.
 *
 * Register this provider using the {@link provideMenuAcceleratorTargetProvider} function.
 *
 * The function can call `inject` to get dependencies from the injector providing this function.
 *
 * @param callingInjector - Use to inject dependencies from the injector calling this function, e.g., the injector of the menu location.
 */
export type SciMenuAcceleratorTargetProviderFn = (callingInjector: Injector) => MaybeSignal<MaybeArray<Element | ElementRef<Element>> | undefined>;
