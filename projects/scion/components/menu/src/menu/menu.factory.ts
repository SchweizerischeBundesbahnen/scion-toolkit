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
  name?: `menuitem:${string}`; // tested with relative position
  label: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor; // tested
  icon?: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor; // tested
  checked?: MaybeSignal<boolean>; // tested
  active?: MaybeSignal<boolean>; // tested
  tooltip?: MaybeSignal<Translatable>; // tested
  accelerator?: SciKeyboardAccelerator; // tested
  disabled?: MaybeSignal<boolean>; // tested
  actions?: (actions: SciToolbarFactory) => void; // tested
  onFilter?: (filter: string) => boolean;
  cssClass?: string | string[]; // tested
  attributes?: {[name: string]: string}; // tested
  onSelect: () => void | boolean | Promise<void | boolean>; // tested
}

export interface SciMenuDescriptor {
  name?: `menuitem:${string}`; // tested with relative position
  label: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor; // tested
  icon?: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor; // tested
  disabled?: MaybeSignal<boolean>; // tested
  cssClass?: string | string[]; // tested
  attributes?: {[name: string]: string}; // tested
  menu?: {
    name?: `menu:${string}`; // tested with nested contribution
    width?: string; // tested
    minWidth?: string; // tested
    maxWidth?: string; // tested
    maxHeight?: string; // tested
    filter?: boolean | RequireOne<{placeholder?: MaybeSignal<Translatable>; notFoundText?: MaybeSignal<Translatable>; focus?: boolean}>; // tested
  };
}

export interface SciMenuGroupDescriptor {
  name?: `menu:${string}`; // tested with relative position
  label?: MaybeSignal<Translatable>; // tested
  collapsible?: boolean | {collapsed: boolean}; // tested
  disabled?: MaybeSignal<boolean>; // tested
  actions?: (actions: SciToolbarFactory) => void; // tested
  cssClass?: string | string[]; // tested
}
