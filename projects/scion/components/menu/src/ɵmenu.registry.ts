/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationRef, assertNotInReactiveContext, computed, DestroyableInjector, DestroyRef, inject, Injectable, Injector, Provider, runInInjectionContext, signal, Signal, untracked, WritableSignal} from '@angular/core';
import {SciMenuRegistry} from './menu.registry';
import {Disposable} from '@scion/toolkit/types';
import {SciMenuGroup, SciMenuItem, SciMenuItemLike} from './menu.model';
import {SciMenuOptions, SciMenuRef} from './menu.service';
import {Arrays, Maps, Objects, prune} from '@scion/toolkit/util';
import {ɵSciMenuFactory} from './menu/ɵmenu.factory';
import {ɵSciToolbarFactory} from './toolbar/ɵtoolbar.factory';
import {sortMenuItems} from './menu-item-sorter';
import {SciMenubarFactoryFn, SciMenuContribution, SciMenuContributionLocationLike, SciMenuContributionOptions, SciMenuContributionPositionLike, SciMenuFactoryFn, SciMenuFactoryFnLike, SciToolbarFactoryFn} from './menu-contribution.model';
import {assertInInjectionContext, createDestroyableInjector} from '@scion/components/common';
import {SciMenuAdapter} from './menu-adapter.model';
import {SciMenuContributionInstantProvider} from './menu-contribution-instant.provider';
import {ɵSciMenuService} from './ɵmenu.service';
import {SciMenuOpener} from './menu-opener.service';
import {ɵSciMenubarFactory} from './menubar/ɵmenubar.factory';
import {collectMenuItemsWithAccelerator, SciKeyboardAccelerator} from './menu-accelerators';
import {POPOVER_REFS} from './menu/popover-ref';
import {injectMenuInjectionContextProviders} from './menu-environment/menu-environment-providers';

@Injectable({providedIn: 'root'})
export class ɵSciMenuRegistry implements SciMenuRegistry, SciMenuAdapter {

  private readonly _contributions = new Map<`menu:${string}` | `toolbar:${string}` | `menubar:${string}`, WritableSignal<Array<SciMenuContribution>>>();
  private readonly _menuItemsCache = new MenuItemsCache();
  private readonly _contributionInstantProvider = inject(SciMenuContributionInstantProvider);
  private readonly _menuOpener = inject(SciMenuOpener);
  private readonly _menuPopovers = inject(POPOVER_REFS);
  private readonly _injector = inject(Injector);

  /** @inheritDoc */
  public contributeMenu(locationLike: SciMenuContributionLocationLike, factoryFn: SciMenuFactoryFnLike, options: SciMenuContributionOptions): Disposable {
    const {location, before, after, position} = locationLike;

    const contribution: SciMenuContribution = {
      scope: parseMenuLocationScope(location),
      factoryFn: factoryFn,
      position: prune({before, after, position} as SciMenuContributionPositionLike, {pruneIfEmpty: true}),
      requiredContext: prune(options.requiredContext) ?? new Map<string, unknown>(), // prune cleared context values
      contributionInstant: options.contributionInstant ?? this._contributionInstantProvider.next(),
      metadata: options.metadata ?? {},
    };

    if (this._contributions.has(location)) {
      this._contributions.get(location)!.update(contributions => contributions.concat(contribution));
    }
    else {
      this._contributions.set(location, signal([contribution]));
    }

    return {
      dispose: () => {
        // Retain the signal in the contribution map even if empty. Consumers may hold a reference and expect updates
        // when a new contribution is registered for this location.
        this._contributions.get(location)!.update(contributions => contributions.filter(it => it !== contribution));
        this._menuItemsCache.remove(contribution);
      },
    };
  }

