/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {isSignal} from '@angular/core';
import {Arrays} from '@scion/toolkit/util';
import {SciMenu} from '../menu.model';
import {ɵSciMenuFactory} from '../menu/ɵmenu.factory';
import {coerceSignal, MaybeSignal} from '@scion/components/common';
import {Translatable} from '@scion/components/text';
import {translate} from '../menu-translate.util';
import {SciMenubarFactory, SciMenubarMenuDescriptor} from './menubar.factory';
import {SciMenuFactory} from '../menu/menu.factory';

/**
 * Translation note: Texts are translated when added (not lazily when rendered) to simplify filtering.
 */
export class ɵSciMenubarFactory implements SciMenubarFactory {

  public readonly menuItems = [] as SciMenu[];

  /** @inheritDoc */
  public addMenu(label: MaybeSignal<Translatable>, menuFactoryFn: (menu: SciMenuFactory) => void): this;
  public addMenu(descriptor: SciMenubarMenuDescriptor, menuFactoryFn: (menu: SciMenuFactory) => void): this;
  public addMenu(labelOrDescriptor: MaybeSignal<Translatable> | SciMenubarMenuDescriptor, menuFactoryFn: (menu: SciMenuFactory) => void): this {
    const descriptor = coerceMenuDescriptor(labelOrDescriptor);

    // Construct menu.
    const menuFactory = new ɵSciMenuFactory();
    menuFactoryFn(menuFactory);

    // Add menu.
    this.menuItems.push({
      type: 'menu',
      name: descriptor.name,
      labelText: translate(descriptor.label),
      width: descriptor.width,
      minWidth: descriptor.minWidth,
      maxWidth: descriptor.maxWidth,
      maxHeight: descriptor.maxHeight,
      filter: coerceFilterDescriptor(descriptor),
      cssClass: Arrays.coerce(descriptor.cssClass),
      attributes: descriptor.attributes,
      children: menuFactory.menuItems,
    } satisfies SciMenu);

    return this;
  }
}

function coerceMenuDescriptor(labelOrDescriptor: MaybeSignal<string> | SciMenubarMenuDescriptor): SciMenubarMenuDescriptor {
  if (typeof labelOrDescriptor === 'string' || isSignal(labelOrDescriptor)) {
    return {label: labelOrDescriptor};
  }
  return labelOrDescriptor;
}

function coerceFilterDescriptor(menuDescriptor: SciMenubarMenuDescriptor): SciMenu['filter'] {
  const filter = menuDescriptor.filter;

  if (typeof filter === 'object') {
    return {
      placeholder: coerceSignal(filter.placeholder),
      notFoundText: coerceSignal(filter.notFoundText),
      focus: filter.focus,
    };
  }
  return filter === true ? {} : undefined;
}
