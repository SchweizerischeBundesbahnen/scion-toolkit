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

      test('should display scrollbar when hovering the viewport', async ({page}) => {
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

      test.describe('Vertical Scrolling', () => {

        test('should scroll using the scrollbar thumb', async ({page}) => {
          const pagePO = new ScrollbarPagePO(page);
          await pagePO.navigate();

          const viewport = pagePO[viewportName];
          const scrollbar = viewport.verticalScrollbar;

          // Simulate viewport overflow.
          await pagePO.setOverflow({vertical: true});

          // Hover viewport to display scrollbars.
          await viewport.hover();
          await expect(scrollbar.locator).toBeVisible();

          // Capture viewport and viewport client height.
          const viewportHeight = await viewport.viewportHeight();
          const viewportClientHeight = await viewport.viewportClientHeight();
          const scrollbarBounds = await scrollbar.innerBounds();

          // Press mouse button on the thumb.
          const initialThumbBounds = await scrollbar.thumb.boundingBox();
          const thumbPointerOffset = initialThumbBounds.height / 2;
          await page.mouse.move(initialThumbBounds.hcenter, initialThumbBounds.vcenter);
          await page.mouse.down();

          // Move thumb to the middle of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.vcenter - thumbPointerOffset);
          await expect.poll(() => viewport.scrollTop()).toEqual((viewportClientHeight - viewportHeight) / 2);

          // Move thumb to the bottom of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.bottom, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.bottom - initialThumbBounds.height);
          await expect.poll(() => viewport.scrollTop()).toEqual(viewportClientHeight - viewportHeight);

          // Move thumb to the middle of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.vcenter - thumbPointerOffset);
          await expect.poll(() => viewport.scrollTop()).toEqual((viewportClientHeight - viewportHeight) / 2);

          // Move thumb to the start of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.top, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.top);
          await expect.poll(() => viewport.scrollTop()).toEqual(0);

          // Stop scrolling.
          await page.mouse.up();
        });

        test('should scroll using the scrollbar thumb if not hovering thumb', async ({page}) => {
          const pagePO = new ScrollbarPagePO(page);
          await pagePO.navigate();

          const viewport = pagePO[viewportName];
          const scrollbar = viewport.verticalScrollbar;

          // Simulate viewport overflow.
          await pagePO.setOverflow({vertical: true});

          // Hover viewport to display scrollbars.
          await viewport.hover();
          await expect(scrollbar.locator).toBeVisible();

          // Capture viewport and viewport client height.
          const viewportHeight = await viewport.viewportHeight();
          const viewportClientHeight = await viewport.viewportClientHeight();
          const scrollbarBounds = await scrollbar.innerBounds();

          // Press mouse button on the thumb.
          const initialThumbBounds = await scrollbar.thumb.boundingBox();
          const thumbPointerOffset = initialThumbBounds.height / 2;
          await page.mouse.move(initialThumbBounds.hcenter, initialThumbBounds.vcenter);
          await page.mouse.down();

          // Capture scrollbar thumb width.
          const scrollThumbWidth = await scrollbar.thumb.width();

          // Move pointer 100px to the right (out of thumb)
          await page.mouse.move(initialThumbBounds.hcenter + 100, initialThumbBounds.vcenter);

          // Expect thumb still to display and be enlarged.
          await expect.poll(() => scrollbar.thumb.width()).toEqual(scrollThumbWidth);

          // Move thumb to the middle of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter + 100, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.vcenter - thumbPointerOffset);
          await expect.poll(() => viewport.scrollTop()).toEqual((viewportClientHeight - viewportHeight) / 2);

          // Move thumb to the bottom of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter + 100, scrollbarBounds.bottom, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.bottom - initialThumbBounds.height);
          await expect.poll(() => viewport.scrollTop()).toEqual(viewportClientHeight - viewportHeight);

          // Move thumb to the middle of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter + 100, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.vcenter - thumbPointerOffset);
          await expect.poll(() => viewport.scrollTop()).toEqual((viewportClientHeight - viewportHeight) / 2);

          // Move thumb to the start of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter + 100, scrollbarBounds.top, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.top);
          await expect.poll(() => viewport.scrollTop()).toEqual(0);

          // Stop scrolling.
          await page.mouse.up();
        });

        test('should not scroll when pointer leaves scroll range', async ({page}) => {
          const pagePO = new ScrollbarPagePO(page);
          await pagePO.navigate();
          await pagePO.setCssVariable('--viewport-size', '300px');
          await pagePO.setCssVariable('--viewport-client-overflow-size', '10000px');

          const viewport = pagePO[viewportName];
          const scrollbar = viewport.verticalScrollbar;

          // Simulate viewport overflow.
          await pagePO.setOverflow({vertical: true});

          // Hover viewport to display scrollbars.
          await viewport.hover();
          await expect(scrollbar.locator).toBeVisible();

          // Capture viewport and viewport client height.
          const viewportHeight = await viewport.viewportHeight();
          const viewportClientHeight = await viewport.viewportClientHeight();
          const scrollbarBounds = await scrollbar.innerBounds();

          // Press mouse button on the thumb.
          const initialThumbBounds = await scrollbar.thumb.boundingBox();
          await page.mouse.move(initialThumbBounds.hcenter, initialThumbBounds.vcenter);
          await page.mouse.down();

          // Capture scrollbar thumb width.
          const scrollThumbWidth = await scrollbar.thumb.width();

          // Move pointer before scrollbar top (out of scroll range).
          await page.mouse.move(initialThumbBounds.hcenter, initialThumbBounds.vcenter - 100);

          // Expect thumb still to display and be enlarged.
          await expect.poll(() => scrollbar.thumb.width()).toEqual(scrollThumbWidth);
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.top);
          await expect.poll(() => viewport.scrollTop()).toEqual(0);

          // Move pointer to the start of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.top, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.top);
          await expect.poll(() => viewport.scrollTop()).toEqual(0);

          // Move thumb to the bottom of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.bottom, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.bottom - initialThumbBounds.height);
          await expect.poll(() => viewport.scrollTop()).toEqual(viewportClientHeight - viewportHeight);

          // Move pointer after scrollbar bottom (out of scroll range).
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.bottom + 100, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.bottom - initialThumbBounds.height);
          await expect.poll(() => scrollbar.thumb.width()).toEqual(scrollThumbWidth);
          await expect.poll(() => viewport.scrollTop()).toEqual(viewportClientHeight - viewportHeight);

          // Move pointer to the bottom of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.bottom, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.bottom - initialThumbBounds.height);
          await expect.poll(() => viewport.scrollTop()).toEqual(viewportClientHeight - viewportHeight);

          // Move pointer to the start of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.top, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.top);
          await expect.poll(() => viewport.scrollTop()).toEqual(0);

          // Stop scrolling.
          await page.mouse.up();
        });

        test('should stick to pointer position', async ({page}) => {
          const pagePO = new ScrollbarPagePO(page);
          await pagePO.navigate();
          await pagePO.setCssVariable('--viewport-size', '200px');
          await pagePO.setCssVariable('--viewport-client-overflow-size', '400px');

          const viewport = pagePO[viewportName];
          const scrollbar = viewport.verticalScrollbar;

          // Simulate viewport overflow.
          await pagePO.setOverflow({vertical: true});

          // Hover viewport to display scrollbars.
          await viewport.hover();
          await expect(scrollbar.locator).toBeVisible();

          // Capture scrollbar bounds.
          const scrollbarBounds = await scrollbar.innerBounds();
          const thumbHeight = await scrollbar.thumb.height();

          // Expect thumb to be half the scrollbar height.
          await expect.poll(() => scrollbar.thumb.height()).toEqual(scrollbarBounds.height / 2);

          // Grab thumb with a 10px vertical offset.
          let currentMousePosition = await scrollbar.thumb.top() + 10;
          await page.mouse.move(scrollbarBounds.hcenter, currentMousePosition);
          await page.mouse.down();

          // Move pointer up by half scrollbar height (out of scroll range).
          currentMousePosition -= thumbHeight;
          await page.mouse.move(scrollbarBounds.hcenter, currentMousePosition, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.top);
          await expect.poll(() => scrollbar.thumb.height()).toEqual(thumbHeight);

          // Move pointer down by half scrollbar height (start of scroll range).
          currentMousePosition += thumbHeight;
          await page.mouse.move(scrollbarBounds.hcenter, currentMousePosition, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.top);
          await expect.poll(() => scrollbar.thumb.height()).toEqual(thumbHeight);

          // Move pointer down by half scrollbar height (end of scroll range).
          currentMousePosition += thumbHeight;
          await page.mouse.move(scrollbarBounds.hcenter, currentMousePosition, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.vcenter);
          await expect.poll(() => scrollbar.thumb.height()).toEqual(thumbHeight);

          // Move pointer down by half scrollbar height (out of scroll range).
          currentMousePosition += thumbHeight;
          await page.mouse.move(scrollbarBounds.hcenter, currentMousePosition, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.vcenter);
          await expect.poll(() => scrollbar.thumb.height()).toEqual(thumbHeight);

          // Move pointer by half scrollbar height (end of scroll range).
          currentMousePosition -= thumbHeight;
          await page.mouse.move(scrollbarBounds.hcenter, currentMousePosition, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.vcenter);
          await expect.poll(() => scrollbar.thumb.height()).toEqual(thumbHeight);

          // Move pointer up by half scrollbar height (start of scroll range).
          currentMousePosition -= thumbHeight;
          await page.mouse.move(scrollbarBounds.hcenter, currentMousePosition, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.top);
          await expect.poll(() => scrollbar.thumb.height()).toEqual(thumbHeight);

          // Stop scrolling.
          await page.mouse.up();
        });

        test('should have minimum thumb height of 20px', async ({page}) => {
          const pagePO = new ScrollbarPagePO(page);
          await pagePO.navigate();
          await pagePO.setCssVariable('--viewport-size', '50px');
          await pagePO.setCssVariable('--viewport-client-overflow-size', '100000px');

          const viewport = pagePO[viewportName];
          const scrollbar = viewport.verticalScrollbar;

          // Simulate viewport overflow.
          await pagePO.setOverflow({vertical: true});

          // Hover viewport to display scrollbars.
          await viewport.hover();
          await expect(scrollbar.locator).toBeVisible();

          // Capture viewport and viewport client width.
          const viewportHeight = 50;
          const viewportClientHeight = 100000;

          // Capture scrollbar bounds.
          const scrollbarBounds = await scrollbar.innerBounds();

          // Expect thumb to be 20px (min height).
          await expect.poll(() => scrollbar.thumb.height()).toEqual(20);

          // Press mouse button on the thumb.
          const initialThumbBounds = await scrollbar.thumb.boundingBox();
          const thumbPointerOffset = initialThumbBounds.height / 2;
          await page.mouse.move(initialThumbBounds.hcenter, initialThumbBounds.vcenter);
          await page.mouse.down();

          // Move thumb to the middle of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.vcenter - thumbPointerOffset);
          await expect.poll(() => viewport.scrollTop()).toEqual((viewportClientHeight - viewportHeight) / 2);

          // Move thumb to the bottom of the scrollbar track.
          await page.mouse.move(initialThumbBounds.hcenter, scrollbarBounds.bottom, {steps: 20});
          await expect.poll(() => scrollbar.thumb.top()).toEqual(scrollbarBounds.bottom - initialThumbBounds.height);
          await expect.poll(() => viewport.scrollTop()).toEqual(viewportClientHeight - viewportHeight);

          // Stop scrolling.
          await page.mouse.up();
        });
      });
      test.describe('Horizontal Scrolling', () => {

        test('should scroll using the scrollbar thumb', async ({page}) => {
          const pagePO = new ScrollbarPagePO(page);
          await pagePO.navigate();

          const viewport = pagePO[viewportName];
          const scrollbar = viewport.horizontalScrollbar;

          // Simulate viewport overflow.
          await pagePO.setOverflow({horizontal: true});

          // Hover viewport to display scrollbars.
          await viewport.hover();
          await expect(scrollbar.locator).toBeVisible();

          // Capture viewport and viewport client width.
          const viewportWidth = await viewport.viewportWidth();
          const viewportClientWidth = await viewport.viewportClientWidth();
          const scrollbarBounds = await scrollbar.innerBounds();

          // Press mouse button on the thumb.
          const initialThumbBounds = await scrollbar.thumb.boundingBox();
          const thumbPointerOffset = initialThumbBounds.width / 2;
          await page.mouse.move(initialThumbBounds.hcenter, initialThumbBounds.vcenter);
          await page.mouse.down();

          // Move thumb to the middle of the scrollbar track.
          await page.mouse.move(scrollbarBounds.hcenter, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.hcenter - thumbPointerOffset);
          await expect.poll(() => viewport.scrollLeft()).toEqual((viewportClientWidth - viewportWidth) / 2);

          // Move thumb to the end of the scrollbar track.
          await page.mouse.move(scrollbarBounds.right, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.right - initialThumbBounds.width);
          await expect.poll(() => viewport.scrollLeft()).toEqual(viewportClientWidth - viewportWidth);

          // Move thumb to the middle of the scrollbar track.
          await page.mouse.move(scrollbarBounds.hcenter, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.hcenter - thumbPointerOffset);
          await expect.poll(() => viewport.scrollLeft()).toEqual((viewportClientWidth - viewportWidth) / 2);

          // Move thumb to the start of the scrollbar track.
          await page.mouse.move(scrollbarBounds.left, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.left);
          await expect.poll(() => viewport.scrollLeft()).toEqual(0);

          // Stop scrolling.
          await page.mouse.up();
        });

        test('should scroll using the scrollbar thumb if not hovering thumb', async ({page}) => {
          const pagePO = new ScrollbarPagePO(page);
          await pagePO.navigate();

          const viewport = pagePO[viewportName];
          const scrollbar = viewport.horizontalScrollbar;

          // Simulate viewport overflow.
          await pagePO.setOverflow({horizontal: true});

          // Hover viewport to display scrollbars.
          await viewport.hover();
          await expect(scrollbar.locator).toBeVisible();

          // Capture viewport and viewport client width.
          const viewportWidth = await viewport.viewportWidth();
          const viewportClientWidth = await viewport.viewportClientWidth();
          const scrollbarBounds = await scrollbar.innerBounds();

          // Press mouse button on the thumb.
          const initialThumbBounds = await scrollbar.thumb.boundingBox();
          const thumbPointerOffset = initialThumbBounds.width / 2;
          await page.mouse.move(initialThumbBounds.hcenter, initialThumbBounds.vcenter);
          await page.mouse.down();

          // Capture scrollbar thumb height.
          const scrollThumbHeight = await scrollbar.thumb.height();

          // Move pointer 100px to the bottom (out of thumb)
          await page.mouse.move(initialThumbBounds.hcenter, initialThumbBounds.vcenter + 100);

          // Expect thumb still to display and be enlarged.
          await expect.poll(() => scrollbar.thumb.height()).toEqual(scrollThumbHeight);

          // Move thumb to the middle of the scrollbar track.
          await page.mouse.move(scrollbarBounds.hcenter, initialThumbBounds.vcenter + 100, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.hcenter - thumbPointerOffset);
          await expect.poll(() => viewport.scrollLeft()).toEqual((viewportClientWidth - viewportWidth) / 2);

          // Move thumb to the end of the scrollbar track.
          await page.mouse.move(scrollbarBounds.right, initialThumbBounds.vcenter + 100, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.right - initialThumbBounds.width);
          await expect.poll(() => viewport.scrollLeft()).toEqual(viewportClientWidth - viewportWidth);

          // Move thumb to the middle of the scrollbar track.
          await page.mouse.move(scrollbarBounds.hcenter, initialThumbBounds.vcenter + 100, {steps: 20});
          await expect.poll(() => viewport.scrollLeft()).toEqual((viewportClientWidth - viewportWidth) / 2);

          // Move thumb to the start of the scrollbar track.
          await page.mouse.move(scrollbarBounds.left, initialThumbBounds.vcenter + 100, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.left);
          await expect.poll(() => viewport.scrollLeft()).toEqual(0);

          // Stop scrolling.
          await page.mouse.up();
        });

        test('should not scroll when pointer leaves scroll range', async ({page}) => {
          const pagePO = new ScrollbarPagePO(page);
          await pagePO.navigate();
          await pagePO.setCssVariable('--viewport-size', '300px');
          await pagePO.setCssVariable('--viewport-client-overflow-size', '10000px');

          const viewport = pagePO[viewportName];
          const scrollbar = viewport.horizontalScrollbar;

          // Simulate viewport overflow.
          await pagePO.setOverflow({horizontal: true});

          // Hover viewport to display scrollbars.
          await viewport.hover();
          await expect(scrollbar.locator).toBeVisible();

          // Capture viewport and viewport client height.
          const viewportWidth = await viewport.viewportWidth();
          const viewportClientWidth = await viewport.viewportClientWidth();
          const scrollbarBounds = await scrollbar.innerBounds();

          // Press mouse button on the thumb.
          const initialThumbBounds = await scrollbar.thumb.boundingBox();
          await page.mouse.move(initialThumbBounds.hcenter, initialThumbBounds.vcenter);
          await page.mouse.down();

          // Capture scrollbar thumb height.
          const scrollThumbHeight = await scrollbar.thumb.height();

          // Move pointer before scrollbar start (out of scroll range).
          await page.mouse.move(initialThumbBounds.hcenter - 100, initialThumbBounds.vcenter);

          // Expect thumb still to display and be enlarged.
          await expect.poll(() => scrollbar.thumb.height()).toEqual(scrollThumbHeight);
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.left);
          await expect.poll(() => viewport.scrollLeft()).toEqual(0);

          // Move pointer to the start of the scrollbar track.
          await page.mouse.move(scrollbarBounds.left, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.left);
          await expect.poll(() => viewport.scrollLeft()).toEqual(0);

          // Move pointer to the end of the scrollbar track.
          await page.mouse.move(scrollbarBounds.right, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.right - initialThumbBounds.width);
          await expect.poll(() => viewport.scrollLeft()).toEqual(viewportClientWidth - viewportWidth);

          // Move pointer after scrollbar end (out of scroll range).
          await page.mouse.move(scrollbarBounds.right + 100, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.right - initialThumbBounds.width);
          await expect.poll(() => scrollbar.thumb.height()).toEqual(scrollThumbHeight);
          await expect.poll(() => viewport.scrollLeft()).toEqual(viewportClientWidth - viewportWidth);

          // Move pointer to the end of the scrollbar track.
          await page.mouse.move(scrollbarBounds.right, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.right - initialThumbBounds.width);
          await expect.poll(() => viewport.scrollLeft()).toEqual(viewportClientWidth - viewportWidth);

          // Move pointer to the start of the scrollbar track.
          await page.mouse.move(scrollbarBounds.left, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.left);
          await expect.poll(() => viewport.scrollLeft()).toEqual(0);

          // Stop scrolling.
          await page.mouse.up();
        });

        test('should stick to pointer position', async ({page}) => {
          const pagePO = new ScrollbarPagePO(page);
          await pagePO.navigate();
          await pagePO.setCssVariable('--viewport-size', '200px');
          await pagePO.setCssVariable('--viewport-client-overflow-size', '400px');

          const viewport = pagePO[viewportName];
          const scrollbar = viewport.horizontalScrollbar;

          // Simulate viewport overflow.
          await pagePO.setOverflow({horizontal: true});

          // Hover viewport to display scrollbars.
          await viewport.hover();
          await expect(scrollbar.locator).toBeVisible();

          // Capture scrollbar bounds.
          const scrollbarBounds = await scrollbar.innerBounds();
          const thumbWidth = await scrollbar.thumb.width();

          // Expect thumb to be half the scrollbar width.
          await expect.poll(() => scrollbar.thumb.width()).toEqual(scrollbarBounds.width / 2);

          // Grab thumb with a 10px horizontal offset.
          let currentMousePosition = await scrollbar.thumb.left() + 10;
          await page.mouse.move(currentMousePosition, scrollbarBounds.vcenter);
          await page.mouse.down();

          // Move pointer to the left by half scrollbar width (out of scroll range).
          currentMousePosition -= thumbWidth;
          await page.mouse.move(currentMousePosition, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.left);
          await expect.poll(() => scrollbar.thumb.width()).toEqual(thumbWidth);

          // Move pointer to the right by half scrollbar width (start of scroll range).
          currentMousePosition += thumbWidth;
          await page.mouse.move(currentMousePosition, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.left);
          await expect.poll(() => scrollbar.thumb.width()).toEqual(thumbWidth);

          // Move pointer to the right by half scrollbar width (end of scroll range).
          currentMousePosition += thumbWidth;
          await page.mouse.move(currentMousePosition, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.hcenter);
          await expect.poll(() => scrollbar.thumb.width()).toEqual(thumbWidth);

          // Move pointer to the right by half scrollbar width (out of scroll range).
          currentMousePosition += thumbWidth;
          await page.mouse.move(currentMousePosition, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.hcenter);
          await expect.poll(() => scrollbar.thumb.width()).toEqual(thumbWidth);

          // Move pointer to the left by half scrollbar width (end of scroll range).
          currentMousePosition -= thumbWidth;
          await page.mouse.move(currentMousePosition, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.hcenter);
          await expect.poll(() => scrollbar.thumb.width()).toEqual(thumbWidth);

          // Move pointer to the left by half scrollbar width (start of scroll range).
          currentMousePosition -= thumbWidth;
          await page.mouse.move(currentMousePosition, scrollbarBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.left);
          await expect.poll(() => scrollbar.thumb.width()).toEqual(thumbWidth);

          // Stop scrolling.
          await page.mouse.up();
        });

        test('should have minimum thumb width of 20px', async ({page}) => {
          const pagePO = new ScrollbarPagePO(page);
          await pagePO.navigate();
          await pagePO.setCssVariable('--viewport-size', '50px');
          await pagePO.setCssVariable('--viewport-client-overflow-size', '100000px');

          const viewport = pagePO[viewportName];
          const scrollbar = viewport.horizontalScrollbar;

          // Simulate viewport overflow.
          await pagePO.setOverflow({horizontal: true});

          // Hover viewport to display scrollbars.
          await viewport.hover();
          await expect(scrollbar.locator).toBeVisible();

          // Capture viewport and viewport client width.
          const viewportWidth = 50;
          const viewportClientWidth = 100000;

          // Capture scrollbar bounds.
          const scrollbarBounds = await scrollbar.innerBounds();

          // Expect thumb to be 20px (min width).
          await expect.poll(() => scrollbar.thumb.width()).toEqual(20);

          // Press mouse button on the thumb.
          const initialThumbBounds = await scrollbar.thumb.boundingBox();
          const thumbPointerOffset = initialThumbBounds.width / 2;
          await page.mouse.move(initialThumbBounds.hcenter, initialThumbBounds.vcenter);
          await page.mouse.down();

          // Move thumb to the middle of the scrollbar track.
          await page.mouse.move(scrollbarBounds.hcenter, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.hcenter - thumbPointerOffset);
          await expect.poll(() => viewport.scrollLeft()).toEqual((viewportClientWidth - viewportWidth) / 2);

          // Move thumb to the end of the scrollbar track.
          await page.mouse.move(scrollbarBounds.right, initialThumbBounds.vcenter, {steps: 20});
          await expect.poll(() => scrollbar.thumb.left()).toEqual(scrollbarBounds.right - initialThumbBounds.width);
          await expect.poll(() => viewport.scrollLeft()).toEqual(viewportClientWidth - viewportWidth);

          // Stop scrolling.
          await page.mouse.up();
        });
      });
    });
  });
});
