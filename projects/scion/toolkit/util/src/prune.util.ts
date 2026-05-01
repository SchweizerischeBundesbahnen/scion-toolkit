/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Removes entries with `undefined` values from the given `Map`, optionally recursive, optionally pruning if empty.
 *
 * Defaults to non-recursive, not pruning empty objects or collections.
 */
export function prune<K, V, Options extends PruneOptions>(map: Map<K, V>, options?: Options): Options extends {pruneIfEmpty: true} ? Map<K, V> | undefined : Map<K, V>;
export function prune<K, V>(map: Map<K, V> | undefined, options?: PruneOptions): Map<K, V> | undefined;

/**
 * Removes elements which are `undefined` from the given `Set`, optionally recursive, optionally pruning if empty.
 *
 * Defaults to non-recursive, not pruning empty objects or collections.
 */
export function prune<T, Options extends PruneOptions>(set: Set<T>, options?: Options): Options extends {pruneIfEmpty: true} ? Set<T> | undefined : Set<T>;
export function prune<T>(set: Set<T> | undefined, options?: PruneOptions): Set<T> | undefined;

/**
 * Removes elements which are `undefined` from the given `Array`, optionally recursive, optionally pruning if empty.
 *
 * Defaults to non-recursive, not pruning empty objects or collections.
 */
export function prune<T, Options extends PruneOptions>(array: T[], options?: Options): Options extends {pruneIfEmpty: true} ? T[] | undefined : T[];
export function prune<T>(array: T[] | undefined, options?: PruneOptions): T[] | undefined;

/**
 * Removes properties which are `undefined` from the given object, optionally recursive, optionally pruning if empty.
 *
 * Defaults to non-recursive, not pruning empty objects or collections.
 */
export function prune<T extends object, O extends PruneOptions>(object: T, options?: O): O extends {pruneIfEmpty: true} ? T | undefined : T;
export function prune<T>(object: T | undefined, options?: PruneOptions): T | undefined;

export function prune<T>(object: T | undefined, options?: PruneOptions): T | undefined {
  const pruneIfEmpty = options?.pruneIfEmpty ?? false;
  const recursive = options?.recursive ?? false;

  if (object === null || object === undefined) {
    return object;
  }

  // Prune Map.
  if (object instanceof Map) {
    object.forEach((value, key) => {
      const prunedValue: unknown = recursive ? prune(value, options) : value;
      if (prunedValue === undefined) {
        object.delete(key);
      }
    });
    if (pruneIfEmpty && !object.size) {
      return undefined;
    }
    return object;
  }

  // Prune Set.
  if (object instanceof Set) {
    [...object].forEach(value => {
      const prunedValue: unknown = recursive ? prune(value, options) : value;
      if (prunedValue === undefined) {
        object.delete(value);
      }
    });
    if (pruneIfEmpty && !object.size) {
      return undefined;
    }
    return object;
  }

  // Prune Array.
  if (Array.isArray(object)) {
    for (let i = object.length - 1; i >= 0; i--) {
      const prunedValue: unknown = recursive ? prune(object[i], options) : object[i];
      if (prunedValue === undefined) {
        object.splice(i, 1);
      }
    }
    if (!object.length && pruneIfEmpty) {
      return undefined;
    }
    return object;
  }

  // Prune object literal.
  if (typeof object === 'object') {
    Object.entries(object).forEach(([key, value]) => {
      const prunedValue: unknown = recursive ? prune(value, options) : value;
      if (prunedValue === undefined) {
        delete (object as Record<string, unknown>)[key]; // eslint-disable-line @typescript-eslint/no-dynamic-delete
      }
    });
    if (pruneIfEmpty && !Object.keys(object).length) {
      return undefined;
    }
  }
  return object;
}

/**
 * Options for the {@link prune} function.
 */
export interface PruneOptions {
  /**
   * If `true`, returns `undefined` if the element is empty after pruning.
   * With `recursive`, also removes empty objects and collections at any level.
   *
   * Defaults to `false`.
   */
  pruneIfEmpty?: true;
  /**
   * If `true`, removes `undefined` values from nested objects and collections, recursively.
   *
   * Defaults to `false`.
   */
  recursive?: true;
}
