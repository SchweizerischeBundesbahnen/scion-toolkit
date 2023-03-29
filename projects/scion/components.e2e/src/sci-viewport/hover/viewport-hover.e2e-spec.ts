/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test} from '../../fixtures';
import {expect} from '@playwright/test';
import {ViewportHoverPagePO} from './viewport-hover-page.po';

test.describe('sci-viewport/hover', () => {

  test('should display vertical scrollbar when hovering the viewport', async ({page}) => {
    const pagePO = new ViewportHoverPagePO(page);
    await pagePO.navigate();

    await expect(await pagePO.isScrollbarVisible({viewport: 'vertical', scrollbar: 'vertical'})).toBe(false);
    await expect(await pagePO.isScrollbarVisible({viewport: 'vertical', scrollbar: 'horizontal'})).toBe(false);

    // WHEN hovering viewport
    await pagePO.moveMouseOverViewport({viewport: 'vertical'});
    // THEN expect scrollbar to show
    await expect(await pagePO.isScrollbarVisible({viewport: 'vertical', scrollbar: 'vertical'})).toBe(true);
    await expect(await pagePO.isScrollbarVisible({viewport: 'vertical', scrollbar: 'horizontal'})).toBe(false);

    // WHEN not hovering viewport
    await pagePO.moveMouseOutsideViewport({viewport: 'vertical'});
    // THEN expect scrollbar not to show
    await expect(await pagePO.isScrollbarVisible({viewport: 'vertical', scrollbar: 'vertical'})).toBe(false);
    await expect(await pagePO.isScrollbarVisible({viewport: 'vertical', scrollbar: 'horizontal'})).toBe(false);
  });

  test('should display horizontal scrollbar when hovering the viewport', async ({page}) => {
    const pagePO = new ViewportHoverPagePO(page);
    await pagePO.navigate();

    await expect(await pagePO.isScrollbarVisible({viewport: 'horizontal', scrollbar: 'vertical'})).toBe(false);
    await expect(await pagePO.isScrollbarVisible({viewport: 'horizontal', scrollbar: 'horizontal'})).toBe(false);

    // WHEN hovering viewport
    await pagePO.moveMouseOverViewport({viewport: 'horizontal'});
    // THEN expect scrollbar to show
    await expect(await pagePO.isScrollbarVisible({viewport: 'horizontal', scrollbar: 'vertical'})).toBe(false);
    await expect(await pagePO.isScrollbarVisible({viewport: 'horizontal', scrollbar: 'horizontal'})).toBe(true);

    // WHEN not hovering viewport
    await pagePO.moveMouseOutsideViewport({viewport: 'horizontal'});
    // THEN expect scrollbar not to show
    await expect(await pagePO.isScrollbarVisible({viewport: 'horizontal', scrollbar: 'vertical'})).toBe(false);
    await expect(await pagePO.isScrollbarVisible({viewport: 'horizontal', scrollbar: 'horizontal'})).toBe(false);
  });
});
