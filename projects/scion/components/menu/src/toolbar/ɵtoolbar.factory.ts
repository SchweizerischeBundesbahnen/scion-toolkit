/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciMenuDescriptor, SciMenuFactory} from '../menu/menu.factory';
import {isSignal} from '@angular/core';
import {Arrays, prune} from '@scion/toolkit/util';
import {SciToolbarButtonDescriptor, SciToolbarControlDescriptor, SciToolbarFactory, SciToolbarGroupDescriptor, SciToolbarMenuDescriptor} from './toolbar.factory';
import {SciMenuGroup, SciMenuItem, SciMenuItemLike} from '../menu.model';
import {constructMenu} from '../menu/ɵmenu.factory';
import {translate} from '../menu-translate.util';
import {validateMenuAccelerator} from '../menu-accelerators';
import {coerceSignal, MaybeSignal, SciComponentDescriptor} from '@scion/components/common';
import {Translatable} from '@scion/components/text';
import {ComponentType} from '@angular/cdk/portal';

/* eslint-disable @typescript-eslint/unified-signatures */

/**
 * Translation note: Texts are translated when added (not lazily when rendered) to simplify filtering.
 */
export class ɵSciToolbarFactory implements SciToolbarFactory {

  public readonly menuItems = [] as SciMenuItemLike[];

  /** @inheritDoc */
  public addToolbarButton(descriptor: SciToolbarButtonDescriptor): this;
  public addToolbarButton(descriptor: SciToolbarButtonDescriptor & {menu?: SciMenuDescriptor['menu']}, menuFactoryFn: (menu: SciMenuFactory) => void): this;
  public addToolbarButton(descriptor: SciToolbarButtonDescriptor & {menu?: SciMenuDescriptor['menu']}, menuFactoryFn?: (menu: SciMenuFactory) => void): this {
    this.menuItems.push(prune<SciMenuItem>({
      type: 'menu-item',
      name: descriptor.name,
      labelText: translate(coerceLabelText(descriptor.label)),
      labelComponent: coerceLabelComponent(descriptor.label),
      iconLigature: coerceSignal(coerceIconLigature(descriptor.icon)),
      iconComponent: coerceIconComponent(descriptor.icon),
      checked: coerceSignal(descriptor.checked),
      tooltip: translate(descriptor.tooltip),
      accelerator: validateMenuAccelerator(descriptor.accelerator),
      disabled: coerceSignal(descriptor.disabled),
      cssClass: Arrays.coerce(descriptor.cssClass),
      attributes: descriptor.attributes,
      menu: constructMenu(menuFactoryFn, descriptor.menu),
      onSelect: async () => await descriptor.onSelect() as boolean | undefined ?? descriptor.checked === undefined, // Returning `true` will close the popover. Non-checkable items close by default.
    }));

    return this;
  }

  /** @inheritDoc */
  public addToolbarMenu(descriptor: SciToolbarMenuDescriptor, menuFactoryFn: (menu: SciMenuFactory) => void): this {
    this.menuItems.push(prune<SciMenuItem>({
      type: 'menu-item',
      name: descriptor.name,
      labelText: translate(coerceLabelText(descriptor.label)),
      labelComponent: coerceLabelComponent(descriptor.label),
      iconLigature: coerceSignal(coerceIconLigature(descriptor.icon)),
      iconComponent: coerceIconComponent(descriptor.icon),
      tooltip: translate(descriptor.tooltip),
      disabled: coerceSignal(descriptor.disabled),
      visualMenuHint: descriptor.visualMenuHint,
      cssClass: Arrays.coerce(descriptor.cssClass),
      attributes: descriptor.attributes,
      menu: constructMenu(menuFactoryFn, descriptor.menu),
    }));

    return this;
  }

  /** @inheritDoc */
  public addToolbarControl(descriptor: SciToolbarControlDescriptor): this;
  public addToolbarControl(descriptor: SciToolbarControlDescriptor & {menu?: SciMenuDescriptor['menu']}, menuFactoryFn: (menu: SciMenuFactory) => void): this;
  public addToolbarControl(descriptor: SciToolbarControlDescriptor & {menu?: SciMenuDescriptor['menu']}, menuFactoryFn?: (menu: SciMenuFactory) => void): this {
    this.menuItems.push(prune<SciMenuItem>({
      type: 'menu-item',
      name: descriptor.name,
      control: {
        component: descriptor.component,
        bindings: descriptor.bindings,
        injector: descriptor.injector,
        providers: descriptor.providers,
      },
      tooltip: translate(descriptor.tooltip),
      cssClass: Arrays.coerce(descriptor.cssClass),
      attributes: descriptor.attributes,
      menu: constructMenu(menuFactoryFn, descriptor.menu),
    }));

    return this;
  }

  /** @inheritDoc */
  public addGroup(groupFactoryFn: (group: SciToolbarFactory) => void): this;
  public addGroup(descriptor: SciToolbarGroupDescriptor, groupFactoryFn?: (group: SciToolbarFactory) => void): this;
  public addGroup(factoryOrDescriptor: ((group: SciToolbarFactory) => void) | SciToolbarGroupDescriptor, factoryIfDescriptor?: (group: SciToolbarFactory) => void): this {
    const [descriptor, groupFactoryFn] = coerceGroupDescriptor(factoryOrDescriptor, factoryIfDescriptor);

    // Construct group.
    const groupFactory = new ɵSciToolbarFactory();
    groupFactoryFn?.(groupFactory);

    // Add group.
    this.menuItems.push(prune<SciMenuGroup>({
      type: 'group',
      name: descriptor.name,
      disabled: coerceSignal(descriptor.disabled),
      children: groupFactory.menuItems,
      cssClass: Arrays.coerce(descriptor.cssClass),
    }));

    return this;
  }
}

function coerceGroupDescriptor(factoryOrDescriptor: ((group: SciToolbarFactory) => void) | SciToolbarGroupDescriptor, factoryIfDescriptor?: (group: SciToolbarFactory) => void): [SciToolbarGroupDescriptor, ((group: SciToolbarFactory) => void) | undefined] {
  if (typeof factoryOrDescriptor === 'function') {
    return [{}, factoryOrDescriptor];
  }
  return [factoryOrDescriptor, factoryIfDescriptor];
}

function coerceLabelText(label: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor | undefined): MaybeSignal<Translatable> | undefined {
  if (typeof label === 'string' || isSignal(label)) {
    return label;
  }
  return undefined;
}

function coerceLabelComponent(label: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor | undefined): SciComponentDescriptor | undefined {
  if (typeof label === 'function' && !isSignal(label)) {
    return {component: label};
  }
  else if (typeof label === 'object') {
    return label;
  }
  return undefined;
}

function coerceIconLigature(icon: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor | undefined): MaybeSignal<string> | undefined {
  if (typeof icon === 'string' || isSignal(icon)) {
    return icon;
  }
  return undefined;
}

function coerceIconComponent(icon: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor | undefined): SciComponentDescriptor | undefined {
  if (typeof icon === 'function' && !isSignal(icon)) {
    return {component: icon};
  }
  else if (typeof icon === 'object') {
    return icon;
  }
  return undefined;
}
