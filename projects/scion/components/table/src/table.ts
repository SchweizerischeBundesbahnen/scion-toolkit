/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, assertNotInReactiveContext, DestroyRef, inject, Injector, isSignal, runInInjectionContext, Signal} from '@angular/core';
import {SciTable, SciTableDescriptor} from './table.model';
import {SciTableFactory} from './table.factory';
import {ɵSciTable} from './ɵtable.model';

export type SciTableFactoryFn<T> = (table: SciTableFactory<T>) => void;

// Do not change order for better IntelliSense.
export function table<T>(descriptor: SciTableDescriptor<T>, factoryFn: SciTableFactoryFn<T>, options?: {injector?: Injector}): SciTable<T>;
export function table<T>(data: Signal<T[]>, factoryFn: SciTableFactoryFn<T>, options?: {injector?: Injector}): SciTable<T>;
export function table<T>(dataOrDescriptor: Signal<T[]> | SciTableDescriptor<T>, factoryFn: SciTableFactoryFn<T>, options?: {injector?: Injector}): SciTable<T> {
  assertNotInReactiveContext(table, 'Call table in a non-reactive (non-tracking) context, such as within the untracked() function.');
  if (!options?.injector) {
    assertInInjectionContext(table);
  }

  const injector = options?.injector ?? inject(Injector);
  const descriptor = (isSignal(dataOrDescriptor) ? {data: dataOrDescriptor} : dataOrDescriptor) satisfies SciTableDescriptor<T>;
  const sciTable = runInInjectionContext(injector, () => new ɵSciTable(factoryFn, descriptor));
  injector.get(DestroyRef).onDestroy(() => sciTable.dispose());

  return sciTable;
}
