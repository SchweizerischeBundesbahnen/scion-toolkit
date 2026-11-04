/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, Signal} from '@angular/core';
import {toObservable} from '@angular/core/rxjs-interop';
import {SciEnumValueLike, SciTableColumnLike} from './table.model';
import {arrayDatasource, treeDatasource} from './ɵtable-array-datasource';
import {MaybeAsync} from '@scion/toolkit/types';
import {map} from 'rxjs';

export interface SciTableColumnFilter {
  columnName: `column:${string}`;
  text: string | number | boolean | SciEnumValueLike | SciEnumValueLike[];
}

export interface SciTableSortCriterion {
  columnName: `column:${string}`;
  direction: 'asc' | 'desc';
}

export interface SciTableIdsRequest {
  sortCriteria: SciTableSortCriterion[];
  columnFilters: SciTableColumnFilter[];
  tableFilter?: string;
}

export interface SciTableTreeNode<T, P = T> {
  item: T;
  parent?: P;
}

/**
 * @docs-private Not public API. For internal use only.
 * @experimental since 22.3.0; API and behavior may change in any version without notice.
 */
export type SciTableIdsProvider<T> = (request: SciTableIdsRequest) => MaybeAsync<T[]>;

export interface SciTableTreeDatasource<T, ID> {
  getIds: SciTableIdsProvider<SciTableTreeNode<ID>>;

  getItems(ids: ID[]): MaybeAsync<T[]>;
}

export interface SciTableDatasource<T, ID> {
  getIds: SciTableIdsProvider<ID>;

  getItems(ids: ID[]): MaybeAsync<T[]>;
}

export type SciTableDatasourceFactory<T, ID> = (columns: Signal<SciTableColumnLike<T>[]>, trackBy: (item: T) => ID) => SciTableDatasource<T, ID> | SciTableTreeDatasource<T, ID>;

export class ɵSciTableArrayDatasource<T, ID> implements SciTableDatasource<T, ID> {
  public readonly getIds: SciTableIdsProvider<ID>;
  public readonly getItems: (ids: ID[]) => MaybeAsync<T[]>;

  constructor(data: Signal<T[]>, options: {columns: Signal<SciTableColumnLike<T>[]>; trackBy: (item: T) => ID}) {
    const byId = computed(() => data().reduce((map, item) => map.set(options.trackBy(item), item), new Map<ID, T>()));

    this.getIds = arrayDatasource(byId, options.columns);
    this.getItems = ids => toObservable(byId).pipe(map(byId => ids.filter(id => byId.has(id)).map(id => byId.get(id)!)));
  }
}

export class ɵSciAsyncTableDatasource<T, ID> implements SciTableDatasource<T, ID> {
  public readonly getIds: SciTableIdsProvider<ID>;
  public readonly getItems: (ids: ID[]) => MaybeAsync<T[]>;

  constructor(getIds: SciTableIdsProvider<ID>, getItems: (ids: ID[]) => MaybeAsync<T[]>) {
    this.getIds = getIds;
    this.getItems = getItems;
  }
}

export class ɵSciTableTreeDatasource<T, ID> implements SciTableTreeDatasource<T, ID> {
  public readonly getIds: SciTableIdsProvider<SciTableTreeNode<ID>>;
  public readonly getItems: (ids: ID[]) => MaybeAsync<T[]>;

  constructor(root: Signal<T[]>, options: {columns: Signal<SciTableColumnLike<T>[]>; trackBy: (item: T) => ID; getChildren: (node: T) => T[] | undefined}) {
    const loadChildren = (item: T): SciTableTreeNode<T, ID>[] => {
      const children = options.getChildren(item) ?? [];
      return children.flatMap(child => [
        {item: child, parent: options.trackBy(item)},
        ...loadChildren(child),
      ]);
    };

    const tree = computed(() => root().flatMap(node => {
      return [
        {item: node},
        ...loadChildren(node),
      ];
    }));
    const byId = computed(() => tree().reduce((map, node) => map.set(options.trackBy(node.item), node), new Map<ID, SciTableTreeNode<T, ID>>()));

    this.getIds = treeDatasource(byId, options.columns);
    this.getItems = ids => toObservable(byId).pipe(map(byId => ids.filter(id => byId.has(id)).map(id => byId.get(id)!.item)));
  }
}

