/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, linkedSignal, ResourceRef, signal, Signal} from '@angular/core';
import {SciTableRow} from './table.model';
import {Objects} from '@scion/toolkit/util';

export class SciTableCache<T> {

  private readonly _pages = signal(new Map<SciTableCacheKey, SciTableCacheEntry<T>>());
  private readonly _latestCacheKey = signal<SciTableCacheKey | undefined>(undefined);

  public readonly loading: Signal<boolean> = computed(() => this.values().some(entry => entry.page.isLoading()));
  public readonly error: Signal<Error | undefined> = computed(() => {
    for (const entry of this.values()) {
      const error = entry.page.error();
      if (error) {
        return error;
      }
      for (const row of entry.page.value()?.rows ?? []) {
        const childError = row.childrenCache.error();
        if (childError) {
          return childError;
        }
      }
    }
    return undefined;
  });
  public readonly values: Signal<Array<SciTableCacheEntry<T>>> = computed(() => [...this._pages().values()]);
  public readonly empty: Signal<boolean> = computed(() => this._pages().size === 0);

  /**
   * Number of immediate children, without including expanded descendants.
   */
  public readonly directChildrenCount: Signal<number | undefined> = linkedSignal({
    source: () => ({
      key: this._latestCacheKey(),
      pages: this._pages(),
      error: this.error(),
    }),
    computation: ({key, pages, error}, previous) => {
      // If there is an error set count to 0, to reset scrollbar.
      if (error) {
        return 0;
      }

      // For child pages add a default totalCount of 3 to show skeletons.
      const fallback = this.isRoot ? undefined : 3;
      if (!key) {
        return fallback;
      }

      // Use previous totalCount while not available or to the fallback if nothing is loaded yet.
      return pages.get(key)?.page.value()?.totalCount ?? previous?.value ?? fallback;
    },
  });

  public readonly rowsByIndex = computed(() => this.projectRows().rowsByIndex, {equal: Objects.isEqual});

  public readonly rowsById: Signal<Map<ID, SciTableCacheRow<T>>> = computed(() => this.values()
    .flatMap(entry => entry.page.status() === 'error' ? [] : entry.page.value()?.rows ?? [])
    .reduce((acc, row) => new Map([...acc, [row.id, row], ...row.childrenCache.rowsById()]), new Map<ID, SciTableCacheRow<T>>()), {equal: Objects.isEqual});

  public readonly indexById = computed(() => [...this.rowsByIndex().entries()]
    .reduce((map, [index, row]) => map.set(row.id, index), new Map<ID, number>()));

  /**
   * Count of all nodes in the tree.
   */
  public readonly totalCount: Signal<number | undefined> = computed((): number | undefined => {
    const totalCount = this.directChildrenCount();
    if (totalCount === undefined) {
      return undefined;
    }

    return this.values()
      .flatMap(entry => entry.page.status() === 'error' ? [] : entry.page.value()?.rows ?? [])
      .filter(row => row.expanded())
      .reduce((visibleCount, row) => visibleCount + (row.childrenCache.totalCount() ?? 0), totalCount);
  });

  constructor(public readonly isRoot: boolean = false) {}

  public has(key: SciTableCacheKey): boolean {
    return this._pages().has(key);
  }

  public get(key: SciTableCacheKey): SciTableCacheEntry<T> | undefined {
    return this._pages().get(key);
  }

  public set(key: SciTableCacheKey, entry: SciTableCacheEntry<T>): void {
    this._pages.update(pages => {
      const cacheCopy = new Map(pages);
      const existing = cacheCopy.get(key);
      if (existing) {
        cacheCopy.delete(key);
        existing.dispose();
      }

      cacheCopy.set(key, entry);
      return cacheCopy;
    });
    this._latestCacheKey.set(key);
  }

  /**
   * Deletes the specified page from the cache, but only if still loading.
   */
  public deleteIfLoading(key: SciTableCacheKey): void {
    this._pages.update(cache => {
      const cacheCopy = new Map(cache);

      const existing = cacheCopy.get(key);
      if (existing?.page.isLoading()) {
        cacheCopy.delete(key);
        existing.dispose();
      }

      return cacheCopy;
    });
  }

  public clear(): void {
    this._latestCacheKey.set(undefined);
    this._pages.update(cache => {
      for (const entry of cache.values()) {
        entry.dispose();
      }
      return new Map();
    });
  }

  private projectRows(rowsByIndex: Map<number, SciTableRow<T>> = new Map<number, SciTableRow<T>>(), indexOffset: number = 0): {indexOffset: number; rowsByIndex: Map<number, SciTableRow<T>>} {
    const totalCount = this.directChildrenCount() ?? 0;
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

  public rowsByLocalIndex(): Map<number, SciTableCacheRow<T>> {
    return this.values()
      .reduce((rowsByIndex, page) => {
        if (page.page.status() !== 'error') {
          page.page.value()?.rows.forEach((row, index) => rowsByIndex.set(page.start + index, row));
        }
        return rowsByIndex;
      }, new Map<number, SciTableCacheRow<T>>());
  }
}

export interface SciTableCacheEntry<T> {
  page: ResourceRef<{rows: SciTableCacheRow<T>[]; totalCount: number} | undefined>;
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
