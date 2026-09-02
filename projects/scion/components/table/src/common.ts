/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Observable} from 'rxjs';

export type MaybeAsync<T> = T | Promise<T> | Observable<T>;

/**
 * CSS minmax for use in a CSS grid.
 */
export function cssMinmax(minmax: {min: number; max: number | string}): string {
  const min = `${minmax.min}px`;
  const max = typeof minmax.max === 'number' ? `${minmax.max}px` : minmax.max;
  return `minmax(${min}, ${max})`;
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
