/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test} from '../../../fixtures';
import {expect} from '@playwright/test';
import {ViewportFocusPagePO} from './viewport-focus-page.po';

test.describe('sci-viewport/focus', () => {

  test('should focus elements of slotted content via sequential keyboard navigation', async ({page}) => {
    const focusPO = new ViewportFocusPagePO(page);
    await focusPO.navigate();

    // focus input field before viewport
    await focusPO.focusInput('before-viewport');
    await expect.poll(() => focusPO.isInputActive('before-viewport')).toBe(true);

    // tab to input field inside viewport
    await focusPO.tab();
    await expect.poll(() => focusPO.isInputActive('inside-viewport')).toBe(true);

    // tab to input field after viewport
    await focusPO.tab();
    await expect.poll(() => focusPO.isInputActive('after-viewport')).toBe(true);

    // tab back to input field inside viewport
    await focusPO.shiftTab();
    await expect.poll(() => focusPO.isInputActive('inside-viewport')).toBe(true);

    // tab back to input field before viewport
    await focusPO.shiftTab();
    await expect.poll(() => focusPO.isInputActive('before-viewport')).toBe(true);
  });
});
