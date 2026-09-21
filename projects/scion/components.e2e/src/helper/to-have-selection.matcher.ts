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
import {RequireOne} from '@scion/toolkit/types';
import {retryOnError} from '@scion/toolkit/testing';

/**
 * Provides the implementation of {@link CustomMatchers#toHaveTextSelection}.
 */
export async function toHaveTextSelection(locator: Locator, selection: RequireOne<{start: number; end: number}>): Promise<MatcherReturnType> {
  try {
    // Retry to behave like a Playwright web-first assertion.
    await retryOnError(() => assertSelection(locator, selection));
    return {pass: true, message: () => 'passed'};
  }
  catch (error) {
    return {pass: false, message: () => error instanceof Error ? error.message : `${error}`};
  }
}

async function assertSelection(locator: Locator, expected: RequireOne<{start: number; end: number}>): Promise<void> {
  await locator.evaluate((element, expected) => {
    if (!(element instanceof HTMLInputElement) && !(element instanceof HTMLTextAreaElement)) {
      throw new Error('Element must be an input or textarea.');
    }

    if (expected.start !== undefined && element.selectionStart !== expected.start) {
      throw Error(`Expected selection to start at position ${expected.start}, but starts at ${element.selectionStart}.`);
    }

    if (expected.end !== undefined && element.selectionEnd !== expected.end) {
      throw Error(`Expected selection to end at position ${expected.end}, but ends at ${element.selectionEnd}.`);
    }
  }, expected);
}
