/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {SciTree, SciTreeDescriptor} from './tree.model';
import {SciTableDescriptor, ɵSciTable} from '@scion/components/table';
import {Signal, WritableSignal} from '@angular/core';

export class ɵSciTree<T = unknown> implements SciTree<T> {

  public readonly activeItem: Signal<T | undefined>;
  public readonly selectedItems: Signal<Array<T>>;
  public readonly filterable: WritableSignal<boolean>;
  public readonly wrapHeader: WritableSignal<boolean>;
  public readonly sortable: WritableSignal<boolean>;
  public readonly selectable: WritableSignal<'single' | 'multi' | false>;

  private readonly _table: ɵSciTable<T>;

  constructor(descriptor: SciTreeDescriptor<T>) {
    const tableDescriptor: SciTableDescriptor<T> = {
      datasource: descriptor.datasource,
      filterable: !!descriptor.filterable,
      sortable: !!descriptor.sortable,
      resizable: false,
      showHeader: !!descriptor.header,
      wrapHeader: descriptor.wrapHeader,
      sortBy: descriptor.initialSort ? [{columnName: 'column:tree', direction: descriptor.initialSort}] : undefined,
      rowActions: descriptor.nodeActions,
      rowBindings: descriptor.nodeBindings,
      bufferSize: descriptor.bufferSize,
      pageSize: descriptor.pageSize,
      trackBy: descriptor.trackBy,
    };

    this._table = new ɵSciTable<T>(
      table => table.addColumn({
        name: 'column:tree',
        label: descriptor.header,
        value: descriptor.label,
      }), tableDescriptor,
    );

    this.activeItem = this._table.activeItem;
    this.selectedItems = this._table.selectedItems;
    this.filterable = this._table.filterable;
    this.sortable = this._table.sortable;
    this.wrapHeader = this._table.wrapHeader;
    this.selectable = this._table.selectable;
  }

  public get table(): ɵSciTable<T> {
    return this._table;
  }

  public filter(text: string | null): void {
    this._table.filter(text);
  }

  public dispose(): void {
    this._table.dispose();
  }
}



