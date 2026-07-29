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

type TableFactoryFn<T> = (table: SciTableFactory<T>) => void;

export function table<T>(name: `table:${string}`, data: Signal<T[]>, factoryFn: TableFactoryFn<T>, options?: {injector?: Injector}): SciTable<T>;
export function table<T, ID = T>(descriptor: SciTableDescriptor<T, ID>, factoryFn: TableFactoryFn<T>, options?: {injector?: Injector}): SciTable<T, ID>;
export function table<T, ID = T>(arg1: `table:${string}` | SciTableDescriptor<T, ID>, arg2: Signal<T[]> | TableFactoryFn<T>, arg3?: TableFactoryFn<T> | {injector?: Injector}, options?: {injector?: Injector}): SciTable<T, ID> {
  assertNotInReactiveContext(table, 'Call table in a non-reactive (non-tracking) context, such as within the untracked() function.');
  if (!options?.injector) {
    assertInInjectionContext(table);
  }

  const injector = options?.injector ?? inject(Injector);
  const factory = new ɵSciTableFactory<T>();
  const factoryFn = isSignal(arg2) ? arg3 as TableFactoryFn<T> : arg2;

  effect(() => {
    factory.columns.set([]);
    factoryFn(factory);
  }, {injector});

  if (typeof arg1 === 'object') {
    return new ɵSciTable(factory, arg1);
  }

  return new ɵSciTable(factory, {name: arg1, data: arg2 as Signal<T[]>});
}
