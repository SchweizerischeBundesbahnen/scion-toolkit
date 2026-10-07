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

export interface SciTableTreeNode<T> {
  item: T;
  parent?: T;
}

export type SciTableIdsProvider<T> = (request: SciTableIdsRequest) => MaybeAsync<T[]>;

export interface SciTableTreeDataProvider<T> {
  getIds: SciTableIdsProvider<SciTableTreeNode<unknown>>;
  getItems(ids: unknown[], meta?: {parent?: T}): MaybeAsync<T[]>;
}

export interface SciTableDataProvider<T> {
  getIds: SciTableIdsProvider<unknown>;
  getItems(ids: unknown[]): MaybeAsync<T[]>;
}

export type SciTableDataSource<T> = SciTableDataProvider<T> | SciTableTreeDataProvider<T>;
export type SciTableDataSourceProvider<T> = (columns: Signal<SciTableColumnLike<T>[]>, trackBy: (item: T) => unknown) => SciTableDataSource<T>;

export class SciTableArrayDatasource<T> implements SciTableDataProvider<T> {
  public readonly getIds: SciTableIdsProvider<unknown>;
  public readonly getItems: (ids: unknown[]) => MaybeAsync<T[]>;

  constructor(data: Signal<T[]>, options: {columns: Signal<SciTableColumnLike<T>[]>; trackBy: (item: T) => unknown}) {
    const byId = computed(() => data().reduce((map, item) => map.set(options.trackBy(item), item), new Map<unknown, T>()));
    this.getItems = ids => ids.map(id => byId().get(id)).filter((item): item is T => item !== undefined);
    this.getIds = arrayDatasource(byId, options.columns);
  }
}

export class SciAsyncTableDatasource<T> implements SciTableDataProvider<T> {

  constructor(public getIds: SciTableIdsProvider<unknown>, public getItems: (ids: unknown[]) => MaybeAsync<T[]>) {
  }
}

export class SciTableTreeDatasource<T> implements SciTableTreeDataProvider<T> {
  public readonly getIds: SciTableIdsProvider<SciTableTreeNode<unknown>>;
  public readonly getItems: (ids: unknown[], meta?: {parent?: T}) => MaybeAsync<T[]>;

  constructor(root: Signal<T[]>, options: {columns: Signal<SciTableColumnLike<T>[]>; trackBy: (item: T) => unknown; getChildren: (node: T) => T[]}) {
    const loadChildren = (item: T): SciTableTreeNode<T>[] => options.getChildren(item).flatMap(child => [
      {item: child, parent: options.trackBy(item)} as SciTableTreeNode<T>,
      ...loadChildren(child),
    ]);

    const tree = computed(() => root().flatMap(node => {
      return [
        {item: node},
        ...loadChildren(node),
      ];
    }));
    const byId = computed(() => tree().reduce((map, node) => map.set(options.trackBy(node.item), node), new Map<unknown, SciTableTreeNode<T>>()));

    this.getItems = ids => ids.map(id => byId().get(id)?.item).filter((item): item is T => item !== undefined);
    this.getIds = treeDatasource(byId, options.columns);
  }
}

export class SciAsyncTableTreeDatasource<T> implements SciTableTreeDataProvider<T> {

  constructor(
    public getIds: SciTableIdsProvider<SciTableTreeNode<unknown>>,
    public getItems: (ids: unknown[], meta?: {parent?: T}) => MaybeAsync<T[]>,
  ) {
  }
}

export function provideTableDatasource<T>(data: Signal<T[]>): SciTableDataSourceProvider<T> {
  return (columns, trackBy) => new SciTableArrayDatasource(data, {columns, trackBy});
}

export function provideAsyncTableDatasource<T>(getIds: (request: SciTableIdsRequest) => MaybeAsync<unknown[]>, getItems: (ids: unknown[]) => MaybeAsync<T[]>): SciTableDataSourceProvider<T> {
  return () => new SciAsyncTableDatasource(getIds, getItems);
}

export function provideTableTreeDatasource<T>(root: Signal<T[]>, getChildren: (item: T) => T[]): SciTableDataSourceProvider<T> {
  return (columns, trackBy) => new SciTableTreeDatasource(root, {columns, trackBy, getChildren});
}

export function provideAsyncTableTreeDatasource<T>(getIds: (request: SciTableIdsRequest) => MaybeAsync<SciTableTreeNode<unknown>[]>, getItems: (ids: unknown[], meta?: {parent?: T}) => MaybeAsync<T[]>): SciTableDataSourceProvider<T> {
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
