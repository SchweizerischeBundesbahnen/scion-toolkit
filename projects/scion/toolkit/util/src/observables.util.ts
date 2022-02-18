/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {from, Observable, of} from 'rxjs';

export namespace Observables {

  /**
   * Creates an `Observable` from the passed value, which will emit the value and then complete,
   * or, if passing an `Observable`, returns it unchanged. If passing a `Promise`, it is converted
   * to an `Observable`.
   */
  export function coerce<T>(value: T | Observable<T> | Promise<T>): Observable<T> {
    if (value instanceof Observable) {
      return value;
    }
    if (value instanceof Promise) {
      return from(value);
    }
    return of(value);
  }
}
