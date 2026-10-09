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

export class SciTableCache<T, ID> {

  private readonly _resourcesById = signal(new Map<unknown, ResourceRef<SciTableRow<T, ID>[] | undefined>>());

  private readonly _idsByResource = computed(() => [...this._resourcesById().entries()].reduce((map, [id, resource]) => {
    const ids = map.get(resource) ?? new Set();
    ids.add(id);
    return map.set(resource, ids);
  }, new Map<ResourceRef<SciTableRow<T, ID>[] | undefined>, Set<unknown>>()));

  public readonly rowsById: Signal<Map<ID, SciTableRow<T, ID>>> = computed(() => [...this._resourcesById().values()]
    .flatMap(resource => resource.status() === 'error' ? [] : resource.value() ?? [])
    .reduce((acc, row) => row.id ? acc.set(row.id, row) : acc, new Map<ID, SciTableRow<T, ID>>()), {equal: Objects.isEqual});

  private readonly _resources = computed(() => {
    const resources = new Set(this._resourcesById().values());
    return [...resources];
  });

  public readonly empty: Signal<boolean> = computed(() => this._resourcesById().size === 0);
  public readonly loading: Signal<boolean> = computed(() => this._resources().some(entry => entry.isLoading()));
  public readonly error: Signal<Error | undefined> = computed(() => {
    return this._resources().find(resource => resource.status() === 'error')?.error();
  });

  public has(key: unknown): boolean {
    return this._resourcesById().has(key);
  }

  public get(key: unknown): ResourceRef<SciTableRow<T, ID>[] | undefined> | undefined {
    return this._resourcesById().get(key);
  }

  public set(ids: unknown[], resource: ResourceRef<SciTableRow<T, ID>[] | undefined>): void {
    this._resourcesById.update(cache => {
      const newCache = new Map(cache);
      for (const id of ids) {
        newCache.set(id, resource);
      }
      return newCache;
    });
  }

  public deleteIfLoading(ids: unknown[]): void {
    this._resourcesById.update(cache => {
      const cacheCopy = new Map(cache);
      const resources = new Set(ids.map(id => cacheCopy.get(id)));

      for (const id of ids) {
        if (cacheCopy.get(id)?.isLoading()) {
          cacheCopy.delete(id);
        }
      }

      // Destroy resources, which have no ids left pointing to them.
      for (const resource of resources) {
        if (!resource) {
          continue;
        }
        const idsByResource = this._idsByResource().get(resource);
        if (resource.isLoading() && [...(idsByResource ?? [])].every(id => ids.includes(id))) {
          resource.destroy();
        }
      }

      return cacheCopy;
    });
  }

  public clear(): void {
    this._resourcesById.update(cache => {
      for (const entry of new Set(cache.values())) {
        entry.destroy();
      }
      return new Map();
    });
  }
}
