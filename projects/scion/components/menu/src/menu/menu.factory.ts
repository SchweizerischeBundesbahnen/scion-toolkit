/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ComponentType} from '@angular/cdk/portal';
import {SciToolbarFactory} from '../toolbar/toolbar.factory';
import {MaybeSignal, SciComponentDescriptor} from '@scion/components/common';
import {Translatable} from '@scion/components/text';
import {RequireOne} from '@scion/toolkit/types';
import {SciKeyboardAccelerator} from '../menu-accelerators';

export interface SciMenuFactory {

  addMenuItem(descriptor: SciMenuItemDescriptor): this;

  addMenu(descriptor: SciMenuDescriptor, menuFactoryFn: (menu: SciMenuFactory) => void): this;

  addGroup(groupFactoryFn: (group: SciMenuFactory) => void): this;

  addGroup(descriptor: SciMenuGroupDescriptor, groupFactoryFn?: (group: SciMenuFactory) => void): this;
}

export interface SciMenuItemDescriptor {
  name?: `menuitem:${string}`;
  label: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor;
  icon?: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor;
  checked?: MaybeSignal<boolean>;
  active?: MaybeSignal<boolean>;
  tooltip?: MaybeSignal<Translatable>;
  accelerator?: SciKeyboardAccelerator;
  disabled?: MaybeSignal<boolean>;
  visible?: MaybeSignal<boolean>;
  actions?: (actions: SciToolbarFactory) => void;
  onFilter?: (filter: string) => boolean;
  cssClass?: string | string[];
  attributes?: {[name: string]: string};
  onSelect: () => void | boolean | Promise<void | boolean>;
}

export interface SciMenuDescriptor {
  name?: `menuitem:${string}`;
  label: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor;
  icon?: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor;
  disabled?: MaybeSignal<boolean>;
  visible?: MaybeSignal<boolean>;
  cssClass?: string | string[];
  attributes?: {[name: string]: string};
  menu?: {
    name?: `menu:${string}`;
    width?: string;
    minWidth?: string;
    maxWidth?: string;
    maxHeight?: string;
    filter?: boolean | RequireOne<SciMenuFilterConfig>;
  };
}

export interface SciMenuGroupDescriptor {
  name?: `menu:${string}`;
  label?: MaybeSignal<Translatable>;
  collapsible?: boolean | {collapsed: boolean};
  /**
   * TODO [menu]: Explain what glyph area is.
   *
   * Controls whether to hide the glyph area in this group.
   * Defaults to displaying the glyph area if any menu item contained in the menu or its groups has an icon or is checkable.
   */
  glyphArea?: false;
  disabled?: MaybeSignal<boolean>;
  visible?: MaybeSignal<boolean>;
  actions?: (actions: SciToolbarFactory) => void;
  cssClass?: string | string[];
}

/**
 * Features of the menu filter field.
 */
export interface SciMenuFilterConfig<T = MaybeSignal<Translatable>> {
  placeholder?: T;
  notFoundMessage?: T;
  focus?: boolean;
}