  /** @inheritDoc */
  public menuContributions(location: Signal<`menu:${string}` | `toolbar:${string}` | `menubar:${string}`>, context: Signal<Map<string, unknown>>, options: {injector?: Injector; metadata?: {[key: string]: unknown}}): Signal<SciMenuContribution[]> {
    assertNotInReactiveContext(this.menuContributions, 'Call menuContributions() in a non-reactive (non-tracking) context, such as within the untracked() function.');

    return computed(() => {
      // Ensure signal is registered in the contribution map to get notified when a contribution is added to this location.
      if (!this._contributions.has(location())) {
        this._contributions.set(location(), signal([]));
      }
      const contributions = this._contributions.get(location())!();
      const callingContext = prune(context()); // prune cleared context values

      return untracked(() => contributions
        // Filter contributions not matching the calling context.
        .filter(contribution => {
          const requiredContext = contribution.requiredContext;
          for (const [requiredContextName, requiredContextValue] of requiredContext.entries()) {
            // Do not match contribution if required entry is missing.
            if (requiredContextValue === '*' && !callingContext.has(requiredContextName)) {
              return false;
            }

            // Do not match contribution if required value is different.
            if (requiredContextValue !== '*' && !Objects.isEqual(callingContext.get(requiredContextName), requiredContextValue, {ignoreArrayOrder: true})) {
              return false;
            }
          }
          return true;
        })
        // Sort by contribution instant to maintain a stable order when contributions are replaced.
        .sort((a, b) => a.contributionInstant - b.contributionInstant),
      );
    }, {equal: (a, b) => Objects.isEqual(a, b)});
  }

