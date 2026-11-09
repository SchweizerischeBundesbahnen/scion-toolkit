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

  private readonly _cache = signal(new Map<ID, ResourceRef<SciTableRow<T, ID>[]>>());

  private readonly _idsByPage = computed(() => [...this._cache().entries()].reduce((map, [id, page]) => {
    const ids = map.get(page) ?? new Set<ID>();
    return map.set(page, ids.add(id));
  }, new Map<ResourceRef<SciTableRow<T, ID>[]>, Set<ID>>()));

  public readonly rowsById: Signal<Map<ID, SciTableRow<T, ID>>> = computed(() => this._pages()
    .flatMap(page => page.status() === 'error' ? [] : page.value())
    .reduce((acc, row) => row.id !== skeletonRowId ? acc.set(row.id, row) : acc, new Map<ID, SciTableRow<T, ID>>()), {equal: Objects.isEqual});

  private readonly _pages = computed(() => [...new Set(this._cache().values())]);

  public readonly loading: Signal<boolean> = computed(() => this._pages().some(page => page.isLoading()));
  public readonly error: Signal<boolean> = computed(() => this._pages().some(page => page.status() === 'error'));

  public has(id: ID): boolean {
    return this._cache().has(id);
  }

  public set(ids: ID[], page: ResourceRef<SciTableRow<T, ID>[]>): void {
    this._cache.update(cache => {
      const newCache = new Map(cache);
      ids.forEach(id => newCache.set(id, page));
      return newCache;
    });
  }

  public deleteIfLoading(ids: ID[]): void {
    this._cache.update(cache => {
      const cacheCopy = new Map(cache);
      const pages = new Set(ids.map(id => cacheCopy.get(id)));

      for (const id of ids) {
        if (cacheCopy.get(id)?.isLoading()) {
          cacheCopy.delete(id);
        }
      }

      // Dispose pages which have no ids left pointing to them.
      // TODO [ask etienne] Zusammenführen mit oben?
      for (const page of pages) {
        if (!page || !page.isLoading()) {
          continue;
        }


        // if ([...(this._idsByPage().get(page) ?? [])].every(id => ids.includes(id))) {
        // page.value().map(row => row.id)
        if (Objects.isEqual(this._idsByPage().get(page), new Set(ids))) {
          page.destroy();
        }
      }

      return cacheCopy;
    });
  }

  public reloadFailed(): void {
    for (const page of this._pages()) {
      if (page.status() === 'error') {
        page.reload();
      }
    }
  }

  public clear(): void {
    this._cache.update(cache => {
      for (const page of cache.values()) {
        page.destroy();
      }
      return new Map();
    });
  }
}
