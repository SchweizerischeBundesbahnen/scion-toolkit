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

  constructor(private readonly _maxSize: number = 100) {
  }

  public get size(): Signal<number> {
    return computed(() => this._cache().size);
  }

  public has(key: TableCacheKey): Signal<boolean> {
    return computed(() => this._cache().has(key));
  }

  public get(key: TableCacheKey): Signal<TableCacheEntry<T, ID> | undefined> {
    // Readd the item, to mark it as accessed.
    this._cache.update(cache => {
      const cacheCopy = new Map(cache);
      const entry = cacheCopy.get(key);
      if (entry) {
        cacheCopy.delete(key);
        cacheCopy.set(key, entry);
      }
      return cacheCopy;
    });

    return computed(() => this._cache().get(key));
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

    this.evictUntilWithinLimit();
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

  private evictUntilWithinLimit(): void {
    this._cache.update(cache => {
      const cacheCopy = new Map(cache);
      while (cacheCopy.size > this._maxSize) {
        const oldestKey = cacheCopy.keys().next().value;
        if (!oldestKey) {
          break;
        }

        const oldestEntry = cacheCopy.get(oldestKey);
        cacheCopy.delete(oldestKey);
        oldestEntry?.dispose();
      }
      return cacheCopy;
    });
  }
}
