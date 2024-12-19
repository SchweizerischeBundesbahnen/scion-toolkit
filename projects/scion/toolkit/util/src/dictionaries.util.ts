/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Defined} from './defined.util';

/**
 * Provides dictionary utility methods.
 */
export namespace Dictionaries {

  /**
   * Creates a {@link Dictionary} from the given dictionary-like object. If given a `Dictionary`, it is returned. If given `null` or `undefined`, by default, returns an empty {@link Dictionary}.
   */
  export function coerce<T = any>(dictionaryLike: Dictionary<T> | Map<string, T> | undefined | null, options?: {coerceNullOrUndefined: true}): NonNullable<Dictionary<T>>;
  export function coerce<T = any>(dictionaryLike: Dictionary<T> | Map<string, T> | undefined | null, options: {coerceNullOrUndefined: false}): Dictionary<T> | null | undefined;
  export function coerce<T = any>(dictionaryLike: Dictionary<T> | Map<string, T> | undefined | null, options?: {coerceNullOrUndefined?: boolean}): Dictionary<T> | null | undefined {
    if (dictionaryLike === null || dictionaryLike === undefined) {
      if (Defined.orElse(options?.coerceNullOrUndefined, true)) {
        return {};
      }
      return dictionaryLike;
    }

    if (dictionaryLike instanceof Map) {
      return createDictionaryFromMap(dictionaryLike) as Dictionary<T>;
    }

    // Data sent from one JavaScript realm to another is serialized with the structured clone algorithm.
    // Although the algorithm supports the `Map` data type, a deserialized map object cannot be checked to be instance of `Map`.
    // This is most likely because the serialization takes place in a different realm.
    // @see https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm
    // @see http://man.hubwiz.com/docset/JavaScript.docset/Contents/Resources/Documents/developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Structured_clone_algorithm.html
    try {
      const map = new Map(dictionaryLike as any); // eslint-disable-line @typescript-eslint/no-unsafe-argument
      return createDictionaryFromMap(map) as Dictionary<T>;
    }
    catch {
      // noop
    }

    return dictionaryLike;
  }

  /**
   * Returns a new {@link Dictionary} with `undefined` values removed.
   */
  export function withoutUndefinedEntries(object: Dictionary): Dictionary {
    return Object.entries(object).reduce<Dictionary>((dictionary, [key, value]) => {
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
export interface Dictionary<T = unknown> { // eslint-disable-line @typescript-eslint/consistent-indexed-object-style
  [key: string]: T;
}

function createDictionaryFromMap(map: Map<unknown, unknown>): Dictionary {
  return Array
    .from(map.entries())
    .reduce(
      (dictionary: Dictionary, [key, value]): Dictionary => {
        dictionary[key as string] = value;
        return dictionary;
      },
      {},
    );
}
