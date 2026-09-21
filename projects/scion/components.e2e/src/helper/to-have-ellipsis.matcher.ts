/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */
import {MatcherReturnType} from 'playwright/types/test';
import {Locator} from '@playwright/test';

/**
 * Provides the implementation of {@link CustomMatchers#toHaveEllipsis}.
 */
export async function toHaveEllipsis(locator: Locator): Promise<MatcherReturnType> {
  return locator
    .evaluate(element => {
      const computedStyle = getComputedStyle(element);

      if (computedStyle.display !== 'block' && computedStyle.display !== 'inline-block' && computedStyle.display !== 'inline') {
        throw Error(`Expected element to have ellipsis. Ellipsis is only supported on block or inline-block elements.`);
      }

      if (computedStyle.textOverflow !== 'ellipsis') {
        throw Error(`Expected element to have ellipsis. Style 'text-overflow' must be set to 'ellipsis', not '${computedStyle.textOverflow}'.`);
      }

      if (computedStyle.overflow !== 'hidden') {
        throw Error(`Expected element to have ellipsis. Style 'overflow' must be set to 'hidden', not '${computedStyle.overflow}'.`);
      }

      if (computedStyle.whiteSpace !== 'nowrap') {
        throw Error(`Expected element to have ellipsis. Style 'white-space' must be set to 'nowrap', not '${computedStyle.whiteSpace}'.`);
      }

      if (element.scrollWidth <= element.clientWidth) {
        throw Error(`Expected element to have ellipsis. Text does not overflow.`);
      }
    })
    .then(() => ({pass: true, message: () => 'passed'}))
    .catch((error: unknown) => ({pass: false, message: () => error instanceof Error ? error.message : `${error}`}));
}
