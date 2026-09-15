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
  rows: Signal<SciRow<T>[] | undefined>;
  start: number;
  end: number;
  dispose: () => void;
}

type TableCacheKey = `${number}-${number}`;
type ID = unknown;

export class TableCache<T> {
  private readonly _pages = signal(new Map<TableCacheKey, TableCacheEntry<T>>());
  private readonly _children = signal(new Map<ID, TableCache<T>>());

  public readonly rowsByIndex = computed(() => {
    let additionalRows = 0;
    return this.values()
      .flatMap(page => page.rows() ?? [])
      .reduce((acc, row, index) => {
        const nextIndex = index + additionalRows;
        acc.set(nextIndex, row);
        const childCache = this._children().get(row.id);
        if (childCache && row.expanded()) {
          [...childCache.rowsByIndex().values()].forEach((childRow, childIndex) => {
            acc.set(nextIndex + childIndex + 1, childRow);
            additionalRows++;
          });
        }
        return acc;
      }, new Map<number, SciRow<T>>());
  }, {equal: Objects.isEqual});

  public readonly rowsById: Signal<Map<ID, SciRow<T>>> = computed(() => this.values()
    .flatMap(page => page.rows() ?? [])
    .filter(row => row.id !== undefined)
    .reduce((acc, row) => {
      acc.set(row.id, row);
      const childCache = this._children().get(row.id);
      if (childCache && row.expanded()) {
        return new Map([...acc.entries(), ...childCache.rowsById().entries()]);
      }
      return acc;
    }, new Map<ID, SciRow<T>>()), {equal: Objects.isEqual});

  public indexById = computed(() => [...this.rowsByIndex().entries()]
    .reduce((map, [index, row]) => map.set(row.id, index), new Map<ID, number>()));

  constructor(public readonly id: ID) {
  }

  public has(key: TableCacheKey): boolean {
    return this._pages().has(key);
  }

  public get(key: TableCacheKey): TableCacheEntry<T> | undefined {
    return this._pages().get(key);
  }

  public set(key: TableCacheKey, entry: TableCacheEntry<T>): void {
    this._pages.update(cache => {
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

  public hasLoadedChildren(id: ID): boolean {
    if (id === this.id) {
      return this.values().length > 0;
    }

    return [...this._children().values()].some(cache => cache.hasLoadedChildren(id));
  }

  public addChildPage(id: ID, entry: TableCacheEntry<T>): void {
    if (this.values().flatMap(entry => entry.rows() ?? []).some(row => row.id === id)) {
      this._children.update(children => {
        const newChildren = new Map(children);
        if (!newChildren.has(id)) {
          newChildren.set(id, new TableCache<T>(id));
        }
        newChildren.get(id)!.set(`${entry.start}-${entry.end}`, entry);
        return newChildren;
      });
      return;
    }
    for (const child of this._children().values()) {
      child.addChildPage(id, entry);
    }
  }

  /**
   * Deletes page from cache, but only if it has no items loaded.
   */
  public deleteIfEmpty(key: TableCacheKey): void {
    this._pages.update(cache => {
      const cacheCopy = new Map(cache);

      const existing = cacheCopy.get(key);
      if (existing && existing.rows() === undefined) {
        cacheCopy.delete(key);
        existing.dispose();
      }

      return cacheCopy;
    });
  }

  public clear(): void {
    this._pages.update(cache => {
      for (const entry of cache.values()) {
        entry.dispose();
      }
      return new Map();
    });
    this._children.update(cache => {
      for (const entry of cache.values()) {
        entry.clear();
      }
      return new Map();
    });
  }

  public get values(): Signal<Array<TableCacheEntry<T>>> {
    return computed(() => [...this._pages().values()]);
  }
}
