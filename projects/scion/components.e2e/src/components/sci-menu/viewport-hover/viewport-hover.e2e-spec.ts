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
import {ViewportHoverPagePO} from './viewport-hover-page.po';
import {expectScrollbar} from '../../sci-scrollbar/scrollbar-matcher';
import {expect} from '@playwright/test';

test.describe('sci-menu/viewport-hover', () => {

  test('should display scrollbar when hovering the viewport', async ({page}) => {
    const pagePO = new ViewportHoverPagePO(page);
    await pagePO.navigate();

    await expect(pagePO.menu).toBeVisible();
    await expectScrollbar(pagePO.menuScrollbar).toDisplay({opacity: 0});

    // Hover the viewport.
    await pagePO.menuViewport.hover();
    await expectScrollbar(pagePO.menuScrollbar).toDisplay({opacity: 1});

    // Stop hovering viewport.
    await page.mouse.move(0, 0);
    await expectScrollbar(pagePO.menuScrollbar).toDisplay({opacity: 0});

    // Hover scroll thumb.
    await pagePO.menuScrollThumb.hover();
    await expectScrollbar(pagePO.menuScrollbar).toDisplay({opacity: 1});

    // Click scroll thumb.
    await page.mouse.down();
    await page.waitForTimeout(500);
    await expectScrollbar(pagePO.menuScrollbar).toDisplay({opacity: 1});

    // Stop hovering viewport.
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    await expectScrollbar(pagePO.menuScrollbar).toDisplay({opacity: 1});

    // Release mouse.
    await page.mouse.up();
    await expectScrollbar(pagePO.menuScrollbar).toDisplay({opacity: 0});
  });

  test('should not display scrollbar when hovering the filter field', async ({page}) => {
    const pagePO = new ViewportHoverPagePO(page);
    await pagePO.navigate();

    await expect(pagePO.menu).toBeVisible();
    await expectScrollbar(pagePO.menuScrollbar).toDisplay({opacity: 0});

    // Hover the filter field.
    await pagePO.menuFilter.hover();
    await page.waitForTimeout(500);
    await expectScrollbar(pagePO.menuScrollbar).toDisplay({opacity: 0});

    // Hover the viewport.
    await pagePO.menuViewport.hover();
    await expectScrollbar(pagePO.menuScrollbar).toDisplay({opacity: 1});
  });
});
