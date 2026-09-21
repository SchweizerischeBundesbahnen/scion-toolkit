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
import {MenuPO} from '../../../menu/menu.po';
import {retryOnError} from '@scion/toolkit/testing';

/**
 * Provides the implementation of {@link CustomAsyncMatcherFactories#toHaveMenuPosition}.
 */
export const toHaveMenuPositionCustomMatcher: jasmine.CustomAsyncMatcherFactories = {
  toHaveMenuPosition: (): CustomAsyncMatcher => {
    return {
      async compare(actual: MenuPO, expected: ExpectedMenuPosition, failOutput: string | undefined): Promise<CustomMatcherResult> {
        try {
          await retryOnError(() => {
            assertMenuPosition(expected, actual);
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

function assertMenuPosition(expected: ExpectedMenuPosition, actual: MenuPO): void {
  const menuRect = actual.nativeElement.getBoundingClientRect();

  const {anchor, menuX, menuY, anchorX, anchorY} = expected;
  const originXOffset = expected.anchorXOffset ?? 0;
  const originYOffset = expected.anchorYOffset ?? 0;

  // Anchor is point
  if ('x' in anchor && 'y' in anchor) {
    if (menuX === 'left') {
      if (menuRect.left !== anchor.x) {
        throw Error(`[DOMAssertError] Menu's left position expected to be '${anchor.x}' but was '${menuRect.left}'`);
      }
    }

    if (menuX === 'right') {
      if (menuRect.right !== anchor.x) {
        throw Error(`[DOMAssertError] Menu's right position expected to be '${anchor.x}' but was '${menuRect.right}'`);
      }
    }

    if (menuY === 'top') {
      if (!isCloseTo(menuRect.top, anchor.y)) {
        throw Error(`[DOMAssertError] Menu's top position expected to be close to '${anchor.y}' but was '${menuRect.top}'`);
      }
    }

    if (menuY === 'bottom') {
      if (!isCloseTo(menuRect.bottom, anchor.y)) {
        throw Error(`[DOMAssertError] Menu's bottom position expected to be close to '${anchor.y}' but was '${menuRect.bottom}'`);
      }
    }
  }
  // Anchor is html element
  else {
    const elementRect = anchor.getBoundingClientRect();

    if (menuX === 'left') {
      if (anchorX === 'left') {
        if (!isCloseTo(menuRect.left, elementRect.left + originXOffset)) {
          throw Error(`[DOMAssertError] Menu's left position expected to be close to '${elementRect.left}' but was '${menuRect.left}'`);
        }
      }

      if (anchorX === 'right') {
        if (!isCloseTo(menuRect.left, elementRect.right + originXOffset)) {
          throw Error(`[DOMAssertError] Menu's left position expected to be close to '${elementRect.right}' but was '${menuRect.left}'`);
        }
      }
    }

    if (menuX === 'right') {
      if (anchorX === 'left') {
        if (!isCloseTo(menuRect.right, elementRect.left + originXOffset)) {
          throw Error(`[DOMAssertError] Menu's right position expected to be close to '${elementRect.left + originXOffset}' but was '${menuRect.right}'`);
        }
      }

      if (anchorX === 'right') {
        if (!isCloseTo(menuRect.right, elementRect.right + originXOffset)) {
          throw Error(`[DOMAssertError] Menu's right position expected to be '${elementRect.right + originXOffset}' but was '${menuRect.right}'`);
        }
      }
    }

    if (menuY === 'top') {
      if (anchorY === 'top') {
        if (!isCloseTo(menuRect.top, elementRect.top + originYOffset)) {
          throw Error(`[DOMAssertError] Menu's top position expected to be close to '${elementRect.top + originYOffset}' but was '${menuRect.top}'`);
        }
      }
      if (anchorY === 'bottom') {
        if (!isCloseTo(menuRect.top, elementRect.bottom + originYOffset)) {
          throw Error(`[DOMAssertError] Menu's top position expected to be close to '${elementRect.bottom + originYOffset}' but was '${menuRect.top}'`);
        }
      }
    }

    if (menuY === 'bottom') {
      if (anchorY === 'bottom') {
        if (!isCloseTo(menuRect.bottom, elementRect.bottom + originYOffset)) {
          throw Error(`[DOMAssertError] Menu's bottom position expected to be close to '${elementRect.bottom + originYOffset}' but was '${menuRect.bottom}'`);
        }
      }
      if (anchorY === 'top') {
        if (!isCloseTo(menuRect.bottom, elementRect.top + originYOffset)) {
          throw Error(`[DOMAssertError] Menu's bottom position expected to be close to '${elementRect.top + originYOffset}' but was '${menuRect.bottom}'`);
        }
      }
    }
  }
}

export interface ExpectedMenuPosition {
  anchor: Point | HTMLElement;
  anchorX?: 'left' | 'right';
  anchorY?: 'top' | 'bottom';
  anchorXOffset?: number;
  anchorYOffset?: number;
  menuX?: 'left' | 'right';
  menuY?: 'top' | 'bottom';
}

export interface Point {
  x: number;
  y: number;
}

export const SUB_MENU_VERTICAL_OFFSET = 4; // --ɵsci-menu-padding-block

function isCloseTo(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) <= 1;
}
