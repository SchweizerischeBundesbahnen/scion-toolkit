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

test.describe('sci-viewport/hover', () => {

  test('should display vertical scrollbar when hovering the viewport', async ({page}) => {
    const pagePO = new ViewportHoverPagePO(page);
    await pagePO.navigate();

    await pagePO.setVerticalOverflow(true);
    await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 0});
    await expectScrollbar(pagePO.horizontalScrollbar).not.toDisplay();

    // Hover the viewport.
    await pagePO.viewport.hover();
    await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 1});
    await expectScrollbar(pagePO.horizontalScrollbar).not.toDisplay();

    // Do not hover the viewport.
    await page.mouse.move(0, 0);
    await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 0});
    await expectScrollbar(pagePO.horizontalScrollbar).not.toDisplay();

    // Hover scroll thumb.
    await pagePO.verticalScrollThumb.hover();
    await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 1});
    await expectScrollbar(pagePO.horizontalScrollbar).not.toDisplay();

    // Click scroll thumb.
    await page.mouse.down();
    await page.waitForTimeout(500);
    await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 1});
    await expectScrollbar(pagePO.horizontalScrollbar).not.toDisplay();

    // Scroll outside viewport.
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 1});
    await expectScrollbar(pagePO.horizontalScrollbar).not.toDisplay();

    // Release mouse.
    await page.mouse.up();
    await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 0});
    await expectScrollbar(pagePO.horizontalScrollbar).not.toDisplay();
  });

  test('should display horizontal scrollbar when hovering the viewport', async ({page}) => {
    const pagePO = new ViewportHoverPagePO(page);
    await pagePO.navigate();

    await pagePO.setHorizontalOverflow(true);
    await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 0});
    await expectScrollbar(pagePO.verticalScrollbar).not.toDisplay();

    // Hover the viewport.
    await pagePO.viewport.hover();
    await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 1});
    await expectScrollbar(pagePO.verticalScrollbar).not.toDisplay();

    // Do not hover the viewport.
    await page.mouse.move(0, 0);
    await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 0});
    await expectScrollbar(pagePO.verticalScrollbar).not.toDisplay();

    // Hover scroll thumb.
    await pagePO.horizontalScrollThumb.hover();
    await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 1});
    await expectScrollbar(pagePO.verticalScrollbar).not.toDisplay();

    // Click scroll thumb.
    await page.mouse.down();
    await page.waitForTimeout(500);
    await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 1});
    await expectScrollbar(pagePO.verticalScrollbar).not.toDisplay();

    // Scroll outside viewport.
    await page.mouse.move(0, 0);
    await page.waitForTimeout(500);
    await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 1});
    await expectScrollbar(pagePO.verticalScrollbar).not.toDisplay();

    // Release mouse.
    await page.mouse.up();
    await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 0});
    await expectScrollbar(pagePO.verticalScrollbar).not.toDisplay();
  });

  test('should display scrollbars when hovering the viewport', async ({page}) => {
    const pagePO = new ViewportHoverPagePO(page);
    await pagePO.navigate();

    await pagePO.setVerticalOverflow(true);
    await pagePO.setHorizontalOverflow(true);
    await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 0});
    await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 0});

    // Hover the viewport.
    await pagePO.viewport.hover();
    await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 1});
    await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 1});

    // Do not hover the viewport.
    await page.mouse.move(0, 0);
    await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 0});
    await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 0});

    await test.step('Vertical Scroll Thumb', async () => {
      // Hover vertical scroll thumb.
      await pagePO.verticalScrollThumb.hover();
      await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 1});
      await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 0});

      // Click vertical scroll thumb.
      await page.mouse.down();
      await page.waitForTimeout(500);
      await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 1});
      await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 0});

      // Scroll outside viewport.
      await page.mouse.move(0, 0);
      await page.waitForTimeout(500);
      await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 1});
      await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 0});

      // Release mouse.
      await page.mouse.up();
      await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 0});
      await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 0});
    });

    await test.step('Horizontal Scroll Thumb', async () => {
      // Hover vertical scroll thumb.
      await pagePO.horizontalScrollThumb.hover();
      await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 0});
      await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 1});

      // Click vertical scroll thumb.
      await page.mouse.down();
      await page.waitForTimeout(500);
      await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 0});
      await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 1});

      // Scroll outside viewport.
      await page.mouse.move(0, 0);
      await page.waitForTimeout(500);
      await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 0});
      await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 1});

      // Release mouse.
      await page.mouse.up();
      await expectScrollbar(pagePO.verticalScrollbar).toDisplay({opacity: 0});
      await expectScrollbar(pagePO.horizontalScrollbar).toDisplay({opacity: 0});
    });
  });
});
