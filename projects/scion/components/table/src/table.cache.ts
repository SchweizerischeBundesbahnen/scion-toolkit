/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, ResourceRef, signal, Signal} from '@angular/core';
import {SciTableRow} from './table.model';
import {Objects} from '@scion/toolkit/util';

export class SciTableCache<T> {

  private readonly _pages = signal(new Map<SciTableCacheKey, SciTableCacheEntry<T>>());
  private readonly _directChildrenCount = signal<number | undefined>(undefined);

  private readonly _cache = signal(new Map<SciTableCacheKey, SciTableCacheEntry<T>>());

  public readonly loading: Signal<boolean> = computed(() => this.values().some(entry => entry.rows.isLoading()));
  public readonly error: Signal<Error | undefined> = computed(() => this.values().find(entry => entry.rows.error())?.rows.error());
  public readonly values: Signal<Array<SciTableCacheEntry<T>>> = computed(() => [...this._pages().values()]);

  public readonly rowsByIndex = computed(() => this.projectRows().rowsByIndex, {equal: Objects.isEqual});

  public readonly rowsById: Signal<Map<ID, SciTableCacheRow<T>>> = computed(() => this.values()
    .flatMap(page => page.rows.value() ?? [])
    .reduce((acc, row) => new Map([...acc, [row.id, row], ...row.childrenCache.rowsById()]), new Map<ID, SciTableCacheRow<T>>()), {equal: Objects.isEqual});

  public readonly indexById = computed(() => [...this.rowsByIndex().entries()]
    .reduce((map, [index, row]) => map.set(row.id, index), new Map<ID, number>()));

  constructor(public expandedRows: Signal<Set<unknown>>) {
  }


  /**
   * Count of all nodes in the tree.
   */
  public readonly totalCount: Signal<number | undefined> = computed((): number | undefined => {
    const totalCount = this._directChildrenCount();
    if (totalCount === undefined) {
      return undefined;
    }

    return this.values()
      .flatMap(page => page.rows.value() ?? [])
      .filter(row => this.expandedRows().has(row.id))
      .reduce((visibleCount, row) => visibleCount + (row.childrenCache.totalCount() ?? 0), totalCount);
  });

  public has(key: SciTableCacheKey): boolean {
    return this._pages().has(key);
  }

  public get(key: SciTableCacheKey): SciTableCacheEntry<T> | undefined {
    return this._pages().get(key);
  }

  public set(key: SciTableCacheKey, entry: SciTableCacheEntry<T>): void {
    this._cache.update(cache => {
      const cacheCopy = new Map(cache);
      const existing = cacheCopy.get(key);
      if (existing) {
        cacheCopy.delete(key);
        existing.dispose();
      }

      cacheCopy.set(key, entry);
      return cacheCopy;
    });
  }

  public setTotalCount(totalCount: number | undefined): void {
    this._directChildrenCount.set(totalCount ?? 0);
  }

  /**
   * Traverses the tree to find pages which need to be loaded based on the current scroll range.
   */
  public findPagesToLoad(start: number, end: number, pageSize: number): TablePage<T>[] {
    const pagesToLoad: TablePage<T>[] = [];

    const findPages = (cache: SciTableCache<T>, indexOffset: number, parent?: SciTableCacheRow<T>): number => {
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
        else if (this.expandedRows().has(row.id)) {
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
   * Deletes the specified page from the cache, but only if still loading.
   */
  public deleteIfLoading(key: SciTableCacheKey): void {
    this._pages.update(cache => {
      const cacheCopy = new Map(cache);

      const existing = cacheCopy.get(key);
      if (existing && existing.rows.value() === undefined) {
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

  private disposeEntry(entry: SciTableCacheEntry<T>): void {
    entry.dispose();
  }

  private projectRows(rowsByIndex: Map<number, SciTableRow<T>> = new Map<number, SciTableRow<T>>(), indexOffset: number = 0): {indexOffset: number; rowsByIndex: Map<number, SciTableRow<T>>} {
    const totalCount = this._directChildrenCount() ?? 0;
    const rowsByLocalIndex = this.rowsByLocalIndex();

    // Loop over rows with the given offset.
    for (let localIndex = 0; localIndex < totalCount; localIndex++, indexOffset++) {
      const row = rowsByLocalIndex.get(localIndex);
      if (!row) {
        continue;
      }

      rowsByIndex.set(indexOffset, row);
      if (this.expandedRows().has(row.id)) {
        // `projectRows` adds the child rows directly into the map.
        const childRows = row.childrenCache.projectRows(rowsByIndex, indexOffset + 1);
        // Subtract one from new offset, since it's increased in the loop.
        indexOffset = childRows.indexOffset - 1;
      }
    }

    return {rowsByIndex, indexOffset};
  }

  private rowsByLocalIndex(): Map<number, SciTableCacheRow<T>> {
    return this.values()
      .reduce((rowsByIndex, page) => {
        page.rows.value()?.forEach((row, index) => rowsByIndex.set(page.start + index, row));
        return rowsByIndex;
      }, new Map<number, SciTableCacheRow<T>>());
  }

}

export interface SciTableCacheEntry<T> {
  rows: ResourceRef<SciTableCacheRow<T>[] | undefined>;
  start: number;
  end: number;
  dispose: () => void;
}

export interface SciTableCacheRow<T> extends SciTableRow<T> {
  childrenCache: SciTableCache<T>;
}

export interface TablePage<T> {
  cache: SciTableCache<T>;
  parent?: SciTableCacheRow<T>;
  page: number;
}

type SciTableCacheKey = `${number}-${number}`;
type ID = unknown;
