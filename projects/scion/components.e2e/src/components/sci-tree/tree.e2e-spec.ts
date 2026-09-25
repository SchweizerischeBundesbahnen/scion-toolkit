/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test} from '../../fixtures';
import {expect} from '@playwright/test';
import {TreePagePO} from './tree-page.po';
import {TreePO} from './tree.po';
import {provideHttpDatasource} from './datasource/tree-http-datasource';

test.describe.only('sci-tree', () => {

  test.describe('Table Configuration', () => {

    test('should set header', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await treePage.setHeader('header');
      await expect(tree.header.columnHeader.label).toHaveText('header');

      await treePage.setHeader('');
      await expect(tree.header.columnHeader.locator).not.toBeAttached();
    });
  });

  test.describe('Data', () => {

    test('should display hierarchical data', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {
          id: 1,
          name: 'Product 1',
          children: [
            {
              id: 2,
              name: 'Product 2',
            },
            {
              id: 3,
              name: 'Product 3',
            },
          ],
        },
        {
          id: 4,
          name: 'Product 4',
        },
        {
          id: 5,
          name: 'Product 5',
          children: [
            {
              id: 6,
              name: 'Product 6',
              children: [
                {
                  id: 7,
                  name: 'Product 7',
                },
                {
                  id: 8,
                  name: 'Product 8',
                },
              ],
            },
            {
              id: 9,
              name: 'Product 9',
            },
          ],
        },
      ], {datasource: 'array-http'});

      await expect.poll(() => tree.node({nth: 0}).label()).toBe('Product 1');
      await expect.poll(() => tree.node({nth: 1}).label()).toBe('Product 4');
      await expect.poll(() => tree.node({nth: 2}).label()).toBe('Product 5');

      await expect(tree.node({nth: 0}).toggle.collapsed).toBeAttached();
      await expect(tree.node({nth: 1}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 2}).toggle.collapsed).toBeAttached();

      // Toggle Product 1
      await tree.node({nth: 0}).toggle.locator.click();

      await expect.poll(() => tree.node({nth: 0}).label()).toBe('Product 1');
      await expect.poll(() => tree.node({nth: 1}).label()).toBe('Product 2');
      await expect.poll(() => tree.node({nth: 2}).label()).toBe('Product 3');
      await expect.poll(() => tree.node({nth: 3}).label()).toBe('Product 4');
      await expect.poll(() => tree.node({nth: 4}).label()).toBe('Product 5');

      await expect(tree.node({nth: 0}).toggle.expanded).toBeAttached();
      await expect(tree.node({nth: 1}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 2}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 3}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 4}).toggle.collapsed).toBeAttached();

      // Toggle Product 5
      await tree.node({nth: 4}).toggle.locator.click();

      await expect.poll(() => tree.node({nth: 0}).label()).toBe('Product 1');
      await expect.poll(() => tree.node({nth: 1}).label()).toBe('Product 2');
      await expect.poll(() => tree.node({nth: 2}).label()).toBe('Product 3');
      await expect.poll(() => tree.node({nth: 3}).label()).toBe('Product 4');
      await expect.poll(() => tree.node({nth: 4}).label()).toBe('Product 5');
      await expect.poll(() => tree.node({nth: 5}).label()).toBe('Product 6');
      await expect.poll(() => tree.node({nth: 6}).label()).toBe('Product 9');

      await expect(tree.node({nth: 0}).toggle.expanded).toBeAttached();
      await expect(tree.node({nth: 1}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 2}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 3}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 4}).toggle.expanded).toBeAttached();
      await expect(tree.node({nth: 5}).toggle.collapsed).toBeAttached();
      await expect(tree.node({nth: 6}).toggle.locator).not.toBeAttached();

      // Toggle Product 6
      await tree.node({nth: 5}).toggle.locator.click();

      await expect.poll(() => tree.node({nth: 0}).label()).toBe('Product 1');
      await expect.poll(() => tree.node({nth: 1}).label()).toBe('Product 2');
      await expect.poll(() => tree.node({nth: 2}).label()).toBe('Product 3');
      await expect.poll(() => tree.node({nth: 3}).label()).toBe('Product 4');
      await expect.poll(() => tree.node({nth: 4}).label()).toBe('Product 5');
      await expect.poll(() => tree.node({nth: 5}).label()).toBe('Product 6');
      await expect.poll(() => tree.node({nth: 6}).label()).toBe('Product 7');
      await expect.poll(() => tree.node({nth: 7}).label()).toBe('Product 8');
      await expect.poll(() => tree.node({nth: 8}).label()).toBe('Product 9');

      await expect(tree.node({nth: 0}).toggle.expanded).toBeAttached();
      await expect(tree.node({nth: 1}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 2}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 3}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 4}).toggle.expanded).toBeAttached();
      await expect(tree.node({nth: 5}).toggle.expanded).toBeAttached();
      await expect(tree.node({nth: 6}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 7}).toggle.locator).not.toBeAttached();
      await expect(tree.node({nth: 8}).toggle.locator).not.toBeAttached();
    });
  });
});
