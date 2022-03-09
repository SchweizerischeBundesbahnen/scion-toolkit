/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {EMPTY, fromEvent, merge, Observable, Observer, of, Subject, TeardownLogic} from 'rxjs';
import {distinctUntilChanged, filter, mapTo, mergeMap, startWith, takeUntil} from 'rxjs/operators';

/**
 * Allows observing items contained in web storage (local storage or session storage).
 *
 * Items are added in the JSON format to the storage.
 *
 * Because web storage does not notify about same document storage changes, always use {@link WebStorage#put}
 * to add items to the storage, or {@link WebStorage#remove} to remove items from the storage.
 *
 * #### Storage implementors:
 * - Local storage:
 *   Maintains a persistent storage area per origin.
 * - Session storage:
 *   Maintains a separate storage area per origin that is available for the duration of the page session
 *   (as long as the browser is open, including page reloads and restores).
 */
export class WebStorage {

  private _currentDocumentChange$ = new Subject<string>();

  /**
   * Provide the storage implementor: {@link window.localStorage} or {@link window.sessionStorage}.
   */
  constructor(private _storage: Storage) {
  }

  /**
   * Puts the given item into storage. The item is serialized to JSON.
   */
  public put(key: string, value: any): void {
    if (value === undefined || value === null) {
      this._storage.setItem(key, value);
    }
    else {
      this._storage.setItem(key, JSON.stringify(value));
    }
    this._currentDocumentChange$.next(key);
  }

  /**
   * Puts the given item into storage, but only if not present. The item is serialized to JSON.
   *
   * Instead of an item you can pass a provider function to produce the item.
   */
  public putIfAbsent(key: string, value: any | (() => any)): void {
    if (!this.isPresent(key)) {
      this.put(key, typeof value === 'function' ? value() : value);
    }
  }

  /**
   * Returns the item associated with the given key, or `undefined` if not found.
   *
   * Expects the value to be stored in JSON format. Throws an error if the value cannot be parsed.
   */
  public get<T>(key: string): T | null | undefined {
    const item = this._storage.getItem(key);

    // Web storage returns `null` if there is no item associated with the key.
    if (item === null) {
      return undefined;
    }

    // If the value `undefined` is associated with the key, web storage returns 'undefined' as string.
    if (item === 'undefined') {
      return undefined;
    }

    // If the value `null` is associated with the key, web storage returns 'null' as string.
    if (item === 'null') {
      return null;
    }

    return JSON.parse(item);
  }

  /**
   * Removes the item associated with the given key.
   */
  public remove(key: string): void {
    this._storage.removeItem(key);
    this._currentDocumentChange$.next(key);
  }

  /**
   * Checks if an item is present in the storage. Present also includes `null` and `undefined` items.
   */
  public isPresent(key: string): boolean {
    return this._storage.getItem(key) !== null; // storage returns `null` if not present
  }

  /**
   * Observes the item associated with the given key.
   *
   * Upon subscription, it emits the current item from the storage, but, by default, only if present,
   * and then continuously emits when the item associated with the given key changes. It never completes.
   *
   * When removing the item from the storage, by default, the Observable does not emit.
   *
   * Set `emitIfAbsent` to `true` if to emit `undefined` when removing the item, or if there is no item associated
   * with the given key upon subscription. By default, `emitIfAbsent` is set to `false`.
   */
  public observe$<T>(key: string, options?: {emitIfAbsent?: boolean}): Observable<T> {
    const emitIfAbsent = options?.emitIfAbsent ?? false;
    const otherDocumentChange$ = fromEvent<StorageEvent>(window, 'storage')
      .pipe(
        filter(event => event.storageArea === this._storage),
        mergeMap(event => event.key !== null ? of(event.key) : EMPTY),
      );

    return new Observable((observer: Observer<T>): TeardownLogic => {
      const unsubscribe$ = new Subject<void>();

      merge(this._currentDocumentChange$, otherDocumentChange$)
        .pipe(
          filter(itemKey => itemKey === key),
          startWith(key),
          mergeMap(itemKey => {
            if (!this.isPresent(itemKey)) {
              return emitIfAbsent ? of(undefined) : EMPTY;
            }

            try {
              return of(this.get<any>(itemKey));
            }
            catch (error) {
              console.warn(`Failed to parse item from storage. Invalid JSON. [key=${itemKey}]`, error);
              return EMPTY;
            }
          }),
          distinctUntilChanged(),
          takeUntil(unsubscribe$),
        )
        .subscribe(observer);

      return (): void => {
        unsubscribe$.next();
      };
    });
  }

  /**
   * Notifies when no item is present for the given key. The Observable never completes.
   */
  public absent$(key: string): Observable<void> {
    return this.observe$(key, {emitIfAbsent: true})
      .pipe(
        filter(() => !this.isPresent(key)),
        mapTo(undefined),
      );
  }
}
