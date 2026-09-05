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
  // TODO [egob] Consider renaming to rows
  items: Signal<SciRow<T>[] | undefined>;
  start: number;
  end: number;
  dispose: () => void;
}

type TableCacheKey = `${number}-${number}`;

export class TableCache<T> {
  private readonly _cache = signal(new Map<TableCacheKey, TableCacheEntry<T>>());

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
   * Deletes page from cache, but only if it has no items loaded.
   */
  public deleteIfEmpty(key: TableCacheKey): void {
    this._cache.update(cache => {
      const cacheCopy = new Map(cache);

      const existing = cacheCopy.get(key);
      if (existing && existing.items() === undefined) {
        cacheCopy.delete(key);
        existing.dispose();
      }

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

  public get values(): Signal<Array<TableCacheEntry<T>>> {
    return computed(() => [...this._cache().values()]);
  }

  public get rowsByIndex(): Signal<Map<number, SciRow<T>>> {
    return computed(() => this.values()
      .flatMap(page => page.items() ?? [])
      .reduce((acc, row) => acc.set(row.index, row), new Map<number, SciRow<T>>()), {equal: Objects.isEqual});
  }

  public get rowsById(): Signal<Map<unknown, SciRow<T>>> {
    return computed(() => this.values()
      .flatMap(page => page.items() ?? [])
      .filter(row => row.id !== undefined)
      .reduce((acc, row) => acc.set(row.id!, row), new Map<unknown, SciRow<T>>()), {equal: Objects.isEqual});
  }
}
