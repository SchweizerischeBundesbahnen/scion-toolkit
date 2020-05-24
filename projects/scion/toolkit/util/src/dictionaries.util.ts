/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Defined } from './defined.util';

/**
 * Provides dictionary utility methods.
 */
export class Dictionaries {

  private constructor() {
  }

  /**
   * Creates a {@link Dictionary} from the given dictionary-like object. If given a `Dictionary`, it is returned. If given `null` or `undefined`, by default, returns an empty {@link Dictionary}.
   */
  public static coerce<T = any>(dictionaryLike: Dictionary<T> | Map<string, T>, options?: { coerceNullOrUndefined?: boolean }): Dictionary<T> | null {
    if (dictionaryLike === null || dictionaryLike === undefined) {
      if (Defined.orElse(options && options.coerceNullOrUndefined, true)) {
        return {};
      }
      return dictionaryLike as null | undefined;
    }

    if (dictionaryLike instanceof Map) {
      return Array
        .from(dictionaryLike.entries())
        .reduce(
          (obj: Dictionary, [key, value]: [string, any]): Dictionary => ({...obj, [key]: value}),
          {},
        );
    }
    return dictionaryLike;
  }
}

/**
 * Represents an object with a variable number of properties, whose keys are not known at development time.
 */
export interface Dictionary<T = any> {
  [key: string]: T;
}
