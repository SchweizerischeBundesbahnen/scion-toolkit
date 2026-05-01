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
  name?: `menuitem:${string}`;
  label?: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor;
  icon?: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor;
  checked?: MaybeSignal<boolean>;
  tooltip?: MaybeSignal<Translatable>;
  accelerator?: SciKeyboardAccelerator;
  disabled?: MaybeSignal<boolean>;
  visible?: MaybeSignal<boolean>;
  cssClass?: string | string[];
  attributes?: {[name: string]: string};
  onSelect: () => void | boolean | Promise<void | boolean>;
}

export interface SciToolbarMenuDescriptor {
  name?: `menuitem:${string}`;
  label?: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor;
  icon?: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor;
  tooltip?: MaybeSignal<Translatable>;
  disabled?: MaybeSignal<boolean>;
  visible?: MaybeSignal<boolean>;
  /**
   * Controls the display of a visual marker for menu dropdown. Defaults to `true`.
   */
  visualMenuIndicator?: boolean;
  cssClass?: string | string[];
  attributes?: {[name: string]: string};
  menu?: SciMenuDescriptor['menu'];
}

export interface SciToolbarControlDescriptor {
  name?: `menuitem:${string}`;
  component: ComponentType<unknown>;
  bindings?: Binding[];
  injector?: Injector;
  providers?: Provider[];
  tooltip?: MaybeSignal<Translatable>;
  visible?: MaybeSignal<boolean>;
  cssClass?: string | string[];
  attributes?: {[name: string]: string};
}

export interface SciToolbarGroupDescriptor {
  name?: `toolbar:${string}`;
  disabled?: MaybeSignal<boolean>;
  visible?: MaybeSignal<boolean>;
  cssClass?: string | string[];
}
