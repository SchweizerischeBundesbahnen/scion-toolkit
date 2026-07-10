/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertNotInReactiveContext, computed, effect, inject, Injector, untracked} from '@angular/core';
import {Disposable} from '@scion/toolkit/types';
import {ɵSciMenuService} from './ɵmenu.service';
import {SciMenubarContributionLocation, SciMenubarFactoryFn, SciMenuContributionLocation, SciMenuContributionLocationLike, SciMenuContributionOptions, SciMenuFactoryFn, SciMenuFactoryFnLike, SciToolbarContributionLocation, SciToolbarFactoryFn} from './menu-contribution.model';
import {assertInInjectionContext, createDestroyableInjector} from '@scion/components/common';
import {SciMenuContributionInstantProvider} from './menu-contribution-instant.provider';
import {injectMenuContext} from './menu-environment/menu-environment-providers';

/**
 * Contributes tools to a {@link SciToolbarComponent} with the given name.
 *
 * A toolbar is a horizontal or vertical container that provides quick access to context-related tools. It can contain buttons, toggles, menus, and other controls,
 * with related items grouped together.
 *
 * The toolbar calls the passed factory function with a {@link SciToolbarFactory}. The factory provides methods for populating the toolbar.
 * The factory function runs in a reactive context, running again when tracked signals change. It can call `inject` to get required dependencies.
 *
 * ```ts
 * contributeMenu('toolbar:main', (toolbar, context) => toolbar
 *   .addToolbarButton({icon: 'undo', accelerator: {ctrl: true, key: 'Z'}, tooltip: 'Undo', onSelect: () => console.log('Undo')})
 *   .addToolbarButton({icon: 'redo', accelerator: {ctrl: true, key: 'Y'}, tooltip: 'Redo', onSelect: () => console.log('Redo')})
 *   .addGroup(group => group
 *     .addToolbarButton({icon: 'content_copy', accelerator: {ctrl: true, key: 'C'}, tooltip: 'Copy', onSelect: () => console.log('Copy')})
 *     .addToolbarButton({icon: 'content_paste', accelerator: {ctrl: true, key: 'V'}, tooltip: 'Paste', onSelect: () => console.log('Paste')}),
 *   )
 *   .addToolbarMenu({icon: 'folder', tooltip: 'File'}, menu => menu
 *     .addMenuItem({icon: 'save', label: 'Save', accelerator: {ctrl: true, key: 'S'}, onSelect: () => console.log('Save')})
 *     .addMenuItem({icon: 'print', label: 'Print', accelerator: {ctrl: true, key: 'P'}, onSelect: () => console.log('Print')})
 *     .addMenu({icon: 'file_download', label: 'Export As...'}, menu => menu
 *       .addMenuItem({icon: 'picture_as_pdf', label: 'PDF Document', onSelect: () => console.log('PDF Document')})
 *       .addMenuItem({icon: 'table_view', label: 'Excel Spreadsheet', onSelect: () => console.log('Excel Spreadsheet')}),
 *     ),
 *   ),
 * );
 * ```
 *
 * A toolbar can have a context, a key/value map that describes its environment. The contribution can declare a minimal required context via {@link SciMenuContributionOptions.requiredContext}.
 * The toolbar context is passed as the second argument to the factory function.
 *
 * Multiple contributions to the same toolbar can populate it from different places in the application. Passing a {@link SciToolbarContributionLocation}
 * gives exact control over contribution placement within the toolbar. By default, toolbar items are added in contribution order.
 *
 * Menus and groups can be named to allow extension from other contributions.
 *
 * This function must be called within an injection context, or an explicit {@link Injector} passed. The contribution is disposed when the injection context or the passed injector is destroyed.
 *
 * @param location - Identifies the toolbar to contribute to. Passing a {@link SciToolbarContributionLocation} gives exact control over placement.
 * @param toolbarFactoryFn - Specifies the function to contribute tools to the toolbar. The function is called in a reactive context and can call `inject` to get required dependencies.
 * @param options - Controls contribution to the toolbar, for example, the minimal required context.
 * @returns A handle that can be used to manually dispose the contribution. The contribution is disposed automatically when the calling (or passed) injection context is destroyed.
 */
export function contributeMenu(location: `toolbar:${string}` | SciToolbarContributionLocation, toolbarFactoryFn: SciToolbarFactoryFn, options?: SciMenuContributionOptions): Disposable;

