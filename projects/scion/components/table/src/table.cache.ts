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

  private readonly _entriesById = signal(new Map<ID, ResourceRef<SciTableRow<T, ID>[]>>());

  private readonly _idsByEntry = computed(() => [...this._entriesById().entries()].reduce((map, [id, entry]) => {
    const ids = map.get(entry) ?? new Set();
    ids.add(id);
    return map.set(entry, ids);
  }, new Map<ResourceRef<SciTableRow<T, ID>[]>, Set<ID>>()));

  public readonly rowsById: Signal<Map<ID, SciTableRow<T, ID>>> = computed(() => this._entries()
    .flatMap(entry => entry.status() === 'error' ? [] : entry.value())
    .reduce((acc, row) => row.id !== skeletonRowId ? acc.set(row.id, row) : acc, new Map<ID, SciTableRow<T, ID>>()), {equal: Objects.isEqual});

  private readonly _entries = computed(() => [...new Set(this._entriesById().values())]);

  public readonly loading: Signal<boolean> = computed(() => this._entries().some(entry => entry.isLoading()));
  public readonly error: Signal<boolean> = computed(() => this._entries().some(entry => entry.status() === 'error'));

  public has(key: ID): boolean {
    return this._entriesById().has(key);
  }

  public set(ids: ID[], entry: ResourceRef<SciTableRow<T, ID>[]>): void {
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
        if (cacheCopy.get(id)?.isLoading()) {
          cacheCopy.delete(id);
        }
      }

      // Dispose entries, which have no ids left pointing to them.
      for (const entry of entries) {
        if (!entry) {
          continue;
        }
        const idsByEntry = this._idsByEntry().get(entry);
        if (entry.isLoading() && [...(idsByEntry ?? [])].every(id => ids.includes(id))) {
          entry.destroy();
        }
      }

      return cacheCopy;
    });
  }

  public reloadFailed(): void {
    for (const entry of this._entries()) {
      if (entry.status() === 'error') {
        entry.reload();
      }
    }
  }

  public clear(): void {
    this._entriesById.update(cache => {
      for (const entry of new Set(cache.values())) {
        entry.destroy();
      }
      return new Map();
    });
  }
}