  /** @inheritDoc */
  public menuItems(location: Signal<`menu:${string}` | `toolbar:${string}` | `menubar:${string}`>, context: Signal<Map<string, unknown>>, options: {injector?: Injector; metadata?: {[key: string]: unknown}}): Signal<SciMenuItemLike[]> {
    assertNotInReactiveContext(this.menuItems, 'Call menuItems() in a non-reactive (non-tracking) context, such as within the untracked() function.');
    if (!options.injector) {
      assertInInjectionContext(this.menuItems, 'Call menuItems() in an injection context. It may allocate resources that are not released until the injection context is destroyed.');
    }

    const injector = options.injector ?? inject(Injector);
    const menuService = this.menuService;
    const menuItemsCache = this._menuItemsCache;

    // Get contributions matching the location.
    const menuContributions = menuService.menuContributions(location, context, options);

    // Get menu items of contributions.
    return computed(() => {
      if (!menuContributions().length) {
        return [];
      }
      const callingContext = prune(context()); // prune cleared context values
      const menuItems = menuContributions()
        // Instantiate contribution, recursively (submenus and menus in action toolbars).
        .flatMap(menuContribution => untracked(() => computeMenuItems(menuContribution, callingContext, {injector}))())
        // Remove invisible menu items, recursively.
        .flatMap(filterInvisibleMenuItems)
        // Federate menu items, recursively.
        .map(menuItem => federateMenuItems(menuItem, callingContext, {injector, metadata: options.metadata}))
        // Remove empty groups and submenus, recursively. Filtering must be after federation to not remove named placeholder groups or submenus.
        .flatMap(filterEmptyMenuItems);

      return sortMenuItems(menuItems);
    });

    /**
     * Gets the menu items of the given contribution used in the given context.
     */
    function computeMenuItems(menuContribution: SciMenuContribution, context: Map<string, unknown>, options: {injector: Injector}): Signal<SciMenuItemLike[]> {
      assertNotInReactiveContext(computeMenuItems, 'Call computeMenuItems() in a non-reactive (non-tracking) context, such as within the untracked() function.');
      // Invoked in the consumer's calling injection context (location's injection context).

      // Instantiate the contribution if absent, recursively (submenus and menus in action toolbars).
      return menuItemsCache.computeIfAbsent(menuContribution, context, () => {
        // Invoked in a dedicated root injection child context, which is destroyed when the last consumer (location) is disposed.

        // Inject dependency injection providers for the given menu context.
        const menuEnvironmentInjectionContextProviders = injectMenuInjectionContextProviders(context, {injector});
        const menuEnvironmentInjectionContext = createDestroyableInjector({parent: inject(Injector), providers: menuEnvironmentInjectionContextProviders});

        return computed(() => {
          const menuItems = (() => {
            switch (menuContribution.scope) {
              case 'menu': {
                const menuFactory = new ɵSciMenuFactory();
                const menuFactoryFn = menuContribution.factoryFn as SciMenuFactoryFn;
                runInInjectionContext(menuEnvironmentInjectionContext, () => menuFactoryFn(menuFactory, context));
                return menuFactory.menuItems;
              }
              case 'toolbar': {
                const toolbarFactory = new ɵSciToolbarFactory();
                const toolbarFactoryFn = menuContribution.factoryFn as SciToolbarFactoryFn;
                runInInjectionContext(menuEnvironmentInjectionContext, () => toolbarFactoryFn(toolbarFactory, context));
                return toolbarFactory.menuItems;
              }
              case 'menubar': {
                const menubarFactory = new ɵSciMenubarFactory();
                const menubarFactoryFn = menuContribution.factoryFn as SciMenubarFactoryFn;
                runInInjectionContext(menuEnvironmentInjectionContext, () => menubarFactoryFn(menubarFactory, context));
                return menubarFactory.menuItems;
              }
            }
          })();
          return menuItems
            // Add contribution's position to top-level menu items.
            .map(menuItem => ({...menuItem, position: menuContribution.position}))
            // Add providers to components (label, icon, control), recursively.
            .map(menuItem => provideProviders(menuItem, menuEnvironmentInjectionContextProviders));
        });
      }, {injector: options.injector});
    }

    /**
     * Federates passed menu or group with contributions based on its name. Federation is recursive.
     */
    function federateMenuItems(menuItem: SciMenuItemLike, context: Map<string, unknown>, options?: {injector?: Injector; metadata?: {[key: string]: unknown}}): SciMenuItemLike {
      const federatedItem = {...menuItem};

      // Federate actions.
      if (federatedItem.actions?.length) {
        federatedItem.actions = sortMenuItems(federatedItem.actions.map(action => federateMenuItems(action, context, options)));
      }

      // Federate group.
      if (federatedItem.type === 'group') {
        const contributions = federatedItem.name ? untracked(() => menuService.menuItems(federatedItem.name!, context, {injector: options?.injector, metadata: options?.metadata}))() : [];

        federatedItem.children = sortMenuItems([
          ...federatedItem.children.map(child => federateMenuItems(child, context, options)),
          ...contributions,
        ]);
      }

      // Federate submenu.
      if (federatedItem.type === 'menu-item' && federatedItem.menu) {
        const contributions = federatedItem.menu.name ? untracked(() => menuService.menuItems(federatedItem.menu!.name!, context, {injector: options?.injector, metadata: options?.metadata}))() : [];

        federatedItem.menu = {
          ...federatedItem.menu,
          children: sortMenuItems([
            ...federatedItem.menu.children.map(child => federateMenuItems(child, context, options)),
            ...contributions,
          ]),
        };
      }

      return federatedItem;
    }

    /**
     * Registers given providers in components (label, icon, control) of the menu item, recursively.
     */
    function provideProviders(menuItem: SciMenuItemLike, providers: Provider[]): SciMenuItemLike {
      switch (menuItem.type) {
        case 'menu-item': {
          return {
            ...menuItem,
            iconComponent: menuItem.iconComponent && {
              ...menuItem.iconComponent,
              providers: providers.concat(menuItem.iconComponent.providers ?? []),
            },
            labelComponent: menuItem.labelComponent && {
              ...menuItem.labelComponent,
              providers: providers.concat(menuItem.labelComponent.providers ?? []),
            },
            control: menuItem.control && {
              ...menuItem.control,
              providers: providers.concat(menuItem.control.providers ?? []),
            },
            actions: menuItem.actions?.map(menuItem => provideProviders(menuItem, providers)),
            menu: menuItem.menu && {
              ...menuItem.menu,
              children: menuItem.menu.children.map(menuItem => provideProviders(menuItem, providers)),
            },
          } satisfies SciMenuItem;
        }
        case 'group': {
          return {
            ...menuItem,
            children: menuItem.children.map(menuItem => provideProviders(menuItem, providers)),
            actions: menuItem.actions?.map(menuItem => provideProviders(menuItem, providers)),
          } satisfies SciMenuGroup;
        }
      }
    }
  }

  /** @inheritDoc */
  public openMenu(menu: `menu:${string}` | SciMenuItemLike[], options: SciMenuOptions): SciMenuRef {
    return this._menuOpener.openMenu(menu, options);
  }

