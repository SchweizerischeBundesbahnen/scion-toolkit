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
 * Provides the implementation of {@link CustomMatchers#toBeEmpty}.
 */
export async function toBeStrictEmpty(locator: Locator): Promise<MatcherReturnType> {
  return locator
    .evaluate(element => {
      if (element.children.length) {
        throw Error(`Expected element to be empty, but has child elements.`);
      }

      if (element.textContent.trim().length) {
        throw Error(`Expected element to be empty, but has text.`);
      }
    })
    .then(() => ({pass: true, message: () => 'passed'}))
    .catch((error: unknown) => ({pass: false, message: () => error instanceof Error ? error.message : `${error}`}));
}
