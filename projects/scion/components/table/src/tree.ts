/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, DestroyRef, inject, Injector, runInInjectionContext, signal} from '@angular/core';
import {SciTable, SciTableDescriptor} from './table.model';
import {ɵSciTable} from './ɵtable.model';
import {SciTreeDescriptor} from './tree.model';

export function tree<T>(descriptor: SciTreeDescriptor<T>, options?: {injector?: Injector}): SciTable<T> {
  if (!options?.injector) {
    assertInInjectionContext(tree);
  }

  const injector = options?.injector ?? inject(Injector);
  const tableDescriptor: SciTableDescriptor<T> = {
    data: signal([]),
    filterable: !!descriptor.filterable,
    sortable: !!descriptor.sortable,
    resizable: false,
    showHeader: descriptor.showHeader ?? false,
    wrapHeader: descriptor.wrapHeader,
    sortBy: descriptor.initialSort ? [{columnName: 'column:tree', direction: descriptor.initialSort}] : undefined,
    rowActions: descriptor.rowActions,
    rowBindings: descriptor.rowBindings,
    bufferSize: descriptor.bufferSize,
    pageSize: descriptor.pageSize,
    trackBy: descriptor.trackBy,
  };
  const sciTree = runInInjectionContext(injector, () => new ɵSciTable(
    table => table.addStringColumn({
      name: 'column:tree',
      label: descriptor.header,
      value: descriptor.label,
    }), tableDescriptor,
  ));
  injector.get(DestroyRef).onDestroy(() => sciTree.dispose());

  return sciTree;
}
