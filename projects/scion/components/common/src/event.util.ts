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
 * Indicates whether the given event was triggered from an input element.
 *
 * @docs-private Not public API. For internal use only.
 */
export function ɵisEventFromInput(event: Event): boolean {
  if (event.target instanceof Element && event.target.closest('input, textarea, select') !== null) {
    return true;
  }
  if (event.target instanceof HTMLElement && event.target.isContentEditable) {
    return true;
  }
  return false;
}

/**
 * Indicates whether the given event was triggered from a button.
 *
 * @docs-private Not public API. For internal use only.
 */
export function ɵisEventFromButton(event: Event): boolean {
  return event.target instanceof Element && event.target.closest('button') !== null;
}
