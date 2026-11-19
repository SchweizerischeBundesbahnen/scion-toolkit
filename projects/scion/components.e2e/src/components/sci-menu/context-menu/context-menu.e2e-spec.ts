/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test} from '../../../fixtures';
import {ContextMenuPagePo} from './context-menu-page.po';
import {expect} from '@playwright/test';

test.describe('sci-menu/context-menu', () => {

  test('should open context-menu', async ({page}) => {
    const pagePO = new ContextMenuPagePo(page);
    await pagePO.navigate();

    await pagePO.locator.click({button: 'right'});

    await expect(pagePO.menu).toBeVisible();
  });

  test('should open context-menu on when moving off the menu while clicking', async ({page}) => {
    const pagePO = new ContextMenuPagePo(page);
    await pagePO.navigate();

    await pagePO.hover();
    await page.mouse.down({button: 'right'});
    await page.mouse.move(0, 0);
    await page.mouse.up({button: 'right'});

    await expect(pagePO.menu).toBeVisible();
  });
});
