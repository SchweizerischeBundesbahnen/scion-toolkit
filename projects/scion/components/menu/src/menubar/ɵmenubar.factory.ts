/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Arrays, prune} from '@scion/toolkit/util';
import {constructMenu} from '../menu/ɵmenu.factory';
import {translate} from '../menu-translate.util';
import {SciMenubarFactory, SciMenubarMenuDescriptor} from './menubar.factory';
import {SciMenuFactory} from '../menu/menu.factory';
import {SciMenuItem} from '../menu.model';
import {coerceSignal} from '@scion/components/common';

/**
 * Translation note: Texts are translated when added (not lazily when rendered) to simplify filtering.
 */
export class ɵSciMenubarFactory implements SciMenubarFactory {

  public readonly menuItems = [] as SciMenuItem[];

  /** @inheritDoc */
  public addMenu(descriptor: SciMenubarMenuDescriptor, menuFactoryFn: (menu: SciMenuFactory) => void): this {
    this.menuItems.push(prune({
      type: 'menu-item',
      name: descriptor.name,
      labelText: translate(descriptor.label),
      visible: coerceSignal(descriptor.visible),
      cssClass: Arrays.coerce(descriptor.cssClass),
      attributes: descriptor.attributes,
      menu: constructMenu(menuFactoryFn, descriptor.menu),
    }));

    return this;
  }
}
