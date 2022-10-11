/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {E2eOverlapPO} from './e2e-overlap.po';
import {test} from '../../fixtures';
import {expect} from '@playwright/test';

test.describe('sci-viewport/overlap', () => {

  test('should not overlap adjacent elements', async ({page, consoleLogs}) => {
    const overlapPO = new E2eOverlapPO(page);
    await overlapPO.open();

    await overlapPO.clickAdjacentElement();
    await expect(await consoleLogs.get({filter: /E2eOverlapComponent/})).toHaveLength(1);
  });
});
