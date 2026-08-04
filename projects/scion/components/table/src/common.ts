/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {from, isObservable, Observable, of} from 'rxjs';

export type MaybeAsync<T> = T | Promise<T> | Observable<T>;
export function coerceObservable<T>(input: MaybeAsync<T>): Observable<T> {
  if (input instanceof Promise || isObservable(input)) {
    return from(input);
  }
  return of(input);
}

/**
 * CSS minmax for use in a CSS grid.
 * Either sets the max width to the given max or the preferred if no max is given.
 */
export function minmax(min: number, preferred: string, max: number | undefined): string {
  const maxDef = max === undefined ? preferred : `${max}px`;
  return `minmax(${min}px, ${maxDef})`;
}

/**
 * Creates a range of integers starting at `start` and ending at `end` (including `end`).
 */
export function rangeInclusive(start: number, end: number): number[] {
  const range: number[] = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
}
