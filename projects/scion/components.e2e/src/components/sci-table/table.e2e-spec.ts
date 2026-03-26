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
      await expect(table.filters).toHaveCount(0);

      await tablePage.setFilterable(true);
      await expect(table.filters).toHaveCount(1);
    });

    test('should disable sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.setSortable(false);
      await expect(table.sortButtons).toHaveCount(0);

      await tablePage.setSortable(true);
      await expect(table.sortButtons).toHaveCount(1);
    });

    test('should hide header', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.showHeader(false);
      await expect(table.headers.first()).not.toBeAttached();

      await tablePage.showHeader(true);
      await expect(table.headers.first()).toBeAttached();
    });

    test('should disable resize', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.setResizable(false);
      await expect(table.splitters).toHaveCount(0);

      await tablePage.setResizable(true);
      await expect(table.splitters).toHaveCount(1);
    });

    test('should adapt to container size', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await expect(table.rows.first()).toBeAttached();
      const count = await table.rows.count();

      await tablePage.setHeight(1500);
      await expect.poll(() => table.rows.count()).toBeGreaterThan(count);

      await tablePage.setHeight(200);
      await expect.poll(() => table.rows.count()).toBeLessThan(count);
    });

    test('should be able to set item size', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await expect(table.rows.first()).toBeAttached();
      const count = await table.rows.count();

      await tablePage.setRowSize(50);
      await expect.poll(() => table.rows.first().boundingBox().then(b => b?.height)).toBe(50);
      await expect.poll(() => table.rows.count()).toBeLessThan(count);

      await tablePage.setRowSize(20);
      await expect.poll(() => table.rows.first().boundingBox().then(b => b?.height)).toBe(20);
      await expect.poll(() => table.rows.count()).toBeGreaterThan(count);
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

      await expect(table.headers).toHaveCount(21);
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

      const noFilterCount = await table.rows.count();

      await table.enterColumnFilter(1, 'Product 1');
      await expectTable(table).allCellsToContainText(1, 'Product 1');

      await table.clearColumnFilter(1);
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter number column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'price', header: 'Price', type: 'number'});
      const noFilterCount = await table.rows.count();

      // read the first visible price value and use it as the filter criterion
      const firstPrice = (await table.locateColumnCells(1).first().textContent())!.trim();
      await table.enterColumnFilter(1, firstPrice);
      await expectTable(table).allCellsToContainText(1, firstPrice);

      await table.clearColumnFilter(1);
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter boolean column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'inStock', header: 'In Stock', type: 'boolean'});
      const noFilterCount = await table.rows.count();

      await table.enterColumnFilter(1, 'false');
      await expectTable(table).allCellsToContainText(1, 'check_box_outline_blank');

      await table.enterColumnFilter(1, '');
      await expect(table.rows).toHaveCount(noFilterCount);
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
      const noFilterCount = await table.rows.count();

      await table.enterColumnFilter(1, 'Product 9999');
      await expect(table.rows).toHaveCount(1);

      await table.clearColumnFilter(1);
      await expect(table.rows).toHaveCount(noFilterCount);
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
      const noFilterCount = await table.rows.count();

      await table.enterColumnFilter(1, 'Product 9999');
      await expect(table.rows).toHaveCount(1);

      await table.clearColumnFilter(1);
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter large amount of data', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.setRowCount(1_000_000);
      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      await table.enterColumnFilter(1, '999999');
      await expect(table.rows).toHaveCount(1);
    });

    test('should reset scroll position to top when applying filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      await table.scrollViewPort({x: 0, y: 1000});
      const scrollTopAfterScroll = await table.viewport.evaluate(el => el.scrollTop);
      expect(scrollTopAfterScroll).toBeGreaterThan(0);

      await table.enterColumnFilter(1, '999');
      await expect.poll(() => table.viewport.evaluate(el => el.scrollTop)).toBe(0);
    });

    test('should use select for filter values', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', filterValues: ['Product 1111', 'Product 1112']});

      const noFilterCount = await table.rows.count();

      await table.enterColumnFilter(1, 'Product 1112');
      await expect(table.rows).toHaveCount(1);

      await table.clearColumnFilter(1);
      await expect(table.rows).toHaveCount(noFilterCount);
    });
  });

  test.describe('resizing', () => {
    test('should increase column width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});

      await table.dragColumnSplitter(1, 100);
      await expect.poll(() => table.getColumnHeaderWidth(1)).toBe(200);
    });

    test('should stop at max width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px', maxWidth: '200px'});

      await table.dragColumnSplitter(1, 300);
      await expect.poll(() => table.getColumnHeaderWidth(1)).toBe(200);
    });

    test('should decrease column width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.dragColumnSplitter(1, -100);
      await expect.poll(() => table.getColumnHeaderWidth(1)).toBe(100);
    });

    test('should stop at min width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px', minWidth: '100px'});

      await table.dragColumnSplitter(1, -300);
      await expect.poll(() => table.getColumnHeaderWidth(1)).toBe(100);
    });

    test('should allow to overflow while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.dragColumnSplitter(1, page.viewportSize()?.width ?? 0);

      await expectTable(table).toHaveHorizontalOverflow();
    });

    test('should auto resize', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.splitters.nth(1).dblclick();

      await expect.poll(() => table.getColumnHeaderWidth(1)).toBeLessThan(200);
    });

    test('should save sizes between reloads', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.dragColumnSplitter(0, 100);
      await expect.poll(() => table.getColumnHeaderWidth(0)).toBe(200);

      await page.reload();

      await expect.poll(() => table.getColumnHeaderWidth(0)).toBe(200);
    });
  });

  test.describe('sorting', () => {
    test('should sort string column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      // sort ascending
      await table.clickColumnSort(1);
      const ascTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...ascTexts].sort((a, b) => a.localeCompare(b)));

      // sort descending
      await table.clickColumnSort(1);
      const descTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...descTexts].sort((a, b) => b.localeCompare(a)));
    });

    test('should sort number column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'price', header: 'Price', type: 'number'});

      // sort ascending
      await table.clickColumnSort(1);
      const ascTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...ascTexts.map(Number)].sort((a, b) => a - b).map(String));

      // sort descending
      await table.clickColumnSort(1);
      const descTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...descTexts.map(Number)].sort((a, b) => b - a).map(String));
    });

    test('should sort boolean column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'inStock', header: 'In Stock', type: 'boolean'});

      // sort ascending: false values first
      await table.clickColumnSort(1);

      const ascTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1))
        .toHaveText([...ascTexts.map(t => t.trim() === 'check_box' ? 0 : 1)]
          .sort((a, b) => b - a)
          .map(checked => checked === 0 ? 'check_box' : 'check_box_outline_blank'),
        );

      // sort descending: true values first
      await table.clickColumnSort(1);

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

      await table.clickColumnSort(1);
      await expect(table.locateColumnCells(1).first()).toHaveText('1');
      await table.clickColumnSort(1);
      await expect(table.locateColumnCells(1).first()).toHaveText('1000');
    });

    test('should reset scroll position to top when applying sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      // scroll down so the viewport is no longer at the top.
      await table.scrollViewPort({x: 0, y: 1000});
      const scrollTopAfterScroll = await table.viewport.evaluate(el => el.scrollTop);
      expect(scrollTopAfterScroll).toBeGreaterThan(0);

      // applying a sort should reset the viewport scroll position to the top.
      await table.clickColumnSort(1);
      await expect.poll(() => table.viewport.evaluate(el => el.scrollTop)).toBe(0);
    });
  });

  test.describe('selection', () => {
    test('should toggle row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.clickRow(0);
      await expect(table.rows.nth(0)).toContainClass('selected');

      await table.clickRow(1);
      await expect(table.rows.nth(0)).not.toContainClass('selected');
      await expect(table.rows.nth(1)).toContainClass('selected');
    });

    test('should select multiple rows with ctrl', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.clickRow(0);
      await expect(table.rows.nth(0)).toContainClass('selected');

      await table.clickRow(1, ['ControlOrMeta']);
      await expect(table.rows.nth(1)).toContainClass('selected');
      await expect(table.rows.nth(0)).toContainClass('selected');

      await table.clickRow(0, ['ControlOrMeta']);
      await expect(table.rows.nth(1)).toContainClass('selected');
      await expect(table.rows.nth(0)).not.toContainClass('selected');
    });

    test('should select multiple rows with shift', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.clickRow(0);
      await expect(table.rows.nth(0)).toContainClass('selected');

      await table.clickRow(3, ['Shift']);
      await expect(table.rows.nth(0)).toContainClass('selected');
      await expect(table.rows.nth(1)).toContainClass('selected');
      await expect(table.rows.nth(2)).toContainClass('selected');
      await expect(table.rows.nth(3)).toContainClass('selected');

      await table.clickRow(2, ['ControlOrMeta']);
      await expect(table.rows.nth(2)).not.toContainClass('selected');
      await expect(table.rows.nth(0)).toContainClass('selected');
      await expect(table.rows.nth(1)).toContainClass('selected');
      await expect(table.rows.nth(3)).toContainClass('selected');
    });

    test('should keep selection on scroll', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.clickRow(0);
      await expect(table.rows.nth(0)).toContainClass('selected');

      await table.scrollViewPort({x: 0, y: 1000});
      await expect(table.rows.nth(0)).not.toContainClass('selected');

      await table.scrollViewPort({x: 0, y: 0});
      await expect(table.rows.nth(0)).toContainClass('selected');
    });

    test('should keep selection on filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.clickRow(0);
      await expect(table.rows.nth(0)).toContainClass('selected');

      await table.enterColumnFilter(0, '9999');
      await expect(table.rows.nth(0)).not.toContainClass('selected');

      await table.clearColumnFilter(0);
      await expect(table.rows.nth(0)).toContainClass('selected');
    });

    test('should keep selection on sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.clickRow(0);
      await expect(table.rows.nth(0)).toContainClass('selected');

      await table.clickColumnSort(0);
      // click twice to sort descending
      await table.clickColumnSort(0);
      await expect(table.rows.nth(0)).not.toContainClass('selected');

      await table.clickColumnSort(0);
      await expect(table.rows.nth(0)).toContainClass('selected');
    });
  });
});
