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
 * Provides helper functions for working with objects.
 */
export const Objects = {

  /**
   * Compares two objects for deep equality.
   *
   * Supported types: Record, Array, Map, Set, and primitives.
   *
   * The property order is ignored when comparing records. The element order in arrays is relevant unless specified otherwise in options.
   *
   * @param a - The first object to compare.
   * @param b - The second object to compare.
   * @param options - Controls how to compare two objects.
   * @param options.ignoreArrayOrder - Controls whether to ignore the element order when comparing arrays. By default, the order is not ignored.
   * @return `true` if objects are equal, false otherwise.
   */
  isEqual: (a: unknown, b: unknown, options?: {ignoreArrayOrder?: true}): boolean => {
    if (a === b) {
      return true;
    }

    if (!a || !b) {
      return false;
    }

    if (typeof a !== 'object' || typeof b !== 'object') {
      return false;
    }

    // Map equality
    if (a instanceof Map || b instanceof Map) {
      if (!(a instanceof Map) || !(b instanceof Map)) {
        return false;
      }

      if (a.size !== b.size) {
        return false;
      }

      return [...a.entries()].every(([key, value]) => b.has(key) && Objects.isEqual(value, b.get(key), options));
    }

    // Set equality
    if (a instanceof Set || b instanceof Set) {
      if (!(a instanceof Set) || !(b instanceof Set)) {
        return false;
      }

      if (a.size !== b.size) {
        return false;
      }

      return [...a].every(value => [...b].some(other => Objects.isEqual(value, other, options)));
    }

    // Array equality
    const ignoreArrayOrder = options?.ignoreArrayOrder ?? false;
    if (Array.isArray(a) || Array.isArray(b)) {
      if (!(Array.isArray(a)) || !(Array.isArray(b))) {
        return false;
      }

      if (a.length !== b.length) {
        return false;
      }

      if (ignoreArrayOrder) {
        return a.every(value => b.some(other => Objects.isEqual(value, other, options))) && b.every(value => a.some(other => Objects.isEqual(value, other, options)));
      }
      else {
        return a.every((value, index) => Objects.isEqual(value, b[index], options));
      }
    }

    // Object literal equality
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);

    if (aKeys.length !== bKeys.length) {
      return false;
    }

    return aKeys.every(key => Objects.isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key], options));
  },

  /**
   * Stringifies given object to matrix notation: a=b;c=d;e=f
   */
  toMatrixNotation: (object: Record<string, unknown> | null | undefined): string => {
    return Object.entries(object ?? {}).map(([key, value]) => `${key}=${value}`).join(';');
  },

  /**
   * Like {@link Object.keys}, but preserving the data type of keys.
   */
  keys: <T, P extends keyof T>(object: T): P[] => {
    return Object.keys(object as Record<P, unknown>) as Array<P>;
  },

  /**
   * Like {@link Object.values}, but preserving the data type of values and supporting optional properties.
   */
  values: <T, P extends keyof T>(object: T): Array<T[P]> => {
    return Object.values(object as Record<P, T[P]>);
  },

  /**
   * Like {@link Object.entries}, but preserving the data type of keys and supporting optional properties.
   */
  entries: <T, P extends keyof T>(object: T): Array<[P, T[P]]> => {
    return Object.entries(object as Record<P, T[P]>) as Array<[P, T[P]]>;
  },
} as const;
