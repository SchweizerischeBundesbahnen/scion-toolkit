/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Arrays} from './arrays.util';
import {Dictionary} from './dictionaries.util';

/**
 * Provides utilities for {@link Map}.
 */
export namespace Maps {

  /**
   * Creates a {@link Map} from the given map-like object. If given a `Map`, it is returned. If given `null` or `undefined`, by default, returns an empty {@link Map}.
   */
  export function coerce<T = unknown>(mapLike: Map<string, T> | Dictionary<T> | Iterable<[string, T]> | undefined | null, options?: {coerceNullOrUndefined: true}): NonNullable<Map<string, T>>;
  export function coerce<T = unknown>(mapLike: Map<string, T> | Dictionary<T> | Iterable<[string, T]> | undefined | null, options: {coerceNullOrUndefined: false}): Map<string, T> | null | undefined;
  export function coerce<T = unknown>(mapLike: Map<string, T> | Dictionary<T> | Iterable<[string, T]> | undefined | null, options?: {coerceNullOrUndefined?: boolean}): Map<string, T> | null | undefined {
    if (!mapLike) {
      const orElseEmpty = options?.coerceNullOrUndefined ?? true;
      return orElseEmpty ? new Map() : mapLike;
    }

    if (mapLike instanceof Map) {
      return mapLike;
    }

    if (Symbol.iterator in mapLike) {
      return new Map(mapLike);
    }

    return new Map(Object.entries(mapLike));
  }

  /**
   * Adds the given value into a {@link Set} in the multi value {@link Map}.
   */
  export function addSetValue<K, V>(multiValueMap: Map<K, Set<V>>, key: K, value: V): Map<K, Set<V>> {
    const values = multiValueMap.get(key) ?? new Set<V>();
    return multiValueMap.set(key, values.add(value));
  }

  /**
   * Removes the given value or values matching the given predicate from the multi {@link Map}.
   *
   * @return `true` if the element was removed, or `false` otherwise.
   */
  export function removeSetValue<K, V>(multiValueMap: Map<K, Set<V>>, key: K, value: V | PredicateFn<V>): boolean {
    const values = multiValueMap.get(key) ?? new Set<V>();

    let hasRemoved;
    if (typeof value === 'function') {
      const predicateFn = value as PredicateFn<V>;
      hasRemoved = Array.from(values)
        .filter(predicateFn)
        .reduce<boolean>((removed, it) => values.delete(it) || removed, false);
    }
    else {
      hasRemoved = values.delete(value);
    }

    if (hasRemoved && !values.size) {
      multiValueMap.delete(key);
    }
    return hasRemoved;
  }

  /**
   * Adds the given value into an {@link Array} in the multi value {@link Map}.
   */
  export function addListValue<K, V>(map: Map<K, V[]>, key: K, value: V): Map<K, V[]> {
    const values = map.get(key) ?? [];
    return map.set(key, values.concat(value));
  }

  /**
   * Removes the given value or values matching the given predicate from the multi {@link Map}.
   *
   * @return `true` if the element was removed, or `false` otherwise.
   */
  export function removeListValue<K, V>(multiValueMap: Map<K, V[]>, key: K, value: V | PredicateFn<V>): boolean {
    const values = multiValueMap.get(key) ?? [];
    const hasRemoved = Arrays.remove(values, value, {firstOnly: false}).length > 0;
    if (hasRemoved && !values.length) {
      multiValueMap.delete(key);
    }
    return hasRemoved;
  }
}

/**
 * Represents a predicate function which returns `true` or `false`.
 */
export type PredicateFn<T> = (value: T) => boolean;
