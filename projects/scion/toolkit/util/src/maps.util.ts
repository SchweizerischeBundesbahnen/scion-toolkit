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
 * Provides utility methods for {@link Map}.
 */
export namespace Maps {

  /**
   * Creates a {@link Map} from the given map-like object. If given a `Map`, it is returned. If given `null` or `undefined`, by default, returns an empty {@link Map}.
   */
  export function coerce<T = any>(mapLike: Map<string, T> | Dictionary<T> | undefined | null, options?: {coerceNullOrUndefined: true}): NonNullable<Map<string, T>>;
  export function coerce<T = any>(mapLike: Map<string, T> | Dictionary<T> | undefined | null, options: {coerceNullOrUndefined: false}): Map<string, T> | null | undefined;
  export function coerce<T = any>(mapLike: Map<string, T> | Dictionary<T> | undefined | null, options?: {coerceNullOrUndefined?: boolean}): Map<string, T> | null | undefined {
    if (mapLike === null || mapLike === undefined) {
      if (options?.coerceNullOrUndefined ?? true) {
        return new Map<string, T>();
      }
      return mapLike;
    }

    if (mapLike instanceof Map) {
      return mapLike;
    }

    // Data sent from one JavaScript realm to another is serialized with the structured clone algorithm.
    // Although the algorithm supports the `Map` data type, a deserialized map object cannot be checked to be instance of `Map`.
    // This is most likely because the serialization takes place in a different realm.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
    // @see http://man.hubwiz.com/docset/JavaScript.docset/Contents/Resources/Documents/developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm.html
    try {
      return new Map(mapLike as unknown as Map<string, T>);
    }
    catch {
      // noop
    }

    return Object
      .entries(mapLike)
      .reduce(
        (map: Map<string, T>, [key, value]: [string, T]) => map.set(key, value),
        new Map<string, T>(),
      );
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