  /** @inheritDoc */
  public closeMenus(): void {
    this._menuPopovers().forEach(popover => popover.close());
  }

  /** @inheritDoc */
  public accelerators(context: Signal<Map<string, unknown>>): Signal<SciKeyboardAccelerator[]> {
    return this._menuItemsCache.accelerators(context);
  }

  /**
   * Reference to the menu service.
   *
   * Use to call methods like {@link ɵSciMenuService.menuContributions} or {@link ɵSciMenuService.menuItems} through the adapter chain.
   */
  private get menuService(): ɵSciMenuService {
    return this._injector.get(ɵSciMenuService);
  }
}

/**
 * Recursively removes groups and submenus that contain no menu items.
 *
 * Returns a single-entry array containing the filtered menu item, or an empty array if it has no children, enabling usage in `flatMap`.
 */
function filterEmptyMenuItems(menuItem: SciMenuItemLike): [SciMenuItemLike] | [] {
  switch (menuItem.type) {
    case 'menu-item': {
      const children = menuItem.menu?.children.flatMap(filterEmptyMenuItems) ?? [];
      const actions = menuItem.actions?.flatMap(filterEmptyMenuItems);
      return children.length || menuItem.onSelect || menuItem.control ? [{...menuItem, actions, menu: menuItem.menu && {...menuItem.menu, children}}] : [];
    }
    case 'group': {
      const children = menuItem.children.flatMap(filterEmptyMenuItems);
      const actions = menuItem.actions?.flatMap(filterEmptyMenuItems);
      return children.length ? [{...menuItem, actions, children}] : [];
    }
  }
}

/**
 * Recursively removes invisible groups and submenus.
 *
 * Returns a single-entry array containing the filtered menu item, or an empty array if not visible, enabling usage in `flatMap`.
 */
function filterInvisibleMenuItems(menuItem: SciMenuItemLike): [SciMenuItemLike] | [] {
  if (!(menuItem.visible?.() ?? true)) {
    return [];
  }

  switch (menuItem.type) {
    case 'menu-item': {
      const children = menuItem.menu?.children.flatMap(filterInvisibleMenuItems) ?? [];
      const actions = menuItem.actions?.flatMap(filterInvisibleMenuItems);
      return [{...menuItem, actions, menu: menuItem.menu && {...menuItem.menu, children}}];
    }
    case 'group': {
      const actions = menuItem.actions?.flatMap(filterInvisibleMenuItems);
      const children = menuItem.children.flatMap(filterInvisibleMenuItems);
      return [{...menuItem, actions, children}];
    }
  }
}

/**
 * Parses the scope from given location. One of `menu`, `toolbar`,`menubar`.
 */
function parseMenuLocationScope(location: `menu:${string}` | `toolbar:${string}` | `menubar:${string}`): 'menu' | 'toolbar' | 'menubar' {
  return /^(?<scope>(menu|toolbar|menubar)):(?<name>.+)$/.exec(location)!.groups!['scope'] as 'menu' | 'toolbar' | 'menubar';
}

/**
 * Cache for instantiated contributions in a specific context.
 */
class MenuItemsCache {

  private readonly _cache = signal(new Set<CacheEntry>());
  private readonly _cacheByContribution = computed(() => {
    return Array.from(this._cache()).reduce((map, cacheEntry) => Maps.addListValue(map, cacheEntry.contribution, cacheEntry), new Map<SciMenuContribution, CacheEntry[]>());
  });

