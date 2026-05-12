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
import {SciMenuDescriptor, SciMenuFactory} from '../menu/menu.factory';
import {MaybeSignal, SciComponentDescriptor} from '@scion/components/common';
import {Translatable} from '@scion/components/text';
import {SciKeyboardAccelerator} from '../menu-accelerators';
import {Binding, Injector, Provider} from '@angular/core';

export interface SciToolbarFactory {

  addToolbarButton(descriptor: SciToolbarButtonDescriptor): this;

  addToolbarSplitButton(descriptor: SciToolbarButtonDescriptor & {menu?: SciMenuDescriptor['menu']}, menuFactoryFn: (menu: SciMenuFactory) => void): this;

  addToolbarMenu(descriptor: SciToolbarMenuDescriptor, menuFactoryFn: (menu: SciMenuFactory) => void): this;

  addToolbarControl(descriptor: SciToolbarControlDescriptor): this;

  addToolbarSplitControl(descriptor: SciToolbarControlDescriptor & {menu?: SciMenuDescriptor['menu']}, menuFactoryFn: (menu: SciMenuFactory) => void): this;

  addGroup(groupFactoryFn: (group: SciToolbarFactory) => void): this;

  addGroup(descriptor: SciToolbarGroupDescriptor, groupFactoryFn?: (group: SciToolbarFactory) => void): this;
}

export interface SciToolbarButtonDescriptor {
  name?: `menuitem:${string}`; // tested with relative position
  label?: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor; // tested
  icon?: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor; // tested
  checked?: MaybeSignal<boolean>; // tested
  tooltip?: MaybeSignal<Translatable>; // tested
  accelerator?: SciKeyboardAccelerator; // tested
  disabled?: MaybeSignal<boolean>; // tested
  cssClass?: string | string[]; // tested
  attributes?: {[name: string]: string}; // tested
  onSelect: () => void | boolean | Promise<void | boolean>; // tested
}

export interface SciToolbarMenuDescriptor {
  name?: `menuitem:${string}`; // tested with relative position
  label?: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor; // tested
  icon?: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor; // tested
  tooltip?: MaybeSignal<Translatable>; // tested
  disabled?: MaybeSignal<boolean>; // tested
  /**
   * Controls the display of a visual marker for menu dropdown. Defaults to `true`.
   */
  visualMenuHint?: boolean; // tested
  cssClass?: string | string[]; // tested
  attributes?: {[name: string]: string}; // tested
  menu?: SciMenuDescriptor['menu']; // tested
}

export interface SciToolbarControlDescriptor {
  name?: `menuitem:${string}`;
  component: ComponentType<unknown>; // tested
  bindings?: Binding[]; // not going to test
  injector?: Injector; // not going to test
  providers?: Provider[]; // not going to test
  tooltip?: MaybeSignal<Translatable>; // tested
  cssClass?: string | string[]; // tested
  attributes?: {[name: string]: string}; // tested
}

export interface SciToolbarGroupDescriptor {
  name?: `toolbar:${string}`; // tested with relative position
  disabled?: MaybeSignal<boolean>; // tested
  cssClass?: string | string[]; // tested
}