export class ɵSciAsyncTableTreeDatasource<T, ID> implements SciTableTreeDatasource<T, ID> {
  public readonly getIds: SciTableIdsProvider<SciTableTreeNode<ID>>;
  public readonly getItems: (ids: ID[]) => MaybeAsync<T[]>;

  constructor(getIds: SciTableIdsProvider<SciTableTreeNode<ID>>, getItems: (ids: ID[]) => MaybeAsync<T[]>) {
    this.getIds = getIds;
    this.getItems = getItems;
  }
}

/**
 * Provides a datasource for a table using an array signal.
 *
 * Updates the table when the signal changes.
 * Sorting and filtering are performed locally using the column configurations.
 *
 * @example
 * ```ts
 * table({
 *   datasource: provideTableDatasource(users.value),
 *   columns: table => table.addStringColumn('Name', user => user.name),
 * });
 * ```
 *
 * The table supports using an array signal directly, without  {@link provideTableDatasource}
 *
 * @example
 * ```ts
 * table({
 *   datasource: users.value,
 *   columns: table => table.addStringColumn('Name', user => user.name),
 * });
 * ```
 *
 * @param data - Signal containing the table items.
 */
export function provideTableDatasource<T, ID>(data: Signal<T[]>): SciTableDatasourceFactory<T, ID> {
  return (columns, trackBy) => new ɵSciTableArrayDatasource(data, {columns, trackBy});
}

export function provideAsyncTableDatasource<T, ID>(getIds: (request: SciTableIdsRequest) => MaybeAsync<ID[]>, getItems: (ids: ID[]) => MaybeAsync<T[]>): SciTableDatasourceFactory<T, ID> {
  return () => new ɵSciAsyncTableDatasource(getIds, getItems);
}

/**
 * Provides a datasource for a table with hierarchical rows using an array signal.
 *
 * Materializes the entire hierarchy using `getChildren` during initialization and on updates of the root signal or signals read by `getChildren`.
 * Sorting and filtering are performed locally the column configurations.
 *
 * @example
 * ```ts
 * table({
 *   datasource: provideTableTreeDatasource(users.value, user => user.children),
 *   columns: table => table.addStringColumn('Name', user => user.name),
 * });
 * ```
 *
 * @param root - Signal containing the root items of the hierarchy.
 * @param getChildren - Function returning an item's children, or an empty array or `undefined` if the item has no children.
 */
export function provideTableTreeDatasource<T, ID>(root: Signal<T[]>, getChildren: (item: T) => T[] | undefined): SciTableDatasourceFactory<T, ID> {
  return (columns, trackBy) => new ɵSciTableTreeDatasource(root, {columns, trackBy, getChildren});
}

export function provideAsyncTableTreeDatasource<T, ID>(getIds: (request: SciTableIdsRequest) => MaybeAsync<SciTableTreeNode<ID>[]>, getItems: (ids: ID[]) => MaybeAsync<T[]>): SciTableDatasourceFactory<T, ID> {
  return () => new ɵSciAsyncTableTreeDatasource(getIds, getItems);
}

/**
 * TODO [table] Remove after datasource is final.
 *
 * @docs-private Not public API. For internal use only.
 * @experimental since 22.3.0; API and behavior may change in any version without notice.
 */
export function ɵillegaldatasource<T>(): Signal<T[]> {
  return computed(() => {
    throw Error('[SciTableError] Illegal state. ɵillegaldatasource should not be used.');
  });
}

export function isArrayDatasource(datasource: SciTableDatasource<unknown, unknown>): boolean {
  return datasource instanceof ɵSciTableArrayDatasource || datasource instanceof ɵSciAsyncTableDatasource;
}

export function isTreeDatasource(datasource: SciTableDatasource<unknown, unknown>): boolean {
  return datasource instanceof ɵSciTableTreeDatasource || datasource instanceof ɵSciAsyncTableTreeDatasource;
}
