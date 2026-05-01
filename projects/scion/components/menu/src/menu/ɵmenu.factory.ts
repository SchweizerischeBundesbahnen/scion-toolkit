/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciMenuDescriptor, SciMenuFactory, SciMenuFilterConfig, SciMenuGroupDescriptor, SciMenuItemDescriptor} from './menu.factory';
import {isSignal, Signal} from '@angular/core';
import {Arrays, prune} from '@scion/toolkit/util';
import {SciMenuItem, SciMenuItemLike} from '../menu.model';
import {ɵSciToolbarFactory} from '../toolbar/ɵtoolbar.factory';
import {ComponentType} from '@angular/cdk/portal';
import {coerceSignal, MaybeSignal, SciComponentDescriptor} from '@scion/components/common';
import {Translatable} from '@scion/components/text';
import {translate} from '../menu-translate.util';
import {validateMenuAccelerator} from '../menu-accelerators';

/**
 * Translation note: Texts are translated when added (not lazily when rendered) to simplify filtering.
 */
export class ɵSciMenuFactory implements SciMenuFactory {

  public readonly menuItems = [] as SciMenuItemLike[];

  /** @inheritDoc */
  public addMenuItem(descriptor: SciMenuItemDescriptor): this {
    // Construct action toolbar.
    const actionsFactory = new ɵSciToolbarFactory();
    descriptor.actions?.(actionsFactory);

    // Add menu item.
    this.menuItems.push(prune({
      type: 'menu-item',
      name: descriptor.name,
      labelText: translate(getLabelIfText(descriptor.label)),
      labelComponent: getLabelIfComponent(descriptor.label),
      iconLigature: coerceSignal(getIconIfLigature(descriptor.icon)),
      iconComponent: getIconIfComponent(descriptor.icon),
      checked: coerceSignal(descriptor.checked),
      active: coerceSignal(descriptor.active),
      tooltip: translate(descriptor.tooltip),
      accelerator: validateMenuAccelerator(descriptor.accelerator),
      disabled: coerceSignal(descriptor.disabled),
      visible: coerceSignal(descriptor.visible),
      actions: actionsFactory.menuItems,
      matchesFilter: descriptor.onFilter,
      cssClass: Arrays.coerce(descriptor.cssClass),
      attributes: descriptor.attributes,
      onSelect: async () => await descriptor.onSelect() as boolean | undefined ?? descriptor.checked === undefined, // Returning `true` will close the popover. Non-checkable items close by default.
    }));

    if (descriptor.checked && descriptor.icon) {
      throw Error('[MenuDefinitionError] Cannot use `checked` and `icon` together.');
    }

    return this;
  }

  /** @inheritDoc */
  public addMenu(descriptor: SciMenuDescriptor, menuFactoryFn: (menu: SciMenuFactory) => void): this {
    this.menuItems.push(prune({
      type: 'menu-item',
      name: descriptor.name,
      labelText: translate(getLabelIfText(descriptor.label)),
      labelComponent: getLabelIfComponent(descriptor.label),
      iconLigature: coerceSignal(getIconIfLigature(descriptor.icon)),
      iconComponent: getIconIfComponent(descriptor.icon),
      disabled: coerceSignal(descriptor.disabled),
      visible: coerceSignal(descriptor.visible),
      cssClass: Arrays.coerce(descriptor.cssClass),
      attributes: descriptor.attributes,
      menu: constructMenu(menuFactoryFn, descriptor.menu),
    }));

    return this;
  }

  /** @inheritDoc */
  public addGroup(groupFactoryFn: (group: SciMenuFactory) => void): this;
  public addGroup(descriptor: SciMenuGroupDescriptor, groupFactoryFn?: (group: SciMenuFactory) => void): this;
  public addGroup(factoryOrDescriptor: ((group: SciMenuFactory) => void) | SciMenuGroupDescriptor, factoryIfDescriptor?: (group: SciMenuFactory) => void): this {
    const [descriptor, groupFactoryFn] = typeof factoryOrDescriptor === 'function' ? [{}, factoryOrDescriptor] : [factoryOrDescriptor, factoryIfDescriptor];

    // Construct group.
    const groupFactory = new ɵSciMenuFactory();
    groupFactoryFn?.(groupFactory);

    // Construct action toolbar.
    const actionsFactory = new ɵSciToolbarFactory();
    descriptor.actions?.(actionsFactory);

    // Add group.
    this.menuItems.push(prune({
      type: 'group',
      name: descriptor.name,
      label: translate(descriptor.label),
      collapsible: coerceCollapsibleGroupConfig(descriptor),
      glyphArea: descriptor.glyphArea,
      disabled: coerceSignal(descriptor.disabled),
      visible: coerceSignal(descriptor.visible),
      actions: actionsFactory.menuItems,
      children: groupFactory.menuItems,
      cssClass: Arrays.coerce(descriptor.cssClass),
    }));

    return this;
  }
}

function getLabelIfText(label: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor): MaybeSignal<Translatable> | undefined {
  if (typeof label === 'string' || isSignal(label)) {
    return label;
  }
  return undefined;
}

function getLabelIfComponent(label: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor): SciComponentDescriptor | undefined {
  if (typeof label === 'function' && !isSignal(label)) {
    return {component: label};
  }
  else if (typeof label === 'object') {
    return label;
  }
  return undefined;
}

function getIconIfLigature(icon: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor | undefined): MaybeSignal<string> | undefined {
  if (typeof icon === 'string' || isSignal(icon)) {
    return icon;
  }
  return undefined;
}

function getIconIfComponent(icon: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor | undefined): SciComponentDescriptor | undefined {
  if (typeof icon === 'function' && !isSignal(icon)) {
    return {component: icon};
  }
  else if (typeof icon === 'object') {
    return icon;
  }
  return undefined;
}

function coerceCollapsibleGroupConfig(groupDescriptor: SciMenuGroupDescriptor): {collapsed: boolean} | undefined {
  const collapsible = groupDescriptor.collapsible;

  if (typeof collapsible === 'object') {
    return collapsible;
  }

  return collapsible === true ? {collapsed: false} : undefined;
}

export function constructMenu(menuFactoryFn: (menu: SciMenuFactory) => void, menuDescriptor?: SciMenuDescriptor['menu']): SciMenuItem['menu'] {
  const menuFactory = new ɵSciMenuFactory();
  menuFactoryFn(menuFactory);

  return prune({
    name: menuDescriptor?.name,
    children: menuFactory.menuItems,
    width: menuDescriptor?.width,
    minWidth: menuDescriptor?.minWidth,
    maxWidth: menuDescriptor?.maxWidth,
    maxHeight: menuDescriptor?.maxHeight,
    filter: coerceFilterConfig(menuDescriptor),
  });

  function coerceFilterConfig(menuDescriptor?: SciMenuDescriptor['menu']): SciMenuFilterConfig<Signal<Translatable>> | undefined {
    const filter = menuDescriptor?.filter;

    if (typeof filter === 'object') {
      return prune({
        placeholder: coerceSignal(filter.placeholder),
        notFoundMessage: coerceSignal(filter.notFoundMessage),
        focus: filter.focus,
      }, {pruneIfEmpty: true});
    }
    return filter === true ? {} : undefined;
  }
}
