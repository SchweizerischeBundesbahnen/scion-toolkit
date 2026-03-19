/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test} from '../../fixtures';
import {TablePagePO} from './table-page.po';
import {expect} from '@playwright/test';

test.describe('sci-table', () => {

  test.describe('global properties', () => {
    test('should disable filters', async ({page}) => {
      const tablePage = new TablePagePO(page);
      await tablePage.navigate();

      await tablePage.setFilterable(false);
      await expect(tablePage.locateFilters()).toHaveCount(0);

      await tablePage.setFilterable(true);
      await expect(tablePage.locateFilters()).toHaveCount(1);
    });
  });
});
