/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {expect, Locator} from '@playwright/test';

export function expectScrollbar(locator: Locator): {toDisplay(options?: {opacity?: 0 | 1}): Promise<void>; not: {toDisplay(): Promise<void>}} {
  return {
    async toDisplay(options?: {opacity?: 0 | 1}): Promise<void> {
      await expect(locator).toHaveCSS('opacity', `${options?.opacity ?? 1}`);
      await expect(locator).toBeVisible();
    },
    not: {
      async toDisplay(): Promise<void> {
        await expect(locator).not.toBeVisible();
      },
    },
  };
}
