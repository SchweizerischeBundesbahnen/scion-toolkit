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
import {ViewportHoverPagePO} from './viewport-hover-page.po';

test.describe('sci-viewport/hover', () => {

  test('should display vertical scrollbar when hovering the viewport', async ({page}) => {
    const pagePO = new ViewportHoverPagePO(page);
    await pagePO.navigate();

    await expect(pagePO.locateScrollbar({viewport: 'vertical', scrollbar: 'vertical'})).toHaveCSS('opacity', '0');
    await expect(pagePO.locateScrollbar({viewport: 'vertical', scrollbar: 'horizontal'})).toHaveCSS('opacity', '0');

    // WHEN hovering viewport
    await pagePO.moveMouseOverViewport({viewport: 'vertical'});
    // THEN expect scrollbar to show
    await expect(pagePO.locateScrollbar({viewport: 'vertical', scrollbar: 'vertical'})).toHaveCSS('opacity', '1');
    await expect(pagePO.locateScrollbar({viewport: 'vertical', scrollbar: 'horizontal'})).toHaveCSS('opacity', '1');
    await expect(pagePO.locateScrollbar({viewport: 'vertical', scrollbar: 'vertical'})).toBeVisible();
    await expect(pagePO.locateScrollbar({viewport: 'vertical', scrollbar: 'horizontal'})).not.toBeVisible();

    // WHEN not hovering viewport
    await pagePO.moveMouseOutsideViewport({viewport: 'vertical'});
    // THEN expect scrollbar not to show
    await expect(pagePO.locateScrollbar({viewport: 'vertical', scrollbar: 'vertical'})).toHaveCSS('opacity', '0');
    await expect(pagePO.locateScrollbar({viewport: 'vertical', scrollbar: 'horizontal'})).toHaveCSS('opacity', '0');
  });

  test('should display horizontal scrollbar when hovering the viewport', async ({page}) => {
    const pagePO = new ViewportHoverPagePO(page);
    await pagePO.navigate();

    await expect(pagePO.locateScrollbar({viewport: 'horizontal', scrollbar: 'vertical'})).toHaveCSS('opacity', '0');
    await expect(pagePO.locateScrollbar({viewport: 'horizontal', scrollbar: 'horizontal'})).toHaveCSS('opacity', '0');

    // WHEN hovering viewport
    await pagePO.moveMouseOverViewport({viewport: 'horizontal'});
    // THEN expect scrollbar to show
    await expect(pagePO.locateScrollbar({viewport: 'horizontal', scrollbar: 'vertical'})).toHaveCSS('opacity', '1');
    await expect(pagePO.locateScrollbar({viewport: 'horizontal', scrollbar: 'horizontal'})).toHaveCSS('opacity', '1');
    await expect(pagePO.locateScrollbar({viewport: 'horizontal', scrollbar: 'vertical'})).not.toBeVisible();
    await expect(pagePO.locateScrollbar({viewport: 'horizontal', scrollbar: 'horizontal'})).toBeVisible();

    // WHEN not hovering viewport
    await pagePO.moveMouseOutsideViewport({viewport: 'horizontal'});
    // THEN expect scrollbar not to show
    await expect(pagePO.locateScrollbar({viewport: 'horizontal', scrollbar: 'vertical'})).toHaveCSS('opacity', '0');
    await expect(pagePO.locateScrollbar({viewport: 'horizontal', scrollbar: 'horizontal'})).toHaveCSS('opacity', '0');
  });
});
