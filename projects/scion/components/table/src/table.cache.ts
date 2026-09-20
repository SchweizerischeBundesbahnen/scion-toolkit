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
import {SciRow} from './table.model';
import {Objects} from '@scion/toolkit/util';

export interface TableCacheEntry<T> {
  rows: ResourceRef<SciRow<T>[]>;
  start: number;
  end: number;
  dispose: () => void;
}

type TableCacheKey = `${number}-${number}`;

export class TableCache<T> {

  private readonly _cache = signal(new Map<TableCacheKey, TableCacheEntry<T>>());

  public readonly loading: Signal<boolean> = computed(() => this.values().some(entry => entry.rows.isLoading()));
  public readonly error: Signal<Error | undefined> = computed(() => this.values().find(entry => entry.rows.error())?.rows.error());
  public readonly values: Signal<TableCacheEntry<T>[]> = computed(() => [...this._cache().values()]);

  public readonly rowsByIndex: Signal<Map<number, SciRow<T>>> = computed(() => this.values()
    .flatMap(page => page.rows.value())
    .reduce((acc, row) => acc.set(row.index, row), new Map<number, SciRow<T>>()), {equal: Objects.isEqual});

  public readonly rowsById: Signal<Map<unknown, SciRow<T>>> = computed(() => this.values()
    .flatMap(page => page.rows.value())
    .reduce((acc, row) => row.id !== undefined ? acc.set(row.id, row) : acc, new Map<unknown, SciRow<T>>()), {equal: Objects.isEqual});

  public has(key: TableCacheKey): boolean {
    return this._cache().has(key);
  }

  public get(key: TableCacheKey): TableCacheEntry<T> | undefined {
    return this._cache().get(key);
  }

  public set(key: TableCacheKey, entry: TableCacheEntry<T>): void {
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

  /**
   * Deletes the specified page from the cache, but only if still loading.
   */
  public deleteIfLoading(key: TableCacheKey): void {
    const cacheEntry = this._cache().get(key);
    if (!cacheEntry?.rows.isLoading()) {
      return;
    }

    this._cache.update(cache => {
      const cacheCopy = new Map(cache);
      cacheCopy.delete(key);
      cacheEntry.dispose();
      return cacheCopy;
    });
  }

  public clear(): void {
    this._cache.update(cache => {
      for (const entry of cache.values()) {
        entry.dispose();
      }
      return new Map();
    });
  }
}
