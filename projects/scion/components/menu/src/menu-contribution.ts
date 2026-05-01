/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, assertNotInReactiveContext, computed, effect, inject, Injector, untracked} from '@angular/core';
import {Disposable} from '@scion/toolkit/types';
import {ɵSciMenuService} from './ɵmenu.service';
import {SciMenubarContributionLocation, SciMenubarFactoryFn, SciMenuContributionLocation, SciMenuContributionLocationLike, SciMenuContributionOptions, SciMenuFactoryFn, SciMenuFactoryFnLike, SciToolbarContributionLocation, SciToolbarFactoryFn} from './menu-contribution.model';
import {createDestroyableInjector} from '@scion/components/common';
import {SciMenuContributionInstantProvider} from './menu-contribution-instant.provider';
import {injectMenuContext} from './menu-environment/menu-environment-providers';

/**
 * By default, the contribution will be unregistered when the current injection context is destroyed.
 */
export function contributeMenu(location: `menu:${string}` | SciMenuContributionLocation, menuFactoryFn: SciMenuFactoryFn, options?: SciMenuContributionOptions): Disposable;
export function contributeMenu(location: `toolbar:${string}` | SciToolbarContributionLocation, toolbarFactoryFn: SciToolbarFactoryFn, options?: SciMenuContributionOptions): Disposable;
export function contributeMenu(location: `menubar:${string}` | SciMenubarContributionLocation, menubarFactoryFn: SciMenubarFactoryFn, options?: SciMenuContributionOptions): Disposable;
export function contributeMenu(locationLike: string | SciMenuContributionLocationLike, factoryFn: SciMenuFactoryFnLike, options?: SciMenuContributionOptions): Disposable {
  assertNotInReactiveContext(contributeMenu, 'Call contributeMenu in a non-reactive (non-tracking) context, such as within the untracked() function.');
  if (!options?.injector) {
    assertInInjectionContext(contributeMenu);
  }

  const injector = createDestroyableInjector({parent: options?.injector ?? inject(Injector)});
  const location = typeof locationLike === 'string' ? {location: locationLike} as SciMenuContributionLocationLike : locationLike;
  const menuService = injector.get(ɵSciMenuService);

  const environmentContext = injectMenuContext({injector});
  const contributionContext = computed(() => new Map([...environmentContext(), ...options?.requiredContext ?? new Map()]));

  // Each contribution is assigned a unique contribution instant to keep its original order even if the reactive context changes.
  const contributionInstant = options?.contributionInstant ?? injector.get(SciMenuContributionInstantProvider).next();

  effect(onCleanup => {
    const requiredContext = contributionContext();

    untracked(() => {
      const contributionRef = menuService.contributeMenu(location, factoryFn, {...options, requiredContext, contributionInstant});
      onCleanup(() => contributionRef.dispose());
    });
  }, {injector});

  return {
    dispose: () => injector.destroy(),
  };
}
