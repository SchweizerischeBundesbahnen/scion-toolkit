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
import {SciTableDescriptor, ɵillegaldatasource, ɵSciTable} from '@scion/components/table';
import {effect, signal, Signal, WritableSignal} from '@angular/core';
import {Translatable} from '@scion/components/text';

export class ɵSciTree<T = unknown, ID = T> implements SciTree<ID> {

  public readonly activeItem: Signal<ID | undefined>;
  public readonly selectedItems: Signal<Array<ID>>;
  public readonly filterable: WritableSignal<boolean>;
  public readonly header: WritableSignal<Translatable | undefined>;
  public readonly wrapHeader: WritableSignal<boolean>;
  public readonly sortable: WritableSignal<boolean>;
  public readonly selectable: WritableSignal<'single' | 'multi' | false>;

  private readonly _table: ɵSciTable<T, ID>;

  constructor(descriptor: SciTreeDescriptor<T, ID>) {
    this.header = signal(descriptor.header);
    const tableDescriptor: SciTableDescriptor<T, ID> = {
      datasource: ɵillegaldatasource(),
      ɵdatasource: descriptor.datasource,
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
      columns: table => table.addColumn({
        name: 'column:tree',
        header: this.header(),
        value: descriptor.label,
      }),
    };

    this._table = new ɵSciTable<T, ID>(tableDescriptor);

    this.activeItem = this._table.activeItem;
    this.selectedItems = this._table.selectedItems;
    this.filterable = this._table.filterable;
    this.sortable = this._table.sortable;
    this.wrapHeader = this._table.wrapHeader;
    this.selectable = this._table.selectable;
    effect(() => this._table.showHeader.set(!!this.header()));
  }

  public get table(): ɵSciTable<T, ID> {
    return this._table;
  }

  public filter(text: string | null): void {
    this._table.filter(text);
  }

  public expand(id: ID): void {
    this._table.expand(id);
  }

  public expandAll(): void {
    this._table.expandAll();
  }

  public collapse(id: ID): void {
    this._table.collapse(id);
  }

  public collapseAll(): void {
    this._table.collapseAll();
  }

  public dispose(): void {
    this._table.dispose();
  }
}
