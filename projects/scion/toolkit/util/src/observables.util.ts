/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { from, Observable, of } from 'rxjs';

export class Observables {

  private constructor() {
  }

  /**
   * Creates an `Observable` from the given value, or returns the value if already an `Observable`. If given a `Promise`, it is converted into an `Observable`.
   */
  public static coerce<T>(value: T | Observable<T> | Promise<T>): Observable<T> {
    if (value instanceof Observable) {
      return value;
    }
    if (value instanceof Promise) {
      return from(value);
    }
    return of(value);
  }
}
