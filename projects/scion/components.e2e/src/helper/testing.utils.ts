/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator} from '@playwright/test';
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
