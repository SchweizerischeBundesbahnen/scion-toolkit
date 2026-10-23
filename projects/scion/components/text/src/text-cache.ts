/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationRef, DestroyRef, inject, Injector, runInInjectionContext, Signal} from '@angular/core';
import {createDestroyableInjector} from '@scion/components/common';

/**
 * Cache for texts currently used in the application.
 */
export class TextCache {

  private readonly _cache = new Map<string, TextCacheEntry>();

  /**
   * Gets the text for the given key. Texts are constructed via the passed computation function if absent (on cache miss).
   *
   * Cached texts are evicted when no longer used, tracked via a reference count based on the provided injector;
   * once all tracked injectors for a cache entry are destroyed, the cache entry is evicted.
   *
   * The computation function is invoked in the root injection context. The injection context is destroyed when the last consumer is disposed.
   */
  public computeIfAbsent(cacheKey: string, computeFn: () => Signal<string>, options?: {injector?: Injector}): Signal<string> {
    const injector = options?.injector ?? inject(Injector);
    const cacheEntry = this._cache.get(cacheKey) ?? (() => {
      const cacheEntryInjector = createDestroyableInjector({parent: injector.get(ApplicationRef).injector});
      const cacheEntry: TextCacheEntry = {
        text: runInInjectionContext(cacheEntryInjector, computeFn),
        refCount: 0,
        dispose: () => cacheEntryInjector.destroy(),
      };
      this._cache.set(cacheKey, cacheEntry);
      return cacheEntry;
    })();

    cacheEntry.refCount++;

    // Decrement reference count when tracked injector is destroyed.
    injector.get(DestroyRef).onDestroy(() => {
      if (--cacheEntry.refCount === 0) {
        // Dispose when no longer used.
        cacheEntry.dispose();
        this._cache.delete(cacheKey);
      }
    });

    return cacheEntry.text;
  }
}

/**
 * Cache entry for texts currently used in the application.
 */
interface TextCacheEntry {
  /**
   * Cached text.
   */
  text: Signal<string>;
  /**
   * Reference count of consumers using this cache entry.
   */
  refCount: number;
  /**
   * Disposes this entry, destroying the {@link injector} to release allocated resources.
   */
  dispose: () => void;
}
