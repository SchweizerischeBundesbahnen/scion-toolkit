/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Signal} from '@angular/core';
import {SciMenuContributionPositionLike} from './menu-contribution.model';
import {Translatable} from '@scion/components/text';
import {SciComponentDescriptor} from '@scion/components/common';
import {SciKeyboardAccelerator} from './menu-accelerators';
import {SciMenuFilterConfig} from './menu/menu.factory';

/**
 * INPUTS FOR DESCRIPTION: https://www.electronjs.org/docs/latest/api/menu-item
 */
export interface SciMenuItem {
  type: 'menu-item';
  name?: `menuitem:${string}`;
  labelText?: Signal<string>;
  labelComponent?: SciComponentDescriptor;
  iconLigature?: Signal<string>;
  iconComponent?: SciComponentDescriptor;
  control?: SciComponentDescriptor; // only for toolbar items
  tooltip?: Signal<string>;
  accelerator?: SciKeyboardAccelerator;
  disabled?: Signal<boolean>;
  visible?: Signal<boolean>;
  checked?: Signal<boolean>;
  active?: Signal<boolean>; // only for menu items
  actions?: SciMenuItemLike[]; // only for menu items
  matchesFilter?: (filter: string) => boolean;
  position?: SciMenuContributionPositionLike;
  visualMenuIndicator?: boolean; // only for toolbar items
  cssClass?: string[];
  attributes?: {[name: string]: string};
  onSelect?: () => Promise<boolean>; // only set for menu items with a `onSelect` handler
  menu?: { // only set for menu items with a menu
    name?: `menu:${string}`;
    width?: string;
    minWidth?: string;
    maxWidth?: string;
    maxHeight?: string;
    filter?: SciMenuFilterConfig<Signal<Translatable>>;
    children: SciMenuItemLike[];
  };
}

export interface SciMenuGroup {
  type: 'group';
  name?: `menu:${string}` | `toolbar:${string}`;
  label?: Signal<string>;
  collapsible?: {collapsed: boolean}; // only for groups in menus
  glyphArea?: false; // only for groups in menus
  disabled?: Signal<boolean>;
  visible?: Signal<boolean>;
  position?: SciMenuContributionPositionLike;
  actions?: SciMenuItemLike[]; // only for groups in menus
  children: SciMenuItemLike[];
  cssClass?: string[];
}

export type SciMenuItemLike = SciMenuItem | SciMenuGroup;
