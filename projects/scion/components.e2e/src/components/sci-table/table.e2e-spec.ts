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
import {TablePo} from './table.po';
import {expectTable} from './table-matcher';

test.describe('sci-table', () => {

  test.describe('global properties', () => {
    test('should disable filters', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.setFilterable(false);
      await expect(table.locateFilters()).toHaveCount(0);

      await tablePage.setFilterable(true);
      await expect(table.locateFilters()).toHaveCount(1);
    });

    test('should disable sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.setSortable(false);
      await expect(table.locateSortButtons()).toHaveCount(0);

      await tablePage.setSortable(true);
      await expect(table.locateSortButtons()).toHaveCount(1);
    });

    test('should disable resize', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.setResizable(false);
      await expect(table.locateSplitters()).toHaveCount(0);

      await tablePage.setResizable(true);
      await expect(table.locateSplitters()).toHaveCount(1);
    });
  });

  test.describe('columns', () => {
    test('should add string column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'test-column', header: 'Test Column', type: 'string'});
      await expect(table.locateColumnHeader('Test Column')).toBeVisible();
    });

    test('should add number column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'test-column', header: 'Test Column', type: 'number'});
      await expect(table.locateColumnHeader('Test Column')).toBeVisible();
    });

    test('should add boolean column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'test-column', header: 'Test Column', type: 'boolean'});
      await expect(table.locateColumnHeader('Test Column')).toBeVisible();
    });

    test('should add template column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'test-column', header: 'Test Column', type: 'template'});
      await expect(table.locateColumnHeader('Test Column')).toBeVisible();
    });

    test('should add component column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'test-column', header: 'Test Column', type: 'component'});
      await expect(table.locateColumnHeader('Test Column')).toBeVisible();
    });

    test('should add a lot of columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      for (let i = 0; i < 20; i++) {
        await tablePage.addColumn({name: `col-${i}`, header: `Column ${i}`, type: 'string'});
      }

      await expect(table.locateColumnHeaders()).toHaveCount(21);
      await expectTable(table).toHaveHorizontalOverflow();

      await expect(table.locateColumnHeader('Column 19')).not.toBeInViewport();
      await table.scrollViewPort('right');
      await expect(table.locateColumnHeader('Column 19')).toBeInViewport();
      await table.scrollViewPort({x: 0, y: 0});
      await expect(table.locateColumnHeader('Column 19')).not.toBeInViewport();
    });
  });

  test.describe('filtering', () => {
    test('should filter string column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      const noFilterCount = await table.locateColumnCells(1).count();

      await table.enterColumnFilter(1, 'Product 1');
      await expectTable(table).allCellsToContainText(1, 'Product 1');

      await table.clearColumnFilter(1);
      await expect(table.locateColumnCells(1)).toHaveCount(noFilterCount);
    });

    test('should filter number column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'price', header: 'Price', type: 'number'});
      const noFilterCount = await table.locateColumnCells(1).count();

      // read the first visible price value and use it as the filter criterion
      const firstPrice = (await table.locateColumnCells(1).first().textContent())!.trim();
      await table.enterColumnFilter(1, firstPrice);
      await expectTable(table).allCellsToContainText(1, firstPrice);

      await table.clearColumnFilter(1);
      await expect(table.locateColumnCells(1)).toHaveCount(noFilterCount);
    });

    test('should filter boolean column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'inStock', header: 'In Stock', type: 'boolean'});
      const noFilterCount = await table.locateColumnCells(1).count();

      await table.enterColumnFilter(1, 'false');
      await expectTable(table).allCellsToContainText(1, 'check_box_outline_blank');

      await table.enterColumnFilter(1, '');
      await expect(table.locateColumnCells(1)).toHaveCount(noFilterCount);
    });

    test('should not filter template column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'template', header: 'Template', type: 'template'});

      await expect(table.locateColumnHeader('Template')).toBeAttached();
      await expect(table.locateColumnFilter(1)).not.toBeAttached();
    });

    test('should filter template column with custom filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'template', header: 'Template', type: 'template', customFilter: true});
      const noFilterCount = await table.locateColumnCells(1).count();

      await table.enterColumnFilter(1, 'test');
      await expect(table.locateColumnCells(1)).toHaveCount(1);

      await table.clearColumnFilter(1);
      await expect(table.locateColumnCells(1)).toHaveCount(noFilterCount);
    });

    test('should not filter component column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'component', header: 'Component', type: 'component'});

      await expect(table.locateColumnHeader('Component')).toBeAttached();
      await expect(table.locateColumnFilter(1)).not.toBeAttached();
    });

    test('should filter component column with custom filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'component', header: 'Component', type: 'component', customFilter: true});
      const noFilterCount = await table.locateColumnCells(1).count();

      await table.enterColumnFilter(1, 'test');
      await expect(table.locateColumnCells(1)).toHaveCount(1);

      await table.clearColumnFilter(1);
      await expect(table.locateColumnCells(1)).toHaveCount(noFilterCount);
    });

    test('should filter large amount of data', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.setRowCount(1_000_000);
      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      await table.enterColumnFilter(1, '999999');
      await expect(table.locateColumnCells(1)).toHaveCount(1);
    });
  });

  test.describe('resizing', () => {
    test('should increase column width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});

      await table.dragColumnSplitter(1, 100);
      const widthAfter = await table.getColumnHeaderWidth(1);

      expect(widthAfter).toBe(200);
    });

    test('should stop at max width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px', maxWidth: '200px'});

      await table.dragColumnSplitter(1, 300);
      const widthAfter = await table.getColumnHeaderWidth(1);

      expect(widthAfter).toBe(200);
    });

    test('should decrease column width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.dragColumnSplitter(1, -100);
      const widthAfter = await table.getColumnHeaderWidth(1);

      expect(widthAfter).toBe(100);
    });

    test('should stop at min width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px', minWidth: '100px'});

      await table.dragColumnSplitter(1, -300);
      const widthAfter = await table.getColumnHeaderWidth(1);

      expect(widthAfter).toBe(100);
    });

    test('should allow to overflow while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.dragColumnSplitter(1, page.viewportSize()?.width ?? 0);

      await expectTable(table).toHaveHorizontalOverflow();
    });
  });

  test.describe('sorting', () => {
    test('should sort string column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      // sort ascending
      await table.clickColumnSort('Name');
      const ascTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...ascTexts].sort((a, b) => a.localeCompare(b)));

      // sort descending
      await table.clickColumnSort('Name');
      const descTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...descTexts].sort((a, b) => b.localeCompare(a)));
    });

    test('should sort number column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'price', header: 'Price', type: 'number'});

      // sort ascending
      await table.clickColumnSort('Price');
      const ascTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...ascTexts.map(Number)].sort((a, b) => a - b).map(String));

      // sort descending
      await table.clickColumnSort('Price');
      const descTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...descTexts.map(Number)].sort((a, b) => b - a).map(String));
    });

    test('should sort boolean column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'inStock', header: 'In Stock', type: 'boolean'});

      // sort ascending: false values first
      await table.clickColumnSort('In Stock');

      const ascTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1))
        .toHaveText([...ascTexts.map(t => t.trim() === 'check_box' ? 0 : 1)]
          .sort((a, b) => b - a)
          .map(checked => checked === 0 ? 'check_box' : 'check_box_outline_blank'),
        );

      // sort descending: true values first
      await table.clickColumnSort('In Stock');

      const descTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1))
        .toHaveText([...descTexts.map(t => t.trim() === 'check_box' ? 0 : 1)]
          .sort((a, b) => a - b)
          .map(checked => checked === 0 ? 'check_box' : 'check_box_outline_blank'),
        );
    });

    test('should sort large amount of data', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.setRowCount(1_000_000);
      await tablePage.addColumn({name: 'price', header: 'Price', type: 'number'});

      await table.clickColumnSort('Price');
      await expect(table.locateColumnCells(1).first()).toHaveText('1');
      await table.clickColumnSort('Price');
      await expect(table.locateColumnCells(1).first()).toHaveText('1000');
    });
  });
});
