/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

/**
 * Returns the value clamped to the inclusive range of min and max.
 */
export function clamp(value: number, minmax: {min?: number; max?: number}): number {
  const {min = -Infinity, max = Infinity} = minmax;
  if (min > max) {
    throw Error(`[ClampError] Min must be smaller than or equal to max [min=${min}, max=${max}]`);
  }

  return Math.min(Math.max(value, min), max);
}

/**
 * Returns whether the value is between the specified range (inclusive).
 */
export function isBetween(value: number, range: {from: number; to: number}): boolean {
  return value >= range.from && value <= range.to;
}
