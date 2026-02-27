/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, assertNotInReactiveContext, effect, inject, Injector, isSignal, Signal} from '@angular/core';
import {SciTable, SciTableDescriptor} from './table.model';
import {SciTableFactory} from './table.factory';
import {ɵSciTableFactory} from './ɵtable.factory';
import {ɵSciTable} from './ɵtable.model';

export function table<T>(data: Signal<T[]>, factoryFn: (table: SciTableFactory<T>) => void, options?: {injector?: Injector}): SciTable<T>;
export function table<T, ID = T>(descriptor: SciTableDescriptor<T, ID>, factoryFn: (table: SciTableFactory<T>) => void, options?: {injector?: Injector}): SciTable<T, ID>;
export function table<T, ID = T>(dataOrDescriptor: Signal<T[]> | SciTableDescriptor<T, ID>, factoryFn: (table: SciTableFactory<T>) => void, options?: {injector?: Injector}): SciTable<T, ID> {
  assertNotInReactiveContext(table, 'Call table in a non-reactive (non-tracking) context, such as within the untracked() function.');
  if (!options?.injector) {
    assertInInjectionContext(table);
  }

  const injector = options?.injector ?? inject(Injector);
  const factory = new ɵSciTableFactory<T>();

  effect(() => {
    factory.columns.set([]);
    factoryFn(factory);
  }, {injector});

  if (isSignal(dataOrDescriptor)) {
    return new ɵSciTable(factory, {data: dataOrDescriptor});
  }

  return new ɵSciTable(factory, dataOrDescriptor);
}
