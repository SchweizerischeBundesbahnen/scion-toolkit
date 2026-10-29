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
import {SciTableColumnFilterMatcherFn, SciTableDescriptor, SciTableRowBindingFactory, ɵillegaldatasource, ɵSciTable, ɵSciTableRowBindingFactory} from '@scion/components/table';
import {Signal, WritableSignal} from '@angular/core';
import {MaybeArray} from '@scion/toolkit/types';

export class ɵSciTree<T = unknown, ID = T> implements SciTree<ID> {

  public readonly activeItem: Signal<ID | undefined>;
  public readonly selectedItems: Signal<Array<ID>>;
  public readonly filterable: WritableSignal<boolean>;
  public readonly selectable: WritableSignal<'single' | 'multi' | false>;

  private readonly _table: ɵSciTable<T, ID>;

  constructor(descriptor: SciTreeDescriptor<T, ID>) {
    const matcher = descriptor.filterable && typeof descriptor.filterable === 'object' ? descriptor.filterable.matcher : undefined;
    const filterable: {matcher: SciTableColumnFilterMatcherFn<T, string | void, string>} | boolean | undefined = matcher ? {
      matcher: (text, context) => matcher(text, {item: context.item, label: context.value}),
    } : descriptor.filterable as boolean | undefined;
    const tableDescriptor: SciTableDescriptor<T, ID> = {
      datasource: ɵillegaldatasource(),
      ɵdatasource: descriptor.datasource,
      filterable: !!descriptor.filterable,
      selectable: descriptor.selectable,
      sortable: false,
      resizable: false,
      showHeader: false,
      rowActions: descriptor.nodeActions,
      rowBindings: (bindings: SciTableRowBindingFactory, item, index) => descriptor.nodeBindings?.((bindings as ɵSciTableRowBindingFactory), item, index),
      bufferSize: descriptor.bufferSize,
      pageSize: descriptor.pageSize,
      trackBy: descriptor.trackBy,
      columns: table => {
        if (typeof descriptor.label === 'function') {
          return table.addStringColumn({
            value: descriptor.label,
            filterable,
          });
        }

        if ('component' in descriptor.label) {
          return table.addComponentColumn({
            component: descriptor.label.component,
            padding: descriptor.label.padding,
            filterable,
          });
        }

        if ('template' in descriptor.label) {
          return table.addTemplateColumn({
            template: descriptor.label.template,
            padding: descriptor.label.padding,
            filterable,
          });
        }

        throw Error('[TreeConfigurationError] Tree label requires a "string" accessor, "SciTreeNodeComponentDescriptor" or "SciTreeNodeTemplateDescriptor".');
      },
    };

    this._table = new ɵSciTable<T, ID>(tableDescriptor);

    this.activeItem = this._table.activeItem;
    this.selectedItems = this._table.selectedItems;
    this.filterable = this._table.filterable;
    this.selectable = this._table.selectable;
  }

  public get table(): ɵSciTable<T, ID> {
    return this._table;
  }

  public filter(text: string | null): void {
    this._table.filter(text);
  }

  public select(ids: MaybeArray<ID>): void {
    this._table.select(ids);
  }

  public expandAll(): void {
    this._table.expandAll();
  }

  public collapseAll(): void {
    this._table.collapseAll();
  }

  public dispose(): void {
    this._table.dispose();
  }
}
