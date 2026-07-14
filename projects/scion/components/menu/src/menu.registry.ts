/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Disposable} from '@scion/toolkit/types';
import {SciMenuContribution, SciMenuContributionLocationLike, SciMenuContributionOptions, SciMenuFactoryFnLike} from './menu-contribution.model';
import {SciMenuItemLike} from './menu.model';
import {SciMenuOptions, SciMenuRef} from './menu.service';
import {ɵSciMenuRegistry} from './ɵmenu.registry';
import {Injectable, Injector, Signal} from '@angular/core';
import {SciKeyboardAccelerator} from './menu-accelerators';

// TODO [menu] documentation
@Injectable({providedIn: 'root', useExisting: ɵSciMenuRegistry})
export abstract class SciMenuRegistry {

  public abstract contributeMenu(locationLike: SciMenuContributionLocationLike, factoryFn: SciMenuFactoryFnLike, options: SciMenuContributionOptions): Disposable;

  public abstract menuContributions(location: Signal<`menu:${string}` | `toolbar:${string}` | `menubar:${string}`>, context: Signal<Map<string, unknown>>, options: {injector?: Injector; metadata?: {[key: string]: unknown}}): Signal<SciMenuContribution[]>;

  public abstract menuItems(location: Signal<`menu:${string}` | `toolbar:${string}` | `menubar:${string}`>, context: Signal<Map<string, unknown>>, options: {injector?: Injector; metadata?: {[key: string]: unknown}}): Signal<SciMenuItemLike[]>;

  public abstract openMenu(menu: `menu:${string}` | SciMenuItemLike[], options: SciMenuOptions): SciMenuRef;

  public abstract closeMenus(): void;

  /**
   * Gets installed keyboard accelerators for menu items that match the given context.
   *
   * A match does not require an identical context. All common context keys must have identical context values.
   */
  public abstract accelerators(context: Signal<Map<string, unknown>>): Signal<SciKeyboardAccelerator[]>;
}
