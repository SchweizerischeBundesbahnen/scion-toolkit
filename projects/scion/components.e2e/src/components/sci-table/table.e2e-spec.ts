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
import {expectRow} from './row-matcher';

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
      await expect(table.headers).toHaveCount(0);

      await tablePage.showHeader(true);
      await expect(table.headers).toHaveCount(1);
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

      await expectRow(table.row(0)).toBeAttached();
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

      await expectRow(table.row(0)).toBeAttached();
      const count = await table.rows.count();

      await tablePage.setRowSize(50);
      await expect.poll(() => table.rows.first().boundingBox().then(b => b?.height)).toBe(50);
      await expect.poll(() => table.rows.count()).toBeLessThan(count);

      await tablePage.setRowSize(20);
      await expect.poll(() => table.rows.first().boundingBox().then(b => b?.height)).toBe(20);
      await expect.poll(() => table.rows.count()).toBeGreaterThan(count);
    });

    test('should render multiple tables', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.setTableCount(4);

      await expect(table.locator).toHaveCount(4);

      // Should not interfere with other tables
      await table.column(0).sort();

      await expect(table.column(0).locator.locator('[data-sort="asc"]')).toBeAttached();
      await expect(table.column(1).locator).toBeAttached();
      await expect(table.column(1).locator.locator('[data-sort="asc"]')).not.toBeAttached();
      await expect(table.column(2).locator).toBeAttached();
      await expect(table.column(2).locator.locator('[data-sort="asc"]')).not.toBeAttached();
      await expect(table.column(3).locator).toBeAttached();
      await expect(table.column(3).locator.locator('[data-sort="asc"]')).not.toBeAttached();
    });
  });

  test.describe('columns', () => {
    test('should add string column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'test-column', header: 'Test Column', type: 'string'});
      await expect(table.column('Test Column').locator).toBeVisible();
    });

    test('should add number column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'test-column', header: 'Test Column', type: 'number'});
      await expect(table.column('Test Column').locator).toBeVisible();
    });

    test('should add boolean column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'test-column', header: 'Test Column', type: 'boolean'});
      await expect(table.column('Test Column').locator).toBeVisible();
    });

    test('should add template column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'test-column', header: 'Test Column', type: 'template'});
      await expect(table.column('Test Column').locator).toBeVisible();
    });

    test('should add component column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'test-column', header: 'Test Column', type: 'component'});
      await expect(table.column('Test Column').locator).toBeVisible();
    });

    test('should add a lot of columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      for (let i = 0; i < 20; i++) {
        await tablePage.addColumn({name: `col-${i}`, header: `Column ${i}`, type: 'string'});
      }

      await expectTable(table).toHaveColumnCount(21);
      await expectTable(table).toHaveHorizontalOverflow();

      const col19 = table.column('Column 19');

      await expect(col19.locator).not.toBeInViewport();
      await table.scrollViewPort('right');
      await expect(col19.locator).toBeInViewport();
      await expect(col19.locator).toBeInViewport();
      await table.scrollViewPort({x: 0, y: 0});
      await expect(col19.locator).not.toBeInViewport();
    });
  });

  test.describe('filtering', () => {
    test('should filter string column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      const noFilterCount = await table.rows.count();

      await table.column('Name').filter('Product 1');
      await expectTable(table).allCellsToContainText(1, 'Product 1');

      await table.column('Name').clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter number column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'price', header: 'Price', type: 'number'});
      const noFilterCount = await table.rows.count();

      // read the first visible price value and use it as the filter criterion
      const firstPrice = (await table.row(0).cell(0).textContent())!.trim();
      await table.column('Price').filter(firstPrice);
      await expectTable(table).allCellsToContainText(1, firstPrice);

      await table.column('Price').clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter boolean column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'inStock', header: 'In Stock', type: 'boolean'});
      const noFilterCount = await table.rows.count();

      await table.column('In Stock').filter('false');
      await expectTable(table).allCellsToContainText(1, 'check_box_outline_blank');

      await table.column('In Stock').filter('');
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should not filter template column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'template', header: 'Template', type: 'template'});

      const templateCol = table.column('Template');
      await expect(templateCol.locator).toBeAttached();
      await expect(templateCol.filterLocator).not.toBeAttached();
    });

    test('should filter template column with custom filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'template', header: 'Template', type: 'template', customFilter: true});
      const noFilterCount = await table.rows.count();

      await table.column('Template').filter('Product 9999');
      await expect(table.rows).toHaveCount(1);

      await table.column('Template').clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should not filter component column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'component', header: 'Component', type: 'component'});

      const componentCol = table.column('Component');

      await expect(componentCol.locator).toBeAttached();
      await expect(componentCol.filterLocator).not.toBeAttached();
    });

    test('should filter component column with custom filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'component', header: 'Component', type: 'component', customFilter: true});
      const noFilterCount = await table.rows.count();

      await table.column('Component').filter('Product 9999');
      await expect(table.rows).toHaveCount(1);

      await table.column('Component').clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter large amount of data', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.setRowCount(1_000_000);
      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      await table.column('Name').filter('999999');
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

      await table.column('Name').filter('999');
      await expect.poll(() => table.viewport.evaluate(el => el.scrollTop)).toBe(0);
    });

    test('should use select for filter values', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', filterValues: ['Product 1111', 'Product 1112']});

      const noFilterCount = await table.rows.count();

      await table.column('Name').filter('Product 1112');
      await expect(table.rows).toHaveCount(1);

      await table.column('Name').clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should show empty state', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      await table.column('Name').filter('abc');
      await expect(table.rows).toHaveCount(0);
      await expect(table.locator).toContainText('Nothing to show');
    });
  });

  test.describe('resizing', () => {
    test('should increase column width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});

      await table.column('Name').dragSplitter(100);
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(200);
    });

    test('should stop at max width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px', maxWidth: '200px'});

      await table.column('Name').dragSplitter(300);
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(200);
    });

    test('should decrease column width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.column('Name').dragSplitter(-100);
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(100);
    });

    test('should stop at min width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px', minWidth: '100px'});

      await table.column('Name').dragSplitter(-300);
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(100);
    });

    test('should allow to overflow while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.column('Name').dragSplitter(page.viewportSize()?.width ?? 0);

      await expectTable(table).toHaveHorizontalOverflow();
    });

    test('should auto resize', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.column('Name').dblclickSplitter();
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBeLessThan(200);
    });

    test('should save sizes between reloads', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      const col = table.column(0);

      await col.dragSplitter(100);
      await expect.poll(() => col.getHeaderWidth()).toBe(200);

      await page.reload();

      await expect.poll(() => col.getHeaderWidth()).toBe(200);
    });
  });

  test.describe('sorting', () => {
    test('should sort string column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      // sort ascending
      await table.column('Name').sort();

      const ascTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...ascTexts].sort((a, b) => a.localeCompare(b)));

      // sort descending
      await table.column('Name').sort();
      const descTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...descTexts].sort((a, b) => b.localeCompare(a)));
    });

    test('should sort number column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'price', header: 'Price', type: 'number'});

      // sort ascending
      await table.column('Price').sort();
      const ascTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...ascTexts.map(Number)].sort((a, b) => a - b).map(String));

      // sort descending
      await table.column('Price').sort();
      const descTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1)).toHaveText([...descTexts.map(Number)].sort((a, b) => b - a).map(String));
    });

    test('should sort boolean column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'inStock', header: 'In Stock', type: 'boolean'});

      // sort ascending: false values first
      await table.column('In Stock').sort();

      const ascTexts = await table.locateColumnCells(1).allTextContents();
      await expect(table.locateColumnCells(1))
        .toHaveText([...ascTexts.map(t => t.trim() === 'check_box' ? 0 : 1)]
          .sort((a, b) => b - a)
          .map(checked => checked === 0 ? 'check_box' : 'check_box_outline_blank'),
        );

      // sort descending: true values first
      await table.column('In Stock').sort();

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

      await table.column('Price').sort();
      await expect(table.locateColumnCells(1).first()).toHaveText('1');
      await table.column('Price').sort();
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
      await table.column('Name').sort();
      await expect.poll(() => table.viewport.evaluate(el => el.scrollTop)).toBe(0);
    });
  });

  test.describe('selection', () => {
    test('should toggle row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.row(1).click();
      await expectRow(table.row(0)).not.toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
    });

    test('should select multiple rows with ctrl', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.row(1).click(['ControlOrMeta']);
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(0)).toBeSelected();

      await table.row(0).click(['ControlOrMeta']);
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(0)).not.toBeSelected();
    });

    test('should select multiple rows with shift', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.row(3).click(['Shift']);
      await expectRow(table.row(0)).toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(2)).toBeSelected();
      await expectRow(table.row(3)).toBeSelected();

      await table.row(2).click(['ControlOrMeta']);
      await expectRow(table.row(2)).not.toBeSelected();
      await expectRow(table.row(0)).toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(3)).toBeSelected();
    });

    test('should keep selection on scroll', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.scrollViewPort({x: 0, y: 1000});
      await expectRow(table.row(0)).not.toBeSelected();

      await table.scrollViewPort({x: 0, y: 0});
      await expectRow(table.row(0)).toBeSelected();
    });

    test('should keep selection on filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.column(0).filter('9999');
      await expectRow(table.row(0)).not.toBeSelected();

      await table.column(0).clearFilter();
      await expectRow(table.row(0)).toBeSelected();
    });

    test('should keep selection on sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.column(0).sort();
      // click twice to sort descending
      await table.column(0).sort();
      await expectRow(table.row(0)).not.toBeSelected();

      await table.column(0).sort();
      await expectRow(table.row(0)).toBeSelected();
    });

    test('should activate element with keyboard', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.row(0).click();
      await expectRow(table.row(0)).toBeActive();

      await page.keyboard.press('ArrowDown');
      await expectRow(table.row(1)).toBeActive();

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await expectRow(table.row(3)).toBeActive();

      await page.keyboard.press('ArrowUp');
      await expectRow(table.row(2)).toBeActive();
    });

    test('should select element with keyboard', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();
      await expectRow(table.row(1)).not.toBeSelected();
      await expectRow(table.row(2)).not.toBeSelected();
      await expectRow(table.row(3)).not.toBeSelected();

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Space');
      await expectRow(table.row(0)).toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(2)).not.toBeSelected();
      await expectRow(table.row(3)).not.toBeSelected();

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Space');
      await expectRow(table.row(0)).toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(2)).not.toBeSelected();
      await expectRow(table.row(3)).toBeSelected();

      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Space');
      await expectRow(table.row(0)).toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(2)).toBeSelected();
      await expectRow(table.row(3)).toBeSelected();

      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('Space');
      await expectRow(table.row(0)).toBeSelected();
      await expectRow(table.row(1)).not.toBeSelected();
      await expectRow(table.row(2)).toBeSelected();
      await expectRow(table.row(3)).toBeSelected();
    });

    test('should scroll on with active element', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      const count = await table.rows.count();

      await expectTable(table).not.toHaveVerticalScroll();
      for (let i = 0; i < count; i++) {
        await page.keyboard.press('ArrowDown');
      }
      await expectTable(table).toHaveVerticalScroll();

      for (let i = 0; i < count; i++) {
        await page.keyboard.press('ArrowUp');
      }
      await expectTable(table).not.toHaveVerticalScroll();
    });
  });

  test.describe('styling', () => {
    test('should conditionally style row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await expectRow(table.row(0)).not.toHavePart();
      await expectRow(table.row(1)).not.toHavePart();
      await expectRow(table.row(2)).not.toHavePart();

      await tablePage.conditionallyStyleRow();

      await expectRow(table.row(0)).not.toHavePart();
      await expectRow(table.row(1)).not.toHavePart();
      await expectRow(table.row(2)).toHavePart('red-row');
    });

    test('should not conditionally style selected row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.conditionallyStyleRow();

      await expectRow(table.row(2)).toHavePart('red-row');

      await table.row(2).click();

      await expectRow(table.row(2)).not.toHavePart();
    });

    test('should conditionally style cell', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({
        header: 'Style',
        name: 'style',
        type: 'string',
        conditionallyStyleCell: true,
      });

      await expect(table.row(0).cell(1).locator).not.toHaveAttribute('part');
      await expect(table.row(1).cell(1).locator).not.toHaveAttribute('part');
      await expect(table.row(2).cell(1).locator).toHaveAttribute('part', 'red-cell');
    });
  });
});