/**
 * Contributes menus to a {@link SciMenubarComponent} with the given name.
 *
 * A menubar displays a horizontal row of menus, typically placed at the top of the application.
 *
 * The menubar calls the passed factory function with a {@link SciMenubarFactory}. The factory provides methods for populating the menubar.
 * The factory function runs in a reactive context, running again when tracked signals change. It can call `inject` to get required dependencies.
 *
 * TODO [menu] Add example
 *
 * A menubar can have a context, a key/value map that describes its environment. The contribution can declare a minimal required context via {@link SciMenuContributionOptions.requiredContext}.
 * The menubar context is passed as the second argument to the factory function.
 *
 * Multiple contributions to the same menubar can populate it from different places in the application. Passing a {@link SciMenubarContributionLocation}
 * gives exact control over contribution placement within the menubar. By default, menus are added in contribution order.
 *
 * Menus and groups can be named to allow extension from other contributions.
 *
 * This function must be called within an injection context, or an explicit {@link Injector} passed. The contribution is disposed when the injection context or the passed injector is destroyed.
 *
 * @param location - Identifies the menubar to contribute to. Passing a {@link SciMenubarContributionLocation} gives exact control over placement.
 * @param menubarFactoryFn - Specifies the function to contribute menus to the menubar. The function is called in a reactive context and can call `inject` to get required dependencies.
 * @param options - Controls contribution to the menubar, for example, the minimal required context.
 * @returns A handle that can be used to manually dispose the contribution. The contribution is disposed automatically when the calling (or passed) injection context is destroyed.
 */
export function contributeMenu(location: `menubar:${string}` | SciMenubarContributionLocation, menubarFactoryFn: SciMenubarFactoryFn, options?: SciMenuContributionOptions): Disposable;

/**
 * Contributes menu items to a menu with the given name.
 *
 * A menu displays a list of related items in a popover, organized into groups and submenus.
 * It closes when a menu item is selected or on an outside click. Menu items can define a keyboard accelerator for quick access.
 *
 * The menu calls the passed factory function with a {@link SciMenuFactory}. The factory provides methods for populating the menu.
 * The factory function runs in a reactive context, running again when tracked signals change. It can call `inject` to get required dependencies.
 *
 * TODO [menu] Add example
 *
 * A menu can have a context, a key/value map that describes its environment. The contribution can declare a minimal required context via {@link SciMenuContributionOptions.requiredContext}.
 * The menu context is passed as the second argument to the factory function.
 *
 * Multiple contributions to the same menu can populate it from different places in the application. Passing a {@link SciMenuContributionLocation}
 * gives exact control over contribution placement within the menu. By default, menu items are added in contribution order.
 *
 * Menus and groups can be named to allow extension from other contributions.
 *
 * This function must be called within an injection context, or an explicit {@link Injector} passed. The contribution is disposed when the injection context or the passed injector is destroyed.
 *
 * @param location - Identifies the menu to contribute to. Passing a {@link SciMenuContributionLocation} gives exact control over placement.
 * @param menuFactoryFn - Specifies the function to contribute menu items to the menu. The function is called in a reactive context and can call `inject` to get required dependencies.
 * @param options - Controls contribution to the menu, for example, the minimal required context.
 * @returns A handle that can be used to manually dispose the contribution. The contribution is disposed automatically when the calling (or passed) injection context is destroyed.
 */
export function contributeMenu(location: `menu:${string}` | SciMenuContributionLocation, menuFactoryFn: SciMenuFactoryFn, options?: SciMenuContributionOptions): Disposable;

/** @internal */
export function contributeMenu(locationLike: string | SciMenuContributionLocationLike, factoryFn: SciMenuFactoryFnLike, options?: SciMenuContributionOptions): Disposable {
  assertNotInReactiveContext(contributeMenu, 'Call contributeMenu in a non-reactive (non-tracking) context, such as within the untracked() function.');
  if (!options?.injector) {
    assertInInjectionContext(contributeMenu, 'Must be called within an injection context, or an explicit `Injector` passed via options. Disposes the contribution when the injection context is destroyed.');
  }

  const injector = createDestroyableInjector({parent: options?.injector ?? inject(Injector)});
  const location = typeof locationLike === 'string' ? {location: locationLike} as SciMenuContributionLocationLike : locationLike;
  const menuService = injector.get(ɵSciMenuService);

  const environmentContext = injectMenuContext({injector});
  const contributionContext = computed(() => new Map([...environmentContext(), ...options?.requiredContext ?? new Map()]));

  // Each contribution is assigned an instant to maintain a stable order when the contribution context changes.
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
