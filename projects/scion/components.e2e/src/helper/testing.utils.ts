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
 * Waits for a value to become stable.
 * This function returns the value if it hasn't changed during `probeInterval` (defaults to 100ms).
 */
export async function waitUntilStable<A>(value: () => Promise<A> | A, options?: {isStable?: (previous: A, current: A) => boolean; probeInterval?: number}): Promise<A> {
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
 * Returns the opacity of given element.
 */
export function getElementOpacity(locator: Locator): Promise<number> {
  return locator.evaluate((element: HTMLElement): number => +getComputedStyle(element).opacity);
}
