/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {MaybeAsync} from './common';
import {computed, Signal} from '@angular/core';
import {arrayDatasource, treeDatasource} from './ɵtable-array-datasource';
import {SciTableColumnLike} from './table.model';

export interface SciTableColumnFilter {
  columnName: `column:${string}`;
  text: string | boolean | number;
}

export interface SciTableSortCriterion {
  columnName: `column:${string}`;
  direction: 'asc' | 'desc';
}

export interface SciTablePageRequest {
  page: number; // TODO [ego] Should page be 1-based?
  pageSize: number;
  start: number; // Inclusive
  end: number; // Exclusive
  sortCriteria: SciTableSortCriterion[];
  columnFilters: SciTableColumnFilter[];
  tableFilter?: string;
}

export interface SciTablePageResponse<T> {
  /**
   * Items of the requested page.
   */
  items: T[];

  /**
   * Total count of the source data, used to calculate the scroll size.
   */
  totalCount: number;
}

export interface SciTableIdsRequest {
  sortCriteria: SciTableSortCriterion[];
  columnFilters: SciTableColumnFilter[];
  tableFilter?: string;
}

/**
 * @docs-private Not public API. For internal use only.
 * @experimental since 22.3.0; API and behavior may change in any version without notice.
 */
export type SciTableDataLoaderFn<T> = (request: SciTablePageRequest) => MaybeAsync<SciTablePageResponse<T>>;

// export interface SciTableTreeNodeIds<ID> {
//   id: ID;
//   parentId?: ID;
// }

export interface SciTableTreeNode<T, P = T> {
  item: T;
  parent?: P;
}

export type SciTableIdsProvider<T> = (request: SciTableIdsRequest) => MaybeAsync<T[]>;

export interface SciTableTreeDataProvider<T, ID> {
  getIds: SciTableIdsProvider<SciTableTreeNode<ID>>;
  getItems(ids: ID[]): MaybeAsync<T[]>;
}

export interface SciTableDataProvider<T, ID> {
  getIds: SciTableIdsProvider<ID>;
  getItems(ids: ID[]): MaybeAsync<T[]>;
}

export type SciTableDataSource<T, ID> = SciTableDataProvider<T, ID> | SciTableTreeDataProvider<T, ID>;
export type SciTableDataSourceProvider<T, ID> = (columns: Signal<SciTableColumnLike<T>[]>, trackBy: (item: T) => ID) => SciTableDataSource<T, ID>;

export class SciTableArrayDatasource<T, ID> implements SciTableDataProvider<T, ID> {
  public readonly getIds: SciTableIdsProvider<ID>;
  public readonly getItems: (ids: ID[]) => MaybeAsync<T[]>;

  constructor(data: Signal<T[]>, options: {columns: Signal<SciTableColumnLike<T>[]>; trackBy: (item: T) => ID}) {
    const byId = computed(() => data().reduce((map, item) => map.set(options.trackBy(item), item), new Map<ID, T>()));
    this.getItems = ids => ids.map(id => byId().get(id)).filter((item): item is T => item !== undefined);
    this.getIds = arrayDatasource(byId, options.columns);
  }
}

export class SciAsyncTableDatasource<T, ID> implements SciTableDataProvider<T, ID> {

  constructor(public getIds: SciTableIdsProvider<ID>, public getItems: (ids: ID[]) => MaybeAsync<T[]>) {
  }
}

export class SciTableTreeDatasource<T, ID> implements SciTableTreeDataProvider<T, ID> {
  public readonly getIds: SciTableIdsProvider<SciTableTreeNode<ID>>;
  public readonly getItems: (ids: ID[]) => MaybeAsync<T[]>;

  constructor(root: Signal<T[]>, options: {columns: Signal<SciTableColumnLike<T>[]>; trackBy: (item: T) => ID; getChildren: (node: T) => T[]}) {
    const loadChildren = (item: T): SciTableTreeNode<T, ID>[] => options.getChildren(item).flatMap(child => [
      {item: child, parent: options.trackBy(item)},
      ...loadChildren(child),
    ]);

    const tree = computed(() => root().flatMap(node => {
      return [
        {item: node},
        ...loadChildren(node),
      ];
    }));
    const byId = computed(() => tree().reduce((map, node) => map.set(options.trackBy(node.item), node), new Map<ID, SciTableTreeNode<T, ID>>()));

    this.getItems = ids => ids.map(id => byId().get(id)?.item).filter((item): item is T => item !== undefined);
    this.getIds = treeDatasource(byId, options.columns);
  }
}

export class SciAsyncTableTreeDatasource<T, ID> implements SciTableTreeDataProvider<T, ID> {

  constructor(
    public getIds: SciTableIdsProvider<SciTableTreeNode<ID>>,
    public getItems: (ids: ID[]) => MaybeAsync<T[]>,
  ) {
  }
}

export function provideTableDatasource<T, ID>(data: Signal<T[]>): SciTableDataSourceProvider<T, ID> {
  return (columns, trackBy) => new SciTableArrayDatasource(data, {columns, trackBy});
}

export function provideAsyncTableDatasource<T, ID>(getIds: (request: SciTableIdsRequest) => MaybeAsync<ID[]>, getItems: (ids: ID[]) => MaybeAsync<T[]>): SciTableDataSourceProvider<T, ID> {
  return () => new SciAsyncTableDatasource(getIds, getItems);
}

export function provideTableTreeDatasource<T, ID>(root: Signal<T[]>, getChildren: (item: T) => T[]): SciTableDataSourceProvider<T, ID> {
  return (columns, trackBy) => new SciTableTreeDatasource(root, {columns, trackBy, getChildren});
}

export function provideAsyncTableTreeDatasource<T, ID>(getIds: (request: SciTableIdsRequest) => MaybeAsync<SciTableTreeNode<ID>[]>, getItems: (ids: ID[]) => MaybeAsync<T[]>): SciTableDataSourceProvider<T, ID> {
  return () => new SciAsyncTableTreeDatasource(getIds, getItems);
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

export function isArrayDatasource(datasource: SciTableDataProvider<unknown, unknown>): boolean {
  return datasource instanceof SciTableArrayDatasource || datasource instanceof SciAsyncTableDatasource;
}

export function isTreeDatasource(datasource: SciTableDataProvider<unknown, unknown>): boolean {
  return datasource instanceof SciTableTreeDatasource || datasource instanceof SciAsyncTableTreeDatasource;
}
