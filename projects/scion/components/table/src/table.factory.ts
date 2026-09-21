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
import {SciTableColumnFactory} from './table-column.factory';
import {ɵSciTable} from './ɵtable.model';
import {ɵillegaldatasource} from './table-datasource';

export type SciTableColumnFactoryFn<T> = (table: SciTableColumnFactory<T>) => void;

// Do not change order for better IntelliSense.

/** @experimental since 22.3.0; API and behavior may change in any version without notice. */
export function table<T>(descriptor: SciTableDescriptor<T>): SciTable<T>;
/** @experimental since 22.3.0; API and behavior may change in any version without notice. */
export function table<T>(data: Signal<T[]>, columnFactoryFn: SciTableColumnFactoryFn<T>, options?: {injector?: Injector}): SciTable<T>;
export function table<T>(dataOrDescriptor: Signal<T[]> | SciTableDescriptor<T>, columnFactoryFn?: SciTableColumnFactoryFn<T>, options?: {injector?: Injector}): SciTable<T> {
  assertNotInReactiveContext(table, 'Call table in a non-reactive (non-tracking) context, such as within the untracked() function.');

  const descriptor = isSignal(dataOrDescriptor) ? ({ɵdatasource: dataOrDescriptor, datasource: ɵillegaldatasource(), columns: columnFactoryFn!, injector: options?.injector}) satisfies SciTableDescriptor<T> : dataOrDescriptor;
  if (!descriptor.injector) {
    assertInInjectionContext(table);
  }

  const injector = descriptor.injector ?? inject(Injector);
  const sciTable = runInInjectionContext(injector, () => new ɵSciTable(descriptor));
  injector.get(DestroyRef).onDestroy(() => sciTable.dispose());
  return sciTable;
}
