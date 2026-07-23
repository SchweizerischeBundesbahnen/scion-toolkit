import {computed, signal, Signal} from '@angular/core';
import {SciRow} from './table.model';

export interface TableCacheEntry<T, ID> {
  items: Signal<SciRow<T, ID>[] | undefined>;
  start: number;
  end: number;
  dispose: () => void;
}

type TableCacheKey = `${number}-${number}`;

export class TableCache<T, ID> {
  private readonly _cache = signal(new Map<TableCacheKey, TableCacheEntry<T, ID>>());

  public get cache(): Signal<Map<TableCacheKey, TableCacheEntry<T, ID>>> {
    return this._cache.asReadonly();
  }

  public has(key: TableCacheKey): boolean {
    return this._cache().has(key);
  }

  public get(key: TableCacheKey): TableCacheEntry<T, ID> | undefined {
    return this._cache().get(key);
  }

  public set(key: TableCacheKey, entry: TableCacheEntry<T, ID>): void {
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

  public get values(): Signal<Array<TableCacheEntry<T, ID>>> {
    return computed(() => [...this._cache().values()]);
  }
}
