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
import {SciTableRow, skeletonRowId} from './table.model';
import {Objects} from '@scion/toolkit/util';

export class SciTableCache<T, ID> {

  private readonly _entriesById = signal(new Map<ID, SciTableCacheEntry<T, ID>>());

  private readonly _idsByEntry = computed(() => [...this._entriesById().entries()].reduce((map, [id, entry]) => {
    const ids = map.get(entry) ?? new Set();
    ids.add(id);
    return map.set(entry, ids);
  }, new Map<SciTableCacheEntry<T, ID>, Set<ID>>()));

  public readonly rowsById: Signal<Map<ID, SciTableRow<T, ID>>> = computed(() => [...this._entriesById().values()]
    .flatMap(entry => entry.rows.status() === 'error' ? [] : entry.rows.value() ?? [])
    .reduce((acc, row) => row.id !== skeletonRowId ? acc.set(row.id, row) : acc, new Map<ID, SciTableRow<T, ID>>()), {equal: Objects.isEqual});

  private readonly _entries = computed(() => {
    const entries = new Set(this._entriesById().values());
    return [...entries];
  });

  public readonly empty: Signal<boolean> = computed(() => this._entriesById().size === 0);
  public readonly loading: Signal<boolean> = computed(() => this._entries().some(entry => entry.rows.isLoading()));
  public readonly error: Signal<boolean> = computed(() => this._entries().some(entry => entry.rows.status() === 'error'));

  public has(key: ID): boolean {
    return this._entriesById().has(key);
  }

  public get(key: ID): SciTableCacheEntry<T, ID> | undefined {
    return this._entriesById().get(key);
  }

  public set(ids: ID[], entry: SciTableCacheEntry<T, ID>): void {
    this._entriesById.update(cache => {
      const newCache = new Map(cache);
      for (const id of ids) {
        newCache.set(id, entry);
      }
      return newCache;
    });
  }

  public deleteIfLoading(ids: ID[]): void {
    this._entriesById.update(cache => {
      const cacheCopy = new Map(cache);
      const entries = new Set(ids.map(id => cacheCopy.get(id)));

      for (const id of ids) {
        if (cacheCopy.get(id)?.rows.isLoading()) {
          cacheCopy.delete(id);
        }
      }

      // Dispose entries, which have no ids left pointing to them.
      for (const entry of entries) {
        if (!entry) {
          continue;
        }
        const idsByEntry = this._idsByEntry().get(entry);
        if (entry.rows.isLoading() && [...(idsByEntry ?? [])].every(id => ids.includes(id))) {
          entry.dispose();
        }
      }

      return cacheCopy;
    });
  }

  public reloadFailed(): void {
    for (const entry of this._entries()) {
      if (entry.rows.status() === 'error') {
        entry.rows.reload();
      }
    }
  }

  public clear(): void {
    this._entriesById.update(cache => {
      for (const entry of new Set(cache.values())) {
        entry.dispose();
      }
      return new Map();
    });
  }
}

export interface SciTableCacheEntry<T, ID> {
  rows: ResourceRef<SciTableRow<T, ID>[] | undefined>;
  dispose: () => void;
}
