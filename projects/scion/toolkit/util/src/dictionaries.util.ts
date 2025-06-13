/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

/**
 * Provides utilities for a dictionary.
 */
export namespace Dictionaries {

  /**
   * Creates a {@link Dictionary} from the given dictionary-like object. If given a `Dictionary`, it is returned. If given `null` or `undefined`, by default, returns an empty {@link Dictionary}.
   */
  export function coerce<T = unknown>(dictionaryLike: Dictionary<T> | Map<string, T> | Iterable<[string, T]> | undefined | null, options?: {coerceNullOrUndefined: true}): NonNullable<Dictionary<T>>;
  export function coerce<T = unknown>(dictionaryLike: Dictionary<T> | Map<string, T> | Iterable<[string, T]> | undefined | null, options: {coerceNullOrUndefined: false}): Dictionary<T> | null | undefined;
  export function coerce<T = unknown>(dictionaryLike: Dictionary<T> | Map<string, T> | Iterable<[string, T]> | undefined | null, options?: {coerceNullOrUndefined?: boolean}): Dictionary<T> | null | undefined {
    if (!dictionaryLike) {
      const orElseEmpty = options?.coerceNullOrUndefined ?? true;
      return orElseEmpty ? {} : dictionaryLike;
    }

    if (Symbol.iterator in dictionaryLike) {
      return Object.fromEntries(dictionaryLike);
    }

    return dictionaryLike;
  }

  /**
   * Returns a new {@link Dictionary} with `undefined` values removed.
   */
  export function withoutUndefinedEntries<T = unknown>(object: Dictionary<T | undefined>): Dictionary<T> {
    return Object.entries(object).reduce<Dictionary<T>>((dictionary, [key, value]) => {
      if (value !== undefined) {
        dictionary[key] = value;
      }
      return dictionary;
    }, {});
  }
}

/**
 * Represents an object with a variable number of properties, whose keys are not known at development time.
 */
export interface Dictionary<T = unknown> {
  [key: string]: T;
}
