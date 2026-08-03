/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, assertNotInReactiveContext, DestroyRef, effect, inject, Injector, isSignal, Signal} from '@angular/core';
import {SciTable, SciTableDescriptor} from './table.model';
import {SciTableFactory} from './table.factory';
import {ɵSciTableFactory} from './ɵtable.factory';
import {ɵSciTable} from './ɵtable.model';

type TableFactoryFn<T> = (table: SciTableFactory<T>) => void;

export function table<T>(name: `table:${string}`, data: Signal<T[]>, factoryFn: TableFactoryFn<T>, options?: {injector?: Injector}): SciTable;
export function table<T>(descriptor: SciTableDescriptor<T>, factoryFn: TableFactoryFn<T>, options?: {injector?: Injector}): SciTable;
export function table<T>(arg1: `table:${string}` | SciTableDescriptor<T>, arg2: Signal<T[]> | TableFactoryFn<T>, arg3?: TableFactoryFn<T> | {injector?: Injector}, options?: {injector?: Injector}): SciTable {
  assertNotInReactiveContext(table, 'Call table in a non-reactive (non-tracking) context, such as within the untracked() function.');
  if (!options?.injector) {
    assertInInjectionContext(table);
  }

  const injector = options?.injector ?? inject(Injector);
  const factory = new ɵSciTableFactory<T>();
  const factoryFn = isSignal(arg2) ? arg3 as TableFactoryFn<T> : arg2;
  const descriptor = typeof arg1 === 'object' ? arg1 : {name: arg1, data: arg2 as Signal<T[]>};

  effect(() => {
    factory.columns.set([]);
    factoryFn(factory);

    const columns = factory.columns();
    if (!isSignal(descriptor.data) && columns.some(column => typeof column.sortable === 'object' || typeof column.filterable === 'object')) {
      throw Error('[TableDefinitionError] Data sources with a loader function cannot define a custom sort or filter function. Sorting and filtering have to be done within the loader function.');
    }

    if (isSignal(descriptor.data) && columns.some(column => ['component', 'template'].includes(column.type) && (column.filterable === true || column.sortable === true))) {
      throw Error('[TableDefinitionError] Component and template columns cannot have a auto filter or auto sort.');
    }
  }, {injector});

  const model = new ɵSciTable(factory, descriptor);
  injector.get(DestroyRef).onDestroy(() => model.dispose());
  return model;
}
