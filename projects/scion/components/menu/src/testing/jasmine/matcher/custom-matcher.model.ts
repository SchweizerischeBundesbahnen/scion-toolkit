/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

export interface ExpectedSciMenuItem {
  type: 'menu-item';
  name?: `menuitem:${string}`;
  label?: string;
  labelComponent?: ExpectedSciComponentDescriptor;
  icon?: string;
  iconComponent?: ExpectedSciComponentDescriptor;
  control?: ExpectedSciComponentDescriptor;
  tooltip?: string;
  disabled?: boolean;
  checked?: boolean;
  active?: boolean;
  actions?: ExpectedSciMenuItemLike[];
  cssClass?: string | string[];
  attributes?: {[name: string]: string};
}

export interface ExpectedSciMenu {
  type: 'menu';
  name?: `menu:${string}`;
  label?: string;
  labelComponent?: ExpectedSciComponentDescriptor;
  icon?: string;
  iconComponent?: ExpectedSciComponentDescriptor;
  tooltip?: string;
  disabled?: boolean;
  visualMenuIndicator?: boolean;
  cssClass?: string | string[];
  attributes?: {[name: string]: string};
  children?: ExpectedSciMenuItemLike[];
}

export interface ExpectedSciMenuGroup {
  type: 'group';
  name?: `menu:${string}` | `toolbar:${string}`;
  label?: string;
  collapsible?: {collapsed: boolean};
  actions?: ExpectedSciMenuItemLike[];
  children?: ExpectedSciMenuItemLike[];
  cssClass?: string | string[];
}

export type ExpectedSciMenuItemLike = ExpectedSciMenuItem | ExpectedSciMenu | ExpectedSciMenuGroup;

export const NO_ITEMS_FOUND = 'No items found.';

interface ExpectedSciComponentDescriptor {
  selector: string;
}
