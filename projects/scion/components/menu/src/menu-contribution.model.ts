/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciMenuFactory} from './menu/menu.factory';
import {SciToolbarFactory} from './toolbar/toolbar.factory';
import {Injector} from '@angular/core';
import {OneOf} from '@scion/toolkit/types';
import {SciMenubarFactory} from './menubar/menubar.factory';

/**
 * Represents a menu contribution contributed via {@link contributeMenu}.
 */
export interface SciMenuContribution {
  /** Type of this contribution, indicating whether contributing to a menu, toolbar, or menubar. */
  type: 'menu' | 'toolbar' | 'menubar';
  /** Factory function to instantiate menu items of this contribution. */
  factoryFn: SciMenuFactoryFnLike;
  /** Minimal context required by this contribution. */
  requiredContext: Map<string, unknown>;
  /** Position where to insert menu items of this contribution. */
  position?: SciMenuContributionPositionLike;
  /** Instant when this contribution was registered. */
  contributionInstant: number;
  /** Arbitrary metadata associated with this contribution. */
  metadata: {[key: string]: unknown};
}

/**
 * Controls contribution to a menu location.
 */
export interface SciMenuContributionOptions {
  /**
   * Declares a minimal required context.
   *
   * The contribution is only applied if the context of the menu location contains at least the specified key/value pairs.
   * Context requirements can be defined using explicit values or an asterisk (`*`) to require any value for a given context key.
   *
   * @example - Contribute only for administrators within an active project context
   * ```ts
   * requiredContext: new Map()
   *   .set('userRole', 'admin')
   *   .set('activeProjectId', '*')
   * ```
   *
   * A required context can also be provided at the injector level using {@link provideMenuContextProvider}, for example, at the component, route, or application level,
   * and is available to menus contributed in the scope of this injector. The inherited context can be overridden or extended. Setting a context entry to `undefined` clears it.
   */
  requiredContext?: Map<string, unknown>;

  /**
   * Specifies the injector used to register the contribution. Defaults to the current injection context.
   *
   * The contribution is disposed when the passed injector is destroyed.
   */
  injector?: Injector;

  /**
   * Allows associating arbitrary metadata with the contribution.
   *
   * @docs-private Not public API. Used by frameworks integrating the SCION Menu API. Applications should not use this property.
   */
  metadata?: {[key: string]: unknown};

  /**
   * Specifies an instant used to maintain a stable contribution order when the contribution is replaced, e.g., on context change.
   *
   * @docs-private Not public API. Used by frameworks integrating the SCION Menu API. Applications should not use this property.
   */
  contributionInstant?: number;
}

/**
 * Describes location and position of a menu contribution.
 */
export type SciMenuContributionLocation = {location: `menu:${string}`} & SciMenuContributionPosition;

/**
 * Describes location and position of a toolbar contribution.
 */
export type SciToolbarContributionLocation = {location: `toolbar:${string}`} & SciToolbarContributionPosition;

/**
 * Describes location and position of a menubar contribution.
 */
export type SciMenubarContributionLocation = {location: `menubar:${string}`} & SciMenubarContributionPosition;

/**
 * Describes location and position of a menu, toolbar, or menubar contribution.
 */
export type SciMenuContributionLocationLike = SciMenuContributionLocation | SciToolbarContributionLocation | SciMenubarContributionLocation;

/**
 * Controls where to insert a contribution into a menu. Can be at the beginning, at the end, or relative to a menu item or menu group.
 */
export type SciMenuContributionPosition = OneOf<{
  before?: `menuitem:${string}` | `menu:${string}`;
  after?: `menuitem:${string}` | `menu:${string}`;
  position?: 'start' | 'end';
}>;

/**
 * Controls where to insert a contribution into a toolbar. Can be at the beginning, at the end, or relative to a toolbar item or toolbar group.
 */
export type SciToolbarContributionPosition = OneOf<{
  before?: `menuitem:${string}` | `toolbar:${string}`;
  after?: `menuitem:${string}` | `toolbar:${string}`;
  position?: 'start' | 'end';
}>;

/**
 * Controls where to insert a contribution into a menubar. Can be at the beginning, at the end, or relative to a menu item.
 */
export type SciMenubarContributionPosition = OneOf<{
  before?: `menu:${string}`;
  after?: `menu:${string}`;
  position?: 'start' | 'end';
}>;

/**
 * Controls where to insert a contribution into a menu, toolbar, or menubar.
 */
export type SciMenuContributionPositionLike = SciMenuContributionPosition | SciToolbarContributionPosition | SciMenubarContributionPosition;

/**
 * Signature of a function used to add menu items to a menu.
 *
 * The menu calls this function with a {@link SciMenuFactory} that provides methods for populating it.
 * The menu context is passed as the second argument, a key/value map that describes the environment of the menu.
 *
 * The function runs within a reactive context, running again when tracked signals change.
 * Most menu item properties accept a value or signal. For properties that can change, prefer setting the property as a signal over tracking it manually to prevent this function from re-running.
 *
 * The function can call `inject` to get required dependencies from the root injector. Registering a {@link provideMenuInjectionContextProvider} allows providing additional tokens for dependency injection.
 */
export type SciMenuFactoryFn = (menu: SciMenuFactory, context: Map<string, unknown>) => void;
/**
 * Signature of a function used to add tools to a {@link SciToolbarComponent}.
 *
 * The toolbar calls this function with a {@link SciToolbarFactory} that provides methods for populating it.
 * The toolbar context is passed as the second argument, a key/value map that describes the environment of the toolbar.
 *
 * The function runs within a reactive context, running again when tracked signals change.
 * Most menu item properties accept a value or signal. For properties that can change, prefer setting the property as a signal over tracking it manually to prevent this function from re-running.
 *
 * The function can call `inject` to get required dependencies from the root injector. Registering a {@link provideMenuInjectionContextProvider} allows providing additional tokens for dependency injection.
 */
export type SciToolbarFactoryFn = (toolbar: SciToolbarFactory, context: Map<string, unknown>) => void;
/**
 * Signature of a function used to add tools to a {@link SciMenubarComponent}.
 *
 * The menubar calls this function with a {@link SciMenubarFactory} that provides methods for populating it.
 * The menubar context is passed as the second argument, a key/value map that describes the environment of the menubar.
 *
 * The function runs within a reactive context, running again when tracked signals change.
 * Most menu item properties accept a value or signal. For properties that can change, prefer setting the property as a signal over tracking it manually to prevent this function from re-running.
 *
 * The function can call `inject` to get required dependencies from the root injector. Registering a {@link provideMenuInjectionContextProvider} allows providing additional tokens for dependency injection.
 */
export type SciMenubarFactoryFn = (menubar: SciMenubarFactory, context: Map<string, unknown>) => void;
/**
 * Represents a {@link SciMenuFactoryFn}, {@link SciToolbarFactoryFn}, or {@link SciMenubarFactoryFn}.
 */
export type SciMenuFactoryFnLike = SciMenuFactoryFn | SciToolbarFactoryFn | SciMenubarFactoryFn;
