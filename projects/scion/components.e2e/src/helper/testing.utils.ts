/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator, Page} from '@playwright/test';
import {exhaustMap, filter, firstValueFrom, map, pairwise, timer} from 'rxjs';

/**
 * Returns `true` if given element is the active element.
 */
export async function isActiveElement(testee: Locator): Promise<boolean> {
  return await testee.evaluate(el => el === document.activeElement);
}

/**
 * Creates a {@link DomRect} from given rectangle.
 *
 * Similar to {@link DOMRect#fromRect} but can be used in e2e-tests executed in NodeJS.
 */
export function fromRect(rect: DOMRectInit | null): DomRect {
  const width = rect?.width ?? 0;
  const height = rect?.height ?? 0;
  const x = rect?.x ?? 0;
  const y = rect?.y ?? 0;
  return {
    x,
    y,
    width,
    height,
    top: y,
    bottom: y + height,
    left: x,
    right: x + width,
    hcenter: x + width / 2,
    vcenter: y + height / 2,
  };
}

/**
 * Position and size of an element.
 */
export interface DomRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  hcenter: number;
  vcenter: number;
}

/**
 * Waits for a value to become stable.
 *
 * This function returns the value if it hasn't changed during `probeInterval` (defaults to 100ms).
 */
export async function waitUntilStable<A>(value: () => Promise<A> | A, options?: {isStable?: (previous: A, current: A) => boolean; probeInterval?: number}): Promise<A> {
  if (options?.probeInterval === 0) {
    return value();
  }

  const value$ = timer(0, options?.probeInterval ?? 100)
    .pipe(
      exhaustMap(async () => await value()),
      pairwise(),
      filter(([previous, current]) => options?.isStable ? options.isStable(previous, current) : previous === current),
      map(([previous]) => previous),
    );
  return firstValueFrom(value$);
}

/**
 * Waits for Angular to finish pending microtasks and stabilize.
 */
export async function waitUntilAngularStable(page: Page): Promise<void> {
  await page.evaluate(async () => {
    if (!('__whenAngularStable' in window)) {
      throw Error('Function `__whenAngularStable` not found on window');
    }

    await (window.__whenAngularStable as () => Promise<void>)();
  });
}

/**
 * Checks whether the element maintains a default stacking level, allowing a subsequent DOM sibling (without an explicit z-index) to completely cover it.
 */
export function hasDefaultStackingLevel(locator: Locator): Promise<boolean> {
  return locator.evaluate(async (element: HTMLElement) => {
    const elementBounds = element.getBoundingClientRect();

    // Create a fixed overlay aligned with the element's bounds.
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.top = `${elementBounds.top}px`;
    overlay.style.left = `${elementBounds.left}px`;
    overlay.style.width = `${elementBounds.width}px`;
    overlay.style.height = `${elementBounds.height}px`;
    overlay.style.backgroundColor = 'gray';

    // Insert overlay immediately after the element in DOM order.
    element.after(overlay);

    // Test that no element overlaps the overlay.
    try {
      for (let x = elementBounds.left + 1; x < elementBounds.right - 1; x += 10) {
        for (let y = elementBounds.top + 1; y < elementBounds.bottom - 1; y += 10) {
          if (document.elementFromPoint(x, y) !== overlay) {
            return false;
          }
        }
      }
      return true;
    }
    finally {
      overlay.remove();
    }
  });
}
