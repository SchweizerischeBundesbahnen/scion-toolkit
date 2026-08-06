/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {expect} from '@playwright/test';
import {test} from '../../fixtures';
import {ScrollbarPagePO} from './scrollbar-page.po';

test.describe('sci-scrollbar', () => {

  const viewports = ['shadowDomViewport', 'lightDomViewport'] as Array<keyof Pick<ScrollbarPagePO, 'shadowDomViewport' | 'lightDomViewport'>>;

  viewports.forEach(viewportName => {

    test.describe(viewportName, () => {

      test(`should display scrollbar when hovering the viewport`, async ({page}) => {
        const pagePO = new ScrollbarPagePO(page);
        await pagePO.navigate();

        const viewport = pagePO[viewportName];
        const scrollbar = viewport.verticalScrollbar;

        // Simulate viewport overflow.
        await pagePO.setOverflow({vertical: true});
        await expect(scrollbar.locator).toBeVisible();
        await expect(scrollbar.locator).toHaveCSS('opacity', '0');

        // Hover viewport.
        await viewport.hover();
        await expect(scrollbar.locator).toBeVisible();
        await expect(scrollbar.locator).toHaveCSS('opacity', '1');

        // Move mouse out of the viewport.
        await viewport.moveMouseOutsideViewport();
        await expect(scrollbar.locator).toBeVisible();
        await expect(scrollbar.locator).toHaveCSS('opacity', '0');
      });

      test('should not display scrollbar if no overflow', async ({page}) => {
        const pagePO = new ScrollbarPagePO(page);
        await pagePO.navigate();

        const viewport = pagePO[viewportName];
        const scrollbar = viewport.verticalScrollbar;

        // Simulate viewport overflow.
        await pagePO.setOverflow({vertical: true});
        await viewport.hover();

        // Expect scrollbar to display.
        await expect(scrollbar.locator).toBeVisible();

        // Simulate no viewport overflow.
        await pagePO.setOverflow({vertical: false});
        await viewport.hover();

        // Expect scrollbar not to display.
        await expect(scrollbar.locator).not.toBeVisible();
      });

      test('should enlarge thumb on hover and scroll', async ({page}) => {
        const pagePO = new ScrollbarPagePO(page);
        await pagePO.navigate();

        const viewport = pagePO[viewportName];
        const scrollbar = viewport.verticalScrollbar;

        // Simulate viewport overflow.
        await pagePO.setOverflow({vertical: true});

        // Hover viewport.
        await viewport.hover();
        await expect(scrollbar.locator).toBeVisible();

        // Capture scrollbar thumb width.
        const thumbWidth = await scrollbar.thumb.width();

        // Hover thumb.
        await scrollbar.thumb.hover();

        // Expect larger thumb size.
        await expect.poll(() => scrollbar.thumb.width()).toBeGreaterThan(thumbWidth);

        // Press mouse button on thumb.
        await page.mouse.down();

        // Expect larger thumb size.
        await expect.poll(() => scrollbar.thumb.width()).toBeGreaterThan(thumbWidth);

        // Move mouse out of scrollbar while pressing thumb.
        await viewport.hover();

        // Expect larger thumb size.
        await expect.poll(() => scrollbar.thumb.width()).toBeGreaterThan(thumbWidth);

        // Move mouse out of viewport while pressing thumb.
        await viewport.moveMouseOutsideViewport();

        // Expect larger thumb size.
        await expect.poll(() => scrollbar.thumb.width()).toBeGreaterThan(thumbWidth);

        // Release mouse.
        await page.mouse.up();

        // Expect default thumb size.
        await expect.poll(() => scrollbar.thumb.width()).toEqual(thumbWidth);
      });
    });
  });
});
