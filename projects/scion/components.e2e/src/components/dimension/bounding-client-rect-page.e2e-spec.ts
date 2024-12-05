/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test} from '../../fixtures';
import {waitUntilStable} from '../../helper/testing.utils';
import {expect} from '@playwright/test';
import {BoundingClientRectPagePO} from './bounding-client-rect-page.po';

test.describe('@scion/components/dimension/boundingClientRect', () => {

  test.only('should not run Angular change detection when changing element size', async ({page, consoleLogs}) => {
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

    // Expect Angular not to run change detection when changing element size.
    await waitUntilStable(() => consoleLogs.get().length);
    await expect.poll(() => consoleLogs.get({message: '[BoundingClientRectPageComponent] Angular change detection cycle'})).toHaveLength(0);
  });
});
