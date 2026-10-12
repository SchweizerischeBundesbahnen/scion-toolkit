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
      await tree.node({index: 1}).expansionControl.locator.click();
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
      await tree.node({index: 5}).expansionControl.locator.click();
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
      await tree.node({index: 6}).expansionControl.locator.click();
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
      await tree.node({index: 6}).expansionControl.locator.click();
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
      await tree.node({index: 5}).expansionControl.locator.click();
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
      await tree.node({index: 1}).expansionControl.locator.click();
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {label: 'Item 2', expansionControl: 'collapsed'},
        {label: 'Item 5', expansionControl: 'notAttached'},
        {label: 'Item 6', expansionControl: 'collapsed'},
      ]);
    });

    test('should expand / collapse with double click', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {
          id: 1,
          name: 'Item 1',
          children: [
            {
              id: 2,
              name: 'Item 2',
            },
          ],
        },
      ], {datasource: 'array-http'});

      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'collapsed'},
      ]);

      // Expand Item 1
      await tree.node({index: 0}).locator.dblclick();
      await expectTree(tree).toEqual([
        {
          label: 'Item 1',
          expansionControl: 'expanded',
          children: [
            {label: 'Item 2', expansionControl: 'notAttached'},
          ],
        },
      ]);

      // Collapse Item 1
      await tree.node({index: 0}).locator.dblclick();
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'collapsed'},
      ]);
    });

    test('should expand a collapsed branch on ArrowRight without moving selection', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {
          id: 1,
          name: 'Item 1',
          children: [
            {id: 2, name: 'Item 2'},
          ],
        },
      ], {datasource: 'array-http'});

      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'collapsed'},
      ]);

      await tree.node({index: 0}).click();
      await expect(treePage.selection).toHaveText('1');
      await expect(treePage.activeItemId).toHaveText('1');

      await page.keyboard.press('ArrowRight');
      await expect(treePage.selection).toHaveText('1');
      await expect(treePage.activeItemId).toHaveText('1');
      await expectTree(tree).toEqual([
        {
          label: 'Item 1',
          expansionControl: 'expanded',
          children: [
            {label: 'Item 2', expansionControl: 'notAttached'},
          ],
        },
      ]);
      await expect(tree.nodes).toHaveCount(2);
    });

    test('should navigate visible nodes in depth-first order with ArrowRight', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {
          id: 2,
          name: 'Item 2',
          children: [
            {
              id: 3,
              name: 'Item 3',
              children: [
                {id: 4, name: 'Item 4'},
                {id: 5, name: 'Item 5'},
              ],
            },
            {id: 6, name: 'Item 6'},
          ],
        },
        {id: 7, name: 'Item 7'},
      ], {datasource: 'array-http'});

      await tree.node({index: 1}).expansionControl.locator.click();
      await tree.node({index: 2}).expansionControl.locator.click();
      await tree.node({index: 0}).click();
      await expect(treePage.selection).toHaveText('1');
      await expect(treePage.activeItemId).toHaveText('1');

      for (const id of [2, 3, 4, 5, 6, 7]) {
        await test.step(`Navigate to Item ${id}`, async () => {
          await page.keyboard.press('ArrowRight');
          await expect(treePage.selection).toHaveText(`${id}`);
          await expect(treePage.activeItemId).toHaveText(`${id}`);
        });
      }

      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {
          label: 'Item 2',
          expansionControl: 'expanded',
          children: [
            {
              label: 'Item 3',
              expansionControl: 'expanded',
              children: [
                {label: 'Item 4', expansionControl: 'notAttached'},
                {label: 'Item 5', expansionControl: 'notAttached'},
              ],
            },
            {label: 'Item 6', expansionControl: 'notAttached'},
          ],
        },
        {label: 'Item 7', expansionControl: 'notAttached'},
      ]);
      await expect(tree.nodes).toHaveCount(7);
    });

    test('should collapse an expanded node on ArrowLeft without moving selection', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {
          id: 2,
          name: 'Item 2',
          children: [
            {
              id: 3,
              name: 'Item 3',
              children: [
                {id: 4, name: 'Item 4'},
              ],
            },
          ],
        },
      ], {datasource: 'array-http'});

      await tree.node({index: 1}).expansionControl.locator.click();
      await tree.node({index: 2}).expansionControl.locator.click();
      await expect(tree.nodes).toHaveCount(4);
      await tree.node({index: 1}).click();
      await expect(treePage.selection).toHaveText('2');
      await expect(treePage.activeItemId).toHaveText('2');

      await page.keyboard.press('ArrowLeft');
      await expect(treePage.selection).toHaveText('2');
      await expect(treePage.activeItemId).toHaveText('2');
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {label: 'Item 2', expansionControl: 'collapsed'},
      ]);
      await expect(tree.nodes).toHaveCount(2);
    });

    test('should move from a node to its parent on ArrowLeft', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {
          id: 1,
          name: 'Item 1',
          children: [
            {
              id: 2,
              name: 'Item 2',
              children: [
                {id: 3, name: 'Item 3'},
              ],
            },
            {id: 4, name: 'Item 4'},
          ],
        },
      ], {datasource: 'array-http'});

      await tree.node({index: 0}).expansionControl.locator.click();
      await tree.node({index: 1}).expansionControl.locator.click();
      await tree.node({index: 3}).click();
      await expect(treePage.selection).toHaveText('4');
      await expect(treePage.activeItemId).toHaveText('4');

      await page.keyboard.press('ArrowLeft');
      await expect(treePage.selection).toHaveText('1');
      await expect(treePage.activeItemId).toHaveText('1');
      await expectTree(tree).toEqual([
        {
          label: 'Item 1',
          expansionControl: 'expanded',
          children: [
            {
              label: 'Item 2',
              expansionControl: 'expanded',
              children: [
                {label: 'Item 3', expansionControl: 'notAttached'},
              ],
            },
            {label: 'Item 4', expansionControl: 'notAttached'},
          ],
        },
      ]);
      await expect(tree.nodes).toHaveCount(4);
    });

    test('should stay on the first node on ArrowLeft', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2'},
      ], {datasource: 'array-http'});

      await tree.node({index: 0}).click();
      await expect(treePage.selection).toHaveText('1');
      await expect(treePage.activeItemId).toHaveText('1');

      await page.keyboard.press('ArrowLeft');
      await expect(treePage.selection).toHaveText('1');
      await expect(treePage.activeItemId).toHaveText('1');
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {label: 'Item 2', expansionControl: 'notAttached'},
      ]);
      await expect(tree.nodes).toHaveCount(2);
    });

    test('should stay on the last visible node on ArrowRight', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {
          id: 1,
          name: 'Item 1',
          children: [
            {id: 2, name: 'Item 2'},
          ],
        },
      ], {datasource: 'array-http'});

      await tree.node({index: 0}).expansionControl.locator.click();
      await tree.node({index: 1}).click();
      await expect(treePage.selection).toHaveText('2');
      await expect(treePage.activeItemId).toHaveText('2');

      await page.keyboard.press('ArrowRight');
      await expect(treePage.selection).toHaveText('2');
      await expect(treePage.activeItemId).toHaveText('2');
      await expectTree(tree).toEqual([
        {
          label: 'Item 1',
          expansionControl: 'expanded',
          children: [
            {label: 'Item 2', expansionControl: 'notAttached'},
          ],
        },
      ]);
      await expect(tree.nodes).toHaveCount(2);
    });

    test('should select the previous expanded nested node from a root on ArrowLeft', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {
          id: 1,
          name: 'Item 1',
          children: [
            {
              id: 2,
              name: 'Item 2',
              children: [
                {id: 3, name: 'Item 3'},
              ],
            },
            {id: 4, name: 'Item 4'},
          ],
        },
        {id: 5, name: 'Item 5'},
      ], {datasource: 'array-http'});

      await tree.node({index: 0}).expansionControl.locator.click();
      await tree.node({index: 1}).expansionControl.locator.click();
      await tree.node({index: 4}).click();
      await expect(treePage.selection).toHaveText('5');
      await expect(treePage.activeItemId).toHaveText('5');

      await page.keyboard.press('ArrowLeft');
      await expect(treePage.selection).toHaveText('2');
      await expect(treePage.activeItemId).toHaveText('2');
      await expectTree(tree).toEqual([
        {
          label: 'Item 1',
          expansionControl: 'expanded',
          children: [
            {
              label: 'Item 2',
              expansionControl: 'expanded',
              children: [
                {label: 'Item 3', expansionControl: 'notAttached'},
              ],
            },
            {label: 'Item 4', expansionControl: 'notAttached'},
          ],
        },
        {label: 'Item 5', expansionControl: 'notAttached'},
      ]);
      await expect(tree.nodes).toHaveCount(5);
    });

    test('should select the first node on ArrowLeft when no previous node is expanded', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {
          id: 2,
          name: 'Item 2',
          children: [
            {id: 3, name: 'Item 3'},
          ],
        },
        {id: 4, name: 'Item 4'},
        {
          id: 5,
          name: 'Item 5',
          children: [
            {id: 6, name: 'Item 6'},
          ],
        },
      ], {datasource: 'array-http'});

      await tree.node({index: 3}).click();
      await expect(treePage.selection).toHaveText('5');
      await expect(treePage.activeItemId).toHaveText('5');

      await page.keyboard.press('ArrowLeft');
      await expect(treePage.selection).toHaveText('1');
      await expect(treePage.activeItemId).toHaveText('1');
      await expectTree(tree).toEqual([
        {label: 'Item 1', expansionControl: 'notAttached'},
        {label: 'Item 2', expansionControl: 'collapsed'},
        {label: 'Item 4', expansionControl: 'notAttached'},
        {label: 'Item 5', expansionControl: 'collapsed'},
      ]);
      await expect(tree.nodes).toHaveCount(4);
    });
  });

  test.describe('Selection', () => {

    test('should select on End', async ({page}) => {
      const treePage = new TreePagePO(page);
      const tree = new TreePO(treePage.tree);
      await treePage.navigate();
      await treePage.setRowHeight(20);
      await treePage.setHeight(100);
      await treePage.setBufferSize(0);
      await treePage.setPageSize(1);

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
            {
              id: 5,
              name: 'Item 5',
            },
          ],
        },
        {
          id: 6,
          name: 'Item 6',
        },
        {
          id: 7,
          name: 'Item 7',
        },
        {
          id: 8,
          name: 'Item 8',
        },
        {
          id: 9,
          name: 'Item 9',
        },
        {
          id: 10,
          name: 'Item 10',
        },
      ], {datasource: 'array-http'});

      // Select first node
      await tree.node({index: 0}).click();
      await expect(treePage.selection).toHaveText('1');
      await expect(treePage.activeItemId).toHaveText('1');

      // Expand Item 2
      await tree.node({index: 1}).expansionControl.locator.click();
      await expect(treePage.selection).toHaveText('1');
      await expect(treePage.activeItemId).toHaveText('1');

      // Press End
      await page.keyboard.press('End');
      await expect(treePage.selection).toHaveText('10');
      await expect(treePage.activeItemId).toHaveText('10');
    });
  });
});
