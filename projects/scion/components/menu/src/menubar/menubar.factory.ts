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
import {MaybeSignal} from '@scion/components/common';
import {Translatable} from '@scion/components/text';

export interface SciMenubarFactory {

  addMenu(descriptor: SciMenubarMenuDescriptor, menuFactoryFn: (menu: SciMenuFactory) => void): this;
}

export interface SciMenubarMenuDescriptor {
  name?: `menuitem:${string}`;
  label: MaybeSignal<Translatable>;
  visible?: MaybeSignal<boolean>;
  cssClass?: string | string[];
  attributes?: {[name: string]: string};
  menu?: SciMenuDescriptor['menu'];
}
