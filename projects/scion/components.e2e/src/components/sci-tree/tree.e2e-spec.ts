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
import {expectTree} from './tree-matcher';

test.describe('sci-tree', () => {

  test.describe('Tree Configuration', () => {

    test('should set header', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await treePage.setHeader('header');
      await expect(tree.header.label).toHaveText('header');

      await treePage.setHeader('');
      await expect(tree.header.locator).not.toBeAttached();
    });
  });

  test.describe('Navigation', () => {

    test('should expand / collapse with click', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {
          id: 1,
          name: 'Item 1',
        },
        {
          id: 2,
          name: 'Item 2',
          children: [
            {
              id: 3,
              name: 'Item 3',
            },
            {
              id: 4,
              name: 'Item 4',
            },
          ],
        },
        {
          id: 5,
          name: 'Item 5',
        },
        {
          id: 6,
          name: 'Item 6',
          children: [
            {
              id: 7,
              name: 'Item 7',
              children: [
                {
                  id: 8,
                  name: 'Item 8',
                },
                {
                  id: 9,
                  name: 'Item 9',
                },
              ],
            },
            {
              id: 10,
              name: 'Item 10',
            },
          ],
        },
      ], {datasource: 'array-http'});

      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {label: 'Item 2', expansionControl: 'collapsed'},
        {label: 'Item 5', expansionControl: 'notAttached'},
        {label: 'Item 6', expansionControl: 'collapsed'},
      ]);

      // Expand Item 2
      await tree.node({nth: 1}).expansionControl.locator.click();
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {
          label: 'Item 2',
          expansionControl: 'expanded',
          children: [
            {label: 'Item 3', expansionControl: 'notAttached'},
            {label: 'Item 4', expansionControl: 'notAttached'},
          ],
        },
        {label: 'Item 5', expansionControl: 'notAttached'},
        {label: 'Item 6', expansionControl: 'collapsed'},
      ]);

      // Expand Item 6
      await tree.node({nth: 5}).expansionControl.locator.click();
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {
          label: 'Item 2',
          expansionControl: 'expanded',
          children: [
            {label: 'Item 3', expansionControl: 'notAttached'},
            {label: 'Item 4', expansionControl: 'notAttached'},
          ],
        },
        {label: 'Item 5', expansionControl: 'notAttached'},
        {
          label: 'Item 6',
          expansionControl: 'expanded',
          children: [
            {label: 'Item 7', expansionControl: 'collapsed'},
            {label: 'Item 10', expansionControl: 'notAttached'},
          ],
        },
      ]);

      // Expand Item 7
      await tree.node({nth: 6}).expansionControl.locator.click();
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {
          label: 'Item 2',
          expansionControl: 'expanded',
          children: [
            {label: 'Item 3', expansionControl: 'notAttached'},
            {label: 'Item 4', expansionControl: 'notAttached'},
          ],
        },
        {label: 'Item 5', expansionControl: 'notAttached'},
        {
          label: 'Item 6',
          expansionControl: 'expanded',
          children: [
            {
              label: 'Item 7',
              expansionControl: 'expanded',
              children: [
                {label: 'Item 8', expansionControl: 'notAttached'},
                {label: 'Item 9', expansionControl: 'notAttached'},
              ],
            },
            {label: 'Item 10', expansionControl: 'notAttached'},
          ],
        },
      ]);

      // Collapse Item 7
      await tree.node({nth: 6}).expansionControl.locator.click();
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {
          label: 'Item 2',
          expansionControl: 'expanded',
          children: [
            {label: 'Item 3', expansionControl: 'notAttached'},
            {label: 'Item 4', expansionControl: 'notAttached'},
          ],
        },
        {label: 'Item 5', expansionControl: 'notAttached'},
        {
          label: 'Item 6',
          expansionControl: 'expanded',
          children: [
            {label: 'Item 7', expansionControl: 'collapsed'},
            {label: 'Item 10', expansionControl: 'notAttached'},
          ],
        },
      ]);

      // Collapse Item 6
      await tree.node({nth: 5}).expansionControl.locator.click();
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {
          label: 'Item 2',
          expansionControl: 'expanded',
          children: [
            {label: 'Item 3', expansionControl: 'notAttached'},
            {label: 'Item 4', expansionControl: 'notAttached'},
          ],
        },
        {label: 'Item 5', expansionControl: 'notAttached'},
        {label: 'Item 6', expansionControl: 'collapsed'},
      ]);

      // Collapse Item 2
      await tree.node({nth: 1}).expansionControl.locator.click();
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {label: 'Item 2', expansionControl: 'collapsed'},
        {label: 'Item 5', expansionControl: 'notAttached'},
        {label: 'Item 6', expansionControl: 'collapsed'},
      ]);
    });

    test('should navigate with ArrowRight / ArrowLeft', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {
          id: 1,
          name: 'Item 1',
        },
        {
          id: 2,
          name: 'Item 2',
          children: [
            {
              id: 3,
              name: 'Item 3',
            },
            {
              id: 4,
              name: 'Item 4',
            },
          ],
        },
        {
          id: 5,
          name: 'Item 5',
        },
        {
          id: 6,
          name: 'Item 6',
          children: [
            {
              id: 7,
              name: 'Item 7',
              children: [
                {
                  id: 8,
                  name: 'Item 8',
                },
                {
                  id: 9,
                  name: 'Item 9',
                },
              ],
            },
            {
              id: 10,
              name: 'Item 10',
            },
          ],
        },
      ], {datasource: 'array-http'});

      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {label: 'Item 2', expansionControl: 'collapsed'},
        {label: 'Item 5', expansionControl: 'notAttached'},
        {label: 'Item 6', expansionControl: 'collapsed'},
      ]);

      await tree.node({nth: 0}).click();
      await expect(treePage.selection).toHaveText('1');
      await expect(treePage.activeItemId).toHaveText('1');

      await test.step('ArrowRight', async () => {
        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('2');
        await expect(treePage.activeItemId).toHaveText('2');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {label: 'Item 2', expansionControl: 'collapsed'},
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('2');
        await expect(treePage.activeItemId).toHaveText('2');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('3');
        await expect(treePage.activeItemId).toHaveText('3');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('4');
        await expect(treePage.activeItemId).toHaveText('4');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('5');
        await expect(treePage.activeItemId).toHaveText('5');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('6');
        await expect(treePage.activeItemId).toHaveText('6');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('6');
        await expect(treePage.activeItemId).toHaveText('6');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {
            label: 'Item 6',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 7', expansionControl: 'collapsed'},
              {label: 'Item 10', expansionControl: 'notAttached'},
            ],
          },
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('7');
        await expect(treePage.activeItemId).toHaveText('7');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {
            label: 'Item 6',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 7', expansionControl: 'collapsed'},
              {label: 'Item 10', expansionControl: 'notAttached'},
            ],
          },
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('7');
        await expect(treePage.activeItemId).toHaveText('7');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {
            label: 'Item 6',
            expansionControl: 'expanded',
            children: [
              {
                label: 'Item 7',
                expansionControl: 'expanded',
                children: [
                  {label: 'Item 8', expansionControl: 'notAttached'},
                  {label: 'Item 9', expansionControl: 'notAttached'},
                ],
              },
              {label: 'Item 10', expansionControl: 'notAttached'},
            ],
          },
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('8');
        await expect(treePage.activeItemId).toHaveText('8');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {
            label: 'Item 6',
            expansionControl: 'expanded',
            children: [
              {
                label: 'Item 7',
                expansionControl: 'expanded',
                children: [
                  {label: 'Item 8', expansionControl: 'notAttached'},
                  {label: 'Item 9', expansionControl: 'notAttached'},
                ],
              },
              {label: 'Item 10', expansionControl: 'notAttached'},
            ],
          },
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('9');
        await expect(treePage.activeItemId).toHaveText('9');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {
            label: 'Item 6',
            expansionControl: 'expanded',
            children: [
              {
                label: 'Item 7',
                expansionControl: 'expanded',
                children: [
                  {label: 'Item 8', expansionControl: 'notAttached'},
                  {label: 'Item 9', expansionControl: 'notAttached'},
                ],
              },
              {label: 'Item 10', expansionControl: 'notAttached'},
            ],
          },
        ]);

        // Press ArrowRight
        await page.keyboard.press('ArrowRight');
        await expect(treePage.selection).toHaveText('10');
        await expect(treePage.activeItemId).toHaveText('10');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {
            label: 'Item 6',
            expansionControl: 'expanded',
            children: [
              {
                label: 'Item 7',
                expansionControl: 'expanded',
                children: [
                  {label: 'Item 8', expansionControl: 'notAttached'},
                  {label: 'Item 9', expansionControl: 'notAttached'},
                ],
              },
              {label: 'Item 10', expansionControl: 'notAttached'},
            ],
          },
        ]);
      });

      await test.step('ArrowLeft', async () => {
        // Press ArrowLeft
        await page.keyboard.press('ArrowLeft');
        await expect(treePage.selection).toHaveText('6');
        await expect(treePage.activeItemId).toHaveText('6');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {
            label: 'Item 6',
            expansionControl: 'expanded',
            children: [
              {
                label: 'Item 7',
                expansionControl: 'expanded',
                children: [
                  {label: 'Item 8', expansionControl: 'notAttached'},
                  {label: 'Item 9', expansionControl: 'notAttached'},
                ],
              },
              {label: 'Item 10', expansionControl: 'notAttached'},
            ],
          },
        ]);

        // Press ArrowLeft
        await page.keyboard.press('ArrowLeft');
        await expect(treePage.selection).toHaveText('6');
        await expect(treePage.activeItemId).toHaveText('6');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);

        // Press ArrowLeft
        await page.keyboard.press('ArrowLeft');
        await expect(treePage.selection).toHaveText('2');
        await expect(treePage.activeItemId).toHaveText('2');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {
            label: 'Item 2',
            expansionControl: 'expanded',
            children: [
              {label: 'Item 3', expansionControl: 'notAttached'},
              {label: 'Item 4', expansionControl: 'notAttached'},
            ],
          },
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);

        // Press ArrowLeft
        await page.keyboard.press('ArrowLeft');
        await expect(treePage.selection).toHaveText('2');
        await expect(treePage.activeItemId).toHaveText('2');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {label: 'Item 2', expansionControl: 'collapsed'},
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);

        // Press ArrowLeft
        await page.keyboard.press('ArrowLeft');
        await expect(treePage.selection).toHaveText('1');
        await expect(treePage.activeItemId).toHaveText('1');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {label: 'Item 2', expansionControl: 'collapsed'},
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);

        // Press ArrowLeft
        await page.keyboard.press('ArrowLeft');
        await expect(treePage.selection).toHaveText('1');
        await expect(treePage.activeItemId).toHaveText('1');
        await expectTree(tree).toEqual([
          {label: 'Item 1', expansionControl: 'notAttached'},
          {label: 'Item 2', expansionControl: 'collapsed'},
          {label: 'Item 5', expansionControl: 'notAttached'},
          {label: 'Item 6', expansionControl: 'collapsed'},
        ]);
      });
    });
  });
});
