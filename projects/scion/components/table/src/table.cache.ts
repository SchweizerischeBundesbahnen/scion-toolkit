/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, signal, Signal} from '@angular/core';
import {SciRow} from './table.model';
import {Objects} from '@scion/toolkit/util';

export interface TableCacheEntry<T> {
  rows: Signal<TableCacheRow<T>[] | undefined>;
  start: number;
  end: number;
  dispose: () => void;
}

export interface TableCacheRow<T> extends SciRow<T> {
  childrenCache: TableCache<T>;
}

export interface TablePage<T> {
  cache: TableCache<T>;
  parent?: TableCacheRow<T>;
  page: number;
}

type TableCacheKey = `${number}-${number}`;
type ID = unknown;

export class TableCache<T> {
  private readonly _pages = signal(new Map<TableCacheKey, TableCacheEntry<T>>());
  private readonly _directChildrenCount = signal<number | undefined>(undefined);

  /**
   * Count of all nodes in the tree.
   */
  public readonly totalCount: Signal<number | undefined> = computed((): number | undefined => {
    const totalCount = this._directChildrenCount();
    if (totalCount === undefined) {
      return undefined;
    }

    return this.values()
      .flatMap(page => page.rows() ?? [])
      .filter(row => row.expanded())
      .reduce((visibleCount, row) => visibleCount + (row.childrenCache.totalCount() ?? 0), totalCount);
  });

  public readonly rowsByIndex = computed(() => this.projectRows().rowsByIndex, {equal: Objects.isEqual});

  public readonly rowsById: Signal<Map<ID, TableCacheRow<T>>> = computed(() => this.values()
    .flatMap(page => page.rows() ?? [])
    .reduce((acc, row) => new Map([...acc, [row.id, row], ...row.childrenCache.rowsById()]), new Map<ID, TableCacheRow<T>>()), {equal: Objects.isEqual});

  public readonly indexById = computed(() => [...this.rowsByIndex().entries()]
    .reduce((map, [index, row]) => map.set(row.id, index), new Map<ID, number>()));

  public has(key: TableCacheKey): boolean {
    return this._pages().has(key);
  }

  public get(key: TableCacheKey): TableCacheEntry<T> | undefined {
    return this._pages().get(key);
  }

  public set(key: TableCacheKey, entry: TableCacheEntry<T>): void {
    this._pages.update(cache => {
      const cacheCopy = new Map(cache);
      const existing = cacheCopy.get(key);
      if (existing) {
        cacheCopy.delete(key);
        this.disposeEntry(existing);
      }

      cacheCopy.set(key, entry);
      return cacheCopy;
    });
  }

  public setTotalCount(totalCount: number): void {
    this._directChildrenCount.set(totalCount);
  }

  /**
   * Traverses the tree to find pages which need to be loaded based on the current scroll range.
   */
  public findPagesToLoad(start: number, end: number, pageSize: number): TablePage<T>[] {
    const pagesToLoad: TablePage<T>[] = [];

    const findPages = (cache: TableCache<T>, indexOffset: number, parent?: TableCacheRow<T>): number => {
      const directChildrenCount = cache._directChildrenCount();

      if (directChildrenCount === undefined) {
        // Always load root rows, if directChildrenCount is not yet defined.
        if (!parent || indexOffset < end) {
          // Load first page.
          pagesToLoad.push({parent, cache, page: 0});
        }
        return indexOffset;
      }

      const rowsByLocalIndex = cache.rowsByLocalIndex();
      const localPagesToLoad = new Set<number>();

      // loop through rows, while not yet reaching the end of the request.
      for (let localIndex = 0; localIndex < directChildrenCount && indexOffset < end; localIndex++, indexOffset++) {
        const row = rowsByLocalIndex.get(localIndex);
        if (!row) {
          const page = Math.floor(localIndex / pageSize);
          // Only add pages which are not already in the pagesToLoad / localPagesToLoad.
          if (indexOffset >= start && !localPagesToLoad.has(page)) {
            pagesToLoad.push({parent, cache, page});
            localPagesToLoad.add(page);
          }
        }
        else if (row.expanded()) {
          // Subtract one from new offset, since it's increased in the loop.
          indexOffset = findPages(row.childrenCache, indexOffset + 1, row) - 1;
        }
      }

      return indexOffset;
    };

    findPages(this, 0);
    return pagesToLoad;
  }

  /**
   * Deletes page from cache, but only if it has no items loaded.
   */
  public deleteIfEmpty(key: TableCacheKey): void {
    this._pages.update(cache => {
      const cacheCopy = new Map(cache);

      const existing = cacheCopy.get(key);
      if (existing && existing.rows() === undefined) {
        cacheCopy.delete(key);
        this.disposeEntry(existing);
      }

      return cacheCopy;
    });
  }

  public clear(): void {
    this._pages.update(cache => {
      for (const entry of cache.values()) {
        this.disposeEntry(entry);
      }
      return new Map();
    });
    this._directChildrenCount.set(undefined);
  }

  public get values(): Signal<Array<TableCacheEntry<T>>> {
    return computed(() => [...this._pages().values()]);
  }

  private disposeEntry(entry: TableCacheEntry<T>): void {
    entry.dispose();
  }

  private projectRows(rowsByIndex: Map<number, SciRow<T>> = new Map<number, SciRow<T>>(), indexOffset: number = 0): {indexOffset: number; rowsByIndex: Map<number, SciRow<T>>} {
    const totalCount = this._directChildrenCount() ?? 0;
    const rowsByLocalIndex = this.rowsByLocalIndex();

    // Loop over rows with the given offset.
    for (let localIndex = 0; localIndex < totalCount; localIndex++, indexOffset++) {
      const row = rowsByLocalIndex.get(localIndex);
      if (!row) {
        continue;
      }

      rowsByIndex.set(indexOffset, row);
      if (row.expanded()) {
        // `projectRows` adds the child rows directly into the map.
        const childRows = row.childrenCache.projectRows(rowsByIndex, indexOffset + 1);
        // Subtract one from new offset, since it's increased in the loop.
        indexOffset = childRows.indexOffset - 1;
      }
    }

    return {rowsByIndex, indexOffset};
  }

  private rowsByLocalIndex(): Map<number, TableCacheRow<T>> {
    return this.values()
      .reduce((rowsByIndex, page) => {
        page.rows()?.forEach((row, index) => rowsByIndex.set(page.start + index, row));
        return rowsByIndex;
      }, new Map<number, TableCacheRow<T>>());
  }
}
