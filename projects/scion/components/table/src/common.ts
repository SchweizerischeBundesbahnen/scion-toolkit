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
 * Creates a range of integers starting at `start` and ending at `end` (including `end`).
 */
export function rangeInclusive(start: number, end: number): number[] {
  const range: number[] = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
}

/**
 * Indicates whether the given event was triggered from an input element.
 */
export function isFromInput(event: Event): boolean {
  if (event.target instanceof Element && event.target.closest('input, textarea, select') !== null) {
    return true;
  }
  if (event.target instanceof HTMLElement && event.target.isContentEditable) {
    return true;
  }
  return false;
}

/**
 * Indicates whether the given keyboard event was triggered from a button.
 */
export function isFromButton(event: Event): boolean {
  return event.target instanceof Element && event.target.closest('button') !== null;
}
