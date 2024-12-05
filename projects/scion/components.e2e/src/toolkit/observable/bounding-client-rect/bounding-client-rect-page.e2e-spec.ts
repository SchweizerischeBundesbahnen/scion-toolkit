/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test} from '../../../fixtures';
import {expect} from '@playwright/test';
import {BoundingClientRectPagePO} from './bounding-client-rect-page.po';
import {waitUntilStable} from '../../../helper/testing.utils';

test.describe('@scion/toolkit/observable/fromBoundingClientRect$', () => {

  test('should detect changed bounding box when resizing the browser window', async ({page}) => {
    const testPage = new BoundingClientRectPagePO(page);
    await testPage.navigate();

    const initialWindowWidth = page.viewportSize()!.width;

    // Set element size to 100x100 pixel.
    await testPage.enterProperties({x: '0', y: '0', width: '100px', height: '100px'});
    await testPage.applyProperties();
    await expect(testPage.testeeBoundingBox.width).toHaveText('100');

    // Set element width to 100% and expect the bounding box to be updated.
    await testPage.enterProperties({x: '0', y: '0', width: '100%', height: '100px'});
    await testPage.applyProperties();
    await expect(testPage.testeeBoundingBox.width).toHaveText(`${initialWindowWidth}`);

    // Increase window width by 200px and expect the bounding box to be updated.
    await testPage.resizeWindow({width: initialWindowWidth + 200});
    await expect(testPage.testeeBoundingBox.width).toHaveText(`${initialWindowWidth + 200}`);
  });

  test('should not run Angular change detection when changing element size', async ({page, consoleLogs}) => {
    const testPage = new BoundingClientRectPagePO(page);
    await testPage.navigate();

    // Set element size to 200x200 pixel.
    await testPage.enterProperties({x: '0', y: '0', width: '200px', height: '200px'});

    // Clear console logs.
    await waitUntilStable(() => consoleLogs.get().length);
    consoleLogs.clear();

    // Apply properties.
    await testPage.applyProperties();
    await expect(testPage.testeeBoundingBox.width).toHaveText('200');

    // Expect Angular not to run additional change detection when changing element size. (One change detection cycle is triggered by pressing the button)
    await waitUntilStable(() => consoleLogs.get().length);
    await expect.poll(() => consoleLogs.get({message: '[BoundingClientRectPageComponent] Angular change detection cycle'})).toHaveLength(1);
  });
});
