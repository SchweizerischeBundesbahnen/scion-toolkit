/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import CustomMatcherResult = jasmine.CustomMatcherResult;
import CustomAsyncMatcher = jasmine.CustomAsyncMatcher;
import {retryOnError} from '@scion/toolkit/testing';
import {Arrays} from '@scion/toolkit/util';
import {MenubarItemPO, MenubarPO} from '../../../menubar/menubar.po';
import {ExpectedSciMenuItem} from './expected-menu.model';

/**
 * Provides the implementation of {@link CustomAsyncMatcherFactories#toEqualMenubar}.
 */
export const toEqualMenubarCustomMatcher: jasmine.CustomAsyncMatcherFactories = {
  toEqualMenubar: (): CustomAsyncMatcher => {
    return {
      async compare(actual: MenubarPO, expected: ExpectedSciMenuItem[], failOutput: string | undefined): Promise<CustomMatcherResult> {
        try {
          await retryOnError(() => {
            assertMenubar(expected, actual);
          });
          return pass();
        }
        catch (error) {
          return fail(error instanceof Error ? error.message : `${error}`);
        }

        function pass(): CustomMatcherResult {
          return {pass: true};
        }

        function fail(message: string): CustomMatcherResult {
          return {pass: false, message: message.concat(failOutput ? ` (${failOutput})` : '')};
        }
      },
    };
  },
};

export function assertMenubar(expected: ExpectedSciMenuItem[], menubar: MenubarPO): void {
  assertMenubarItems(expected, menubar.items());
}

export function assertMenubarItems(expected: ExpectedSciMenuItem[], items: MenubarItemPO[]): void {
  if (items.length !== expected.length) {
    throw Error(`[DOMAssertError] Expected menubar item count to be ${expected.length}, but was ${items.length}`);
  }

  expected.forEach((item, index) => {
    assertMenubarItem(item, items[index]!);
  });
}

function assertMenubarItem(expected: ExpectedSciMenuItem, actual: MenubarItemPO): void {
  if (expected.label !== undefined) {
    if (actual.label !== expected.label) {
      throw Error(`[DOMAssertError] Expected label of menubar item to be ${expected.label}, but was ${actual.label}`);
    }
  }

  if (expected.cssClass !== undefined) {
    Arrays.coerce(expected.cssClass).forEach(cssClass => {
      if (!actual.nativeElement.classList.contains(cssClass)) {
        throw Error(`[DOMAssertError] Css classes of menubar item do not not match [expected=${expected.cssClass}, actual=${actual.nativeElement.classList}]`);
      }
    });
  }

  if (expected.attributes !== undefined) {
    Object.entries(expected.attributes).forEach(([key, value]) => {
      if (actual.debugElement.attributes[key] !== value) {
        throw Error(`[DOMAssertError] Attributes of menubar item do not not match [expected={key=${key}, value=${value}}, actual=${[Object.entries(actual.debugElement.attributes).map((key, value) => `${key}="${value}"`).join(' ')]}]`);
      }
    });
  }
}