  /**
   * Gets the menu items of the given contribution used in the given context. Menu items are constructed via the passed factory function if absent (on cache miss).
   *
   * Menu items are cached. Cached menu items are evicted when no longer used, tracked via a reference count based on the provided injector;
   * once all tracked injectors for a cache entry are destroyed, the cache entry is evicted.
   *
   * The factory function is invoked in the root injection context, destroyed upon cache eviction.
   */
  public computeIfAbsent(contribution: SciMenuContribution, context: Map<string, unknown>, computeFn: () => Signal<SciMenuItemLike[]>, options: {injector: Injector}): Signal<SciMenuItemLike[]> {
    assertNotInReactiveContext(this.computeIfAbsent, 'Call computeIfAbsent() in a non-reactive (non-tracking) context, such as within the untracked() function.');

    const cacheEntry = this._cacheByContribution().get(contribution)?.find(cacheEntry => Objects.isEqual(cacheEntry.context, context)) ?? (() => {
      const rootInjector = options.injector.get(ApplicationRef).injector;
      const cacheEntryInjector = createDestroyableInjector({parent: rootInjector});
      const cacheEntry: CacheEntry = {
        injector: cacheEntryInjector,
        contribution,
        menuItems: runInInjectionContext(cacheEntryInjector, computeFn),
        context,
        refCount: 0,
        dispose: () => cacheEntryInjector.destroy(),
      };
      this._cache.update(cache => new Set(cache).add(cacheEntry));
      return cacheEntry;
    })();

    cacheEntry.refCount++;

    // Decrement reference count when tracked injector is destroyed.
    options.injector.get(DestroyRef).onDestroy(() => {
      if (--cacheEntry.refCount === 0) {
        // Dispose when no longer used.
        cacheEntry.dispose();
        this._cache.update(cache => {
          const cacheCopy = new Set(cache);
          cacheCopy.delete(cacheEntry);
          return cacheCopy;
        });
      }
    });

    return cacheEntry.menuItems;
  }

  /**
   * Removes menu items of the given contribution from the cache.
   */
  public remove(contribution: SciMenuContribution): void {
    assertNotInReactiveContext(this.remove, 'Call remove() in a non-reactive (non-tracking) context, such as within the untracked() function.');

    const cacheEntriesToRemove = this._cacheByContribution().get(contribution) ?? [];
    this._cache.update(cache => {
      const cacheCopy = new Set(cache);

      cacheEntriesToRemove.forEach(cacheEntry => {
        cacheEntry.dispose();
        cacheCopy.delete(cacheEntry);
      });

      return cacheCopy;
    });
  }

  /**
   * Gets keyboard accelerators for menu items installed in the application that match the given context.
   *
   * A positive match does not require an identical context, but any common context keys must map to identical context values.
   */
  public accelerators(context: Signal<Map<string, unknown>>): Signal<SciKeyboardAccelerator[]> {
    return computed(() => {
      const accelerators = Array.from(this._cache().values())
        .filter(cacheEntry => {
          for (const [name, value] of prune(context().entries())) { // prune cleared context values
            // Do not match contribution if required entry is missing.
            if (value === '*' && !cacheEntry.context.has(name)) {
              return false;
            }

            // Do not match if context key maps to a different value.
            if (value !== '*' && cacheEntry.context.has(name) && !Objects.isEqual(cacheEntry.context.get(name), value, {ignoreArrayOrder: true})) {
              return false;
            }
          }
          return true;
        })
        .flatMap(cacheEntry => collectMenuItemsWithAccelerator(cacheEntry.menuItems()))
        .filter(menuItem => !menuItem.disabled?.() && (menuItem.visible?.() ?? true))
        .map(menuItem => menuItem.accelerator!);

      // Remove duplicate accelerators.
      return Arrays.distinct(accelerators, accelerator => `${accelerator.shift}/${accelerator.ctrl}/${accelerator.alt}/${accelerator.key.toLowerCase()}/${accelerator.location}`);
    }, {equal: (a, b) => Objects.isEqual(a, b, {ignoreArrayOrder: true})});
  }
}

/**
 * Cache entry for the menu items of a contribution currently used in the application.
 */
export interface CacheEntry {
  /**
   * Reference to the contribution.
   */
  contribution: SciMenuContribution;
  /**
   * Context in which the contribution is used.
   */
  context: Map<string, unknown>;
  /**
   * Injector that was used to instantiate the contribution; destroyed when the cache entry is evicted.
   */
  injector: DestroyableInjector;
  /**
   * Menu items of the contribution.
   */
  menuItems: Signal<SciMenuItemLike[]>;
  /**
   * Reference count of injectors using this cache entry.
   */
  refCount: number;
  /**
   * Disposes this entry, destroying the {@link injector} to release allocated resources.
   */
  dispose: () => void;
}
