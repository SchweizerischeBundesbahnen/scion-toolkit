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

  private readonly _cache = signal(new Map<SciTableCacheKey, SciTableCacheEntry<T>>());

  public readonly loading: Signal<boolean> = computed(() => this.values().some(entry => entry.rows.isLoading()));
  public readonly error: Signal<Error | undefined> = computed(() => this.values().find(entry => entry.rows.error())?.rows.error());
  public readonly values: Signal<SciTableCacheEntry<T>[]> = computed(() => [...this._cache().values()]);

  public readonly rowsByIndex: Signal<Map<number, SciTableRow<T>>> = computed(() => this.values()
    .flatMap(page => page.rows.value())
    .reduce((acc, row) => acc.set(row.index, row), new Map<number, SciTableRow<T>>()), {equal: Objects.isEqual});

  public readonly rowsById: Signal<Map<unknown, SciTableRow<T>>> = computed(() => this.values()
    .flatMap(page => page.rows.value())
    .reduce((acc, row) => row.id !== undefined ? acc.set(row.id, row) : acc, new Map<unknown, SciTableRow<T>>()), {equal: Objects.isEqual});

  public has(key: SciTableCacheKey): boolean {
    return this._cache().has(key);
  }

  public get(key: SciTableCacheKey): SciTableCacheEntry<T> | undefined {
    return this._cache().get(key);
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

  /**
   * Deletes the specified page from the cache, but only if still loading.
   */
  public deleteIfLoading(key: SciTableCacheKey): void {
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

export interface SciTableCacheEntry<T> {
  rows: ResourceRef<SciTableRow<T>[]>;
  start: number;
  end: number;
  dispose: () => void;
}

type SciTableCacheKey = `${number}-${number}`;
