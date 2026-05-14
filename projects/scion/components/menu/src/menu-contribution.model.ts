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
import {SciMenuItemLike} from './menu.model';

export interface SciMenuContribution {
  scope: 'menu' | 'toolbar' | 'menubar';
  factoryFn: SciMenuFactoryFnLike;
  requiredContext: Map<string, unknown>;
  position?: SciMenuContributionPositionLike;
  contributionInstant: number;
  /**
   * Arbitrary metadata to be associated with the contribution.
   */
  metadata: {[key: string]: unknown};
}

export type SciMenuContributionLocation = {location: `menu:${string}`} & SciMenuContributionPosition;
export type SciToolbarContributionLocation = {location: `toolbar:${string}`} & SciToolbarContributionPosition;
export type SciMenubarContributionLocation = {location: `menubar:${string}`} & SciMenubarContributionPosition;
export type SciMenuContributionLocationLike = SciMenuContributionLocation | SciToolbarContributionLocation | SciMenubarContributionLocation;

export interface SciMenuContributionOptions {
  /**
   * This function must be called within an injection context, or an explicit {@link Injector} passed. Destroying the injection context will unregister contributed menus.
   */
  injector?: Injector;

  /**
   * Context required by the contribution.
   */
  requiredContext?: Map<string, unknown>;

  /**
   * Arbitrary metadata to be associated with the contribution.
   */
  metadata?: {[key: string]: unknown};

  contributionInstant?: number;
}

export type SciMenuContributionPosition = OneOf<{
  before?: `menuitem:${string}` | `menu:${string}`;
  after?: `menuitem:${string}` | `menu:${string}`;
  position?: 'start' | 'end';
}>;
export type SciToolbarContributionPosition = OneOf<{
  before?: `menuitem:${string}` | `toolbar:${string}`;
  after?: `menuitem:${string}` | `toolbar:${string}`;
  position?: 'start' | 'end';
}>;
export type SciMenubarContributionPosition = OneOf<{
  before?: `menu:${string}`;
  after?: `menu:${string}`;
  position?: 'start' | 'end';
}>;
export type SciMenuContributionPositionLike = SciMenuContributionPosition | SciToolbarContributionPosition | SciMenubarContributionPosition;

export type SciMenuFactoryFn = (menu: SciMenuFactory, context: Map<string, unknown>) => void;
export type SciToolbarFactoryFn = (toolbar: SciToolbarFactory, context: Map<string, unknown>) => void;
export type SciMenubarFactoryFn = (menubar: SciMenubarFactory, context: Map<string, unknown>) => void;
export type SciMenuFactoryFnLike = SciMenuFactoryFn | SciToolbarFactoryFn | SciMenubarFactoryFn;

/**
 * Indicates no contributions found.
 */
export const NULL_MENU_CONTRIBUTIONS: SciMenuItemLike[] = [];
