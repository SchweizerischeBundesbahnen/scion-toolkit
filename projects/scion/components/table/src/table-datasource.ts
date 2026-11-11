/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Signal} from '@angular/core';
import {SciEnumValueLike} from './table.model';
import {MaybeAsync} from '@scion/toolkit/types';
import {SciInMemoryTableDatasource} from './in-memory-table-datasource';
import {ɵSciTable} from './ɵtable.model';
import {Observables} from '@scion/toolkit/util';
import {mapArray} from '@scion/toolkit/operators';

/**
 * Provides an in-memory datasource for {@link SciTable} with built-in filtering and sorting.
 *
 * A datasource provides data to {@link SciTable}, passing each item to columns for display. For a tree structure, additionally pass a child selector to the datasource.
 *
 * This datasource requires all data to be loaded upfront. The datasource filters and sorts data in memory.
 *
 * Custom columns must configure a filter matcher and sort comparator to be filterable and sortable.
 *
 * For large datasets requiring pagination or server-side filtering and sorting, prefer implementing a custom datasource using {@link ɵprovideTableDatasource}.
 *
 * @example - Usage
 * ```ts
 * import {table, provideTableDatasource} from '@scion/components/table';
 * import {httpResource} from '@angular/common/http';
 *
 * const users = httpResource<User[]>(() => '/api/users', {defaultValue: []});
 *
 * table({
 *   datasource: provideTableDatasource(users.value),
 *   columns: table => table.addStringColumn('Name', user => user.name),
 * });
 * ```
 *
 * @example - Displaying hierarchical data
 * ```ts
 * import {table, provideTableDatasource} from '@scion/components/table';
 * import {httpResource} from '@angular/common/http';
 *
 * const users = httpResource<User[]>(() => '/api/users', {defaultValue: []});
 *
 * table({
 *   datasource: provideTableDatasource(users.value, user => user.children),
 *   columns: table => table.addStringColumn('Name', user => user.name),
 * });
 * ```
 *
 * @param data - Provides items to display in the table, or root items if displaying a tree structure.
 * @param children - Function required to display a tree structure, returning an item's children or an empty array if the item has no children or is a leaf.
 *                   Called eagerly for each item when initializing the table, inside a reactive context that re-evaluates when tracked signals change.
 *
 * @see SciTableDescriptor.datasource
 */
export function provideTableDatasource<T>(data: Signal<T[]>, children?: (item: T) => T[]): SciTableDatasourceProvider<T> {
  return {
    [eSCI_TABLE_DATASOURCE_PROVIDER]: <ID>(table: ɵSciTable<T, ID>) => new SciInMemoryTableDatasource(data, table, {children}),
  };
}

/**
 * @docs-private Not public API. For internal use only.
 * @experimental since 22.7.0; API and behavior may change in any version without notice.
 */
export function ɵprovideTableDatasource<T, ID = T>(tableDatasource: SciTableDatasource<T, ID>): SciTableDatasourceProvider<T, ID>;
export function ɵprovideTableDatasource<T, ID = T>(treeTableDatasource: SciTreeTableDatasource<T, ID>): SciTableDatasourceProvider<T, ID>;
export function ɵprovideTableDatasource<T, ID = T>(datasource: SciTableDatasource<T, ID> | SciTreeTableDatasource<T, ID>): SciTableDatasourceProvider<T, unknown> {
  const isTreeTableDatesource = 'getTreeTableNodes' in datasource;

  return {
    [eSCI_TABLE_DATASOURCE_PROVIDER]: () => ({
      getTreeTableNodes: (query: SciTableDatasourceQuery) => isTreeTableDatesource ? datasource.getTreeTableNodes(query) : Observables.coerce(datasource.getIds(query)).pipe(mapArray(id => ({id}))),
      getItems: (ids: ID[]) => datasource.getItems(ids),
    }),
  };
}

export interface SciTableDatasource<T, ID> {
  getIds: (query: SciTableDatasourceQuery) => MaybeAsync<ID[]>;
  getItems: (ids: ID[]) => MaybeAsync<T[]>;
}

/**
 * @experimental since 22.7.0; API and behavior may change in any version without notice.
 */
export interface SciTreeTableDatasource<T, ID> {
  getTreeTableNodes(query: SciTableDatasourceQuery): MaybeAsync<SciTreeTableNode<ID>[]>;

  getItems(ids: ID[]): MaybeAsync<T[]>;
}

/**
 * Symbol for providing a {@link SciTreeTableDatasource}.
 */
export const eSCI_TABLE_DATASOURCE_PROVIDER: unique symbol = Symbol('eSCI_TABLE_DATASOURCE_PROVIDER');

/**
 * Symbol for providing type inference for the ID type.
 */
export declare const eSCI_TABLE_DATASOURCE_ID_TYPE: unique symbol;

/**
 * Provides a datasource to {@link SciTable}.
 */
export type SciTableDatasourceProvider<T, ID = never> = {
  // Phantom type required for TypeScript to infer <ID> because TypeScript cannot infer types from function return types.
  readonly [eSCI_TABLE_DATASOURCE_ID_TYPE]?: ID;
} & ([ID] extends [never] ? // Compare ID as a whole so that ID = never selects the true branch instead of resolving to never.
  {
    // For in-memory datasource, infer the ID type from the table passed to the provider.
    readonly [eSCI_TABLE_DATASOURCE_PROVIDER]: <ID>(table: ɵSciTable<T, ID>) => SciTreeTableDatasource<T, ID>;
  } :
  {
    readonly [eSCI_TABLE_DATASOURCE_PROVIDER]: (table: ɵSciTable<T, ID>) => SciTreeTableDatasource<T, ID>;
  });

export interface SciTableColumnFilter {
  columnName: `column:${string}`;
  text: string | number | boolean | SciEnumValueLike | SciEnumValueLike[];
}

export interface SciTableSortCriterion {
  columnName: `column:${string}`;
  direction: 'asc' | 'desc';
}

export interface SciTableDatasourceQuery {
  sortCriteria: SciTableSortCriterion[];
  columnFilters: SciTableColumnFilter[];
  tableFilter?: string;
}

export interface SciTreeTableNode<ID> {
  id: ID;
  parentId?: ID;
}
