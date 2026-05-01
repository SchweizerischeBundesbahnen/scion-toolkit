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
  control?: SciComponentDescriptor; // only in toolbar, not menu
  tooltip?: Signal<string>;
  accelerator?: SciKeyboardAccelerator;
  disabled?: Signal<boolean>;
  checked?: Signal<boolean>;
  active?: Signal<boolean>;
  actions?: SciMenuItemLike[];
  matchesFilter?: (filter: string) => boolean;
  cssClass?: string[];
  attributes?: {[name: string]: string};
  position?: SciMenuContributionPositionLike;
  onSelect: () => Promise<boolean>;
}

export interface SciMenu {
  type: 'menu';
  name?: `menu:${string}`;
  labelText?: Signal<string>;
  labelComponent?: SciComponentDescriptor;
  iconLigature?: Signal<string>;
  iconComponent?: SciComponentDescriptor;
  tooltip?: Signal<string>;
  disabled?: Signal<boolean>;
  visualMenuHint?: boolean;
  position?: SciMenuContributionPositionLike;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  maxHeight?: string;
  filter?: {placeholder?: Signal<Translatable>; notFoundText?: Signal<Translatable>; focus?: boolean};
  cssClass?: string[];
  attributes?: {[name: string]: string};
  children: SciMenuItemLike[];
}

export interface SciMenuGroup {
  type: 'group';
  name?: `menu:${string}` | `toolbar:${string}`;
  label?: Signal<string>;
  collapsible?: {collapsed: boolean};
  position?: SciMenuContributionPositionLike;
  disabled?: Signal<boolean>;
  actions?: SciMenuItemLike[];
  children: SciMenuItemLike[];
}

export type SciMenuItemLike = SciMenuItem | SciMenu | SciMenuGroup;
