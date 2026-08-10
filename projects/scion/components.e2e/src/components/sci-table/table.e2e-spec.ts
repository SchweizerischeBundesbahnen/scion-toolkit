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
      await expectTable(table).allCellsToContainText(1, 'clear');

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
      await expect.poll(() => table.verticalViewport.evaluate(el => el.scrollTop)).toBeGreaterThan(0);

      await table.column('Name').filter('999');
      await expect.poll(() => table.verticalViewport.evaluate(el => el.scrollTop)).toBe(0);
    });

    test('should show empty state', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

      await table.column('Name').filter('abc');
      await expect(table.rows).toHaveCount(0);
      await expect(table.locator).toContainText('No items found.');
    });
  });

  test.describe('resizing', () => {
    test('should resize column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});

      const splitterBounds = await table.splitterBounds('column:name');
      let mouseX = splitterBounds.hcenter;
      await page.mouse.move(mouseX, splitterBounds.top);
      await page.mouse.down();

      mouseX += 100;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(200);

      mouseX += 50;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(250);

      mouseX -= 20;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(230);

      mouseX += 50;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(280);

      await page.mouse.up();
      mouseX += 50;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(280);
    });

    test('should resize multiple columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});
      await tablePage.addColumn({name: 'test', header: 'Test', type: 'string', width: '200px'});

      await table.dragSplitter('column:name', -50);
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(150);
      await expect.poll(() => table.column('Test').getHeaderWidth()).toBe(200);

      await table.dragSplitter('column:test', 50);
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(150);
      await expect.poll(() => table.column('Test').getHeaderWidth()).toBe(250);
    });

    test('should stop at max width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px', maxWidth: 200});

      await table.dragSplitter('column:name', 300);
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(200);
    });

    test('should decrease column width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.dragSplitter('column:name', -100);
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(100);
    });

    test('should stop at min width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px', minWidth: 100});

      await table.dragSplitter('column:name', -300);
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBe(100);
    });

    test('should allow to overflow while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.dragSplitter('column:name', page.viewportSize()?.width ?? 0);
      await expectTable(table).toHaveHorizontalOverflow();
    });

    test('should auto resize', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '200px'});

      await table.dblclickSplitter('column:name');
      await expect.poll(() => table.column('Name').getHeaderWidth()).toBeLessThan(200);
    });

    test('should save sizes between reloads', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();
      await tablePage.setWidth(500);

      await table.dragSplitter('column:id', -100);
      await expect.poll(() => table.column('Id').getHeaderWidth()).toBe(400);

      await page.reload();
      await expect.poll(() => table.column('Id').getHeaderWidth()).toBe(400);
    });

    test('should push out flexible columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();
      await tablePage.setWidth(800);

      await tablePage.addColumn({name: 'one', header: 'One', type: 'string'});
      await tablePage.addColumn({name: 'two', header: 'Two', type: 'string'});
      await tablePage.addColumn({name: 'three', header: 'Three', type: 'string'});

      await expect.poll(() => table.column('One').getHeaderWidth()).toBe(200);

      await table.dragSplitter('column:two', 600);
      await expect.poll(() => table.column('One').getHeaderWidth()).toBe(200);
      await expect.poll(() => table.column('Two').getHeaderWidth()).toBe(800);
      await expect.poll(() => table.column('Three').getHeaderWidth()).toBe(100);

      await table.scrollViewPort('right');
      await table.dragSplitter('column:two', -650);
      await expect.poll(() => table.column('One').getHeaderWidth()).toBe(200);
      await expect.poll(() => table.column('Two').getHeaderWidth()).toBe(150);
      await expect.poll(() => table.column('Three').getHeaderWidth()).toBe(250);
    });

    test('should fix flexible rows on overflow', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();
      await tablePage.setWidth(1000);

      await tablePage.addColumn({name: 'one', header: 'One', type: 'string'});
      await tablePage.addColumn({name: 'two', header: 'Two', type: 'string'});
      await tablePage.addColumn({name: 'three', header: 'Three', type: 'string'});
      await tablePage.addColumn({name: 'four', header: 'Four', type: 'string'});

      await expect.poll(() => table.column('One').getHeaderWidth()).toBe(200);

      await table.dragSplitter('column:three', 600);
      await expect.poll(() => table.column('One').getHeaderWidth()).toBe(200);
      await expect.poll(() => table.column('Two').getHeaderWidth()).toBe(200);
      await expect.poll(() => table.column('Three').getHeaderWidth()).toBe(800);
      await expect.poll(() => table.column('Four').getHeaderWidth()).toBe(100);

      await table.dragSplitter('column:one', 100);
      await expect.poll(() => table.column('One').getHeaderWidth()).toBe(300);
      await expect.poll(() => table.column('Two').getHeaderWidth()).toBe(200);
      await expect.poll(() => table.column('Three').getHeaderWidth()).toBe(800);
      await expect.poll(() => table.column('Four').getHeaderWidth()).toBeCloseTo(100, 1);
    });

    test('should hide row hover while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});

      const splitterBounds = await table.splitterBounds('column:name');
      const rowBounds = await table.row(3).bounds();
      await page.mouse.move(splitterBounds.hcenter, splitterBounds.top);
      await page.mouse.down();
      await page.mouse.move(rowBounds.left, rowBounds.vcenter);
      await expect(table.row(3).locator).not.toHaveCSS('background-color', 'rgb(233, 233, 233)');

      await page.mouse.up();
      await expect(table.row(3).locator).toHaveCSS('background-color', 'rgb(233, 233, 233)');
    });

    test('should scroll viewport and when wheeling on splitter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'test', header: 'Test', type: 'string', width: '100px'});

      const splitterBounds = await table.splitterBounds('column:name');
      await page.mouse.move(splitterBounds.hcenter, splitterBounds.vcenter);

      const initialScrollTop = await table.verticalViewport.evaluate(el => el.scrollTop);
      await page.mouse.wheel(0, 250);
      await expect.poll(() => table.verticalViewport.evaluate(el => el.scrollTop)).toBeGreaterThan(initialScrollTop);
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
      await expectTable(table).toHaveColumnSorted(1);

      // sort descending
      await table.column('Name').sort();
      await expectTable(table).toHaveColumnSorted(1, 'desc');
    });

    test('should sort number column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'price', header: 'Price', type: 'number'});

      // sort ascending
      await table.column('Price').sort();
      await expectTable(table).toHaveColumnSorted(1);

      // sort descending
      await table.column('Price').sort();
      await expectTable(table).toHaveColumnSorted(1, 'desc');
    });

    test('should sort boolean column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'inStock', header: 'In Stock', type: 'boolean'});

      // sort ascending: false values first
      await table.column('In Stock').sort();
      await expectTable(table).toHaveColumnSorted(1);

      // sort descending: true values first
      await table.column('In Stock').sort();
      await expectTable(table).toHaveColumnSorted(1, 'desc');
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
      await expect.poll(() => table.verticalViewport.evaluate(el => el.scrollTop)).toBeGreaterThan(0);

      // applying a sort should reset the viewport scroll position to the top.
      await table.column('Name').sort();
      await expect.poll(() => table.verticalViewport.evaluate(el => el.scrollTop)).toBe(0);
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
      await expectRow(table.row(0)).not.toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(2)).not.toBeSelected();
      await expectRow(table.row(3)).not.toBeSelected();

      await page.keyboard.press('ControlOrMeta+ArrowDown');
      await expectRow(table.row(0)).not.toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(2)).not.toBeSelected();
      await expectRow(table.row(3)).not.toBeSelected();

      await page.keyboard.press('ControlOrMeta+Space');
      await expectRow(table.row(0)).not.toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(2)).toBeSelected();
      await expectRow(table.row(3)).not.toBeSelected();

      await page.keyboard.press('ArrowUp');
      await expectRow(table.row(0)).not.toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(2)).not.toBeSelected();
      await expectRow(table.row(3)).not.toBeSelected();

      await page.keyboard.press('Shift+ArrowUp');
      await expectRow(table.row(0)).toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expectRow(table.row(2)).not.toBeSelected();
      await expectRow(table.row(3)).not.toBeSelected();
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

      await expect(table.row(0).cell(0).locator).not.toHaveAttribute('part', 'column:id row:red');
      await expect(table.row(1).cell(0).locator).not.toHaveAttribute('part', 'column:id row:red');
      await expect(table.row(2).cell(0).locator).not.toHaveAttribute('part', 'column:id row:red');

      await tablePage.conditionallyStyleRow();

      await expect(table.row(0).cell(0).locator).not.toHaveAttribute('part', 'column:id row:red');
      await expect(table.row(1).cell(0).locator).not.toHaveAttribute('part', 'column:id row:red');
      await expect(table.row(2).cell(0).locator).toHaveAttribute('part', 'column:id row:red');
      await expect.poll(() => table.row(2).cell(0).locator.evaluate(element => getComputedStyle(element).backgroundColor))
        .toEqual('rgba(255, 0, 0, 0.2)');
    });

    test('should not conditionally style selected row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.conditionallyStyleRow();

      await expect(table.row(2).cell(0).locator).toHaveAttribute('part', 'column:id row:red');

      await table.row(2).click();

      await expect(table.row(2).cell(0).locator).not.toHaveAttribute('part');
    });

    test('should conditionally style column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({
        header: 'Red',
        name: 'red',
        type: 'string',
      });

      await expect(table.row(0).cell(1).locator).toHaveAttribute('part', 'column:red');
      await expect.poll(() => table.row(0).cell(1).locator.evaluate(element => getComputedStyle(element).backgroundColor))
        .toEqual('rgba(255, 0, 0, 0.2)');
    });
  });

  test.describe('row actions', () => {
    test('should show row actions on hover', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();
      await tablePage.setRowActions(true);

      await table.row(3).hover();
      await expect(table.rowActions).toBeVisible();
    });

    test('should stick row actions to the right', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();
      await tablePage.setWidth(500);
      await tablePage.setRowActions(true);

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});
      await table.dragSplitter('column:name', 500);
      await table.scrollViewPort({x: 0, y: 0});

      const rowBounds = await table.row(3).bounds();
      await page.mouse.move(
        rowBounds.left + 10,
        rowBounds.vcenter,
      );
      await expect(table.rowActions).toBeInViewport({ratio: 1});
    });

    test('should hide row actions while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      const splitterBounds = await table.splitterBounds('column:name');
      const rowBounds = await table.row(3).bounds();
      await page.mouse.move(splitterBounds.hcenter, splitterBounds.top);
      await page.mouse.down();
      await page.mouse.move(rowBounds.hcenter, rowBounds.vcenter);
      await expect(table.rowActions).not.toBeAttached();

      await page.mouse.up();
      await expect(table.rowActions).toBeVisible();
    });

    test('should hide row actions while scrolling', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      await table.row(10).hover();
      await expect(table.rowActions).toBeVisible();

      const initialScrollTop = await table.verticalViewport.evaluate(el => el.scrollTop);
      await page.mouse.wheel(0, 250);
      await expect.poll(() => table.verticalViewport.evaluate(el => el.scrollTop)).toBeGreaterThan(initialScrollTop);
      await expect(table.rowActions).toBeHidden();

      await table.row(10).hover();
      await expect(table.rowActions).toBeVisible();
    });

    test('should scroll viewport and hide row actions when wheeling on toolbar', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'test', header: 'Test', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      await table.row(10).hover();
      await expect(table.rowActions).toBeVisible();

      await table.rowActions.hover();
      const initialScrollTop = await table.verticalViewport.evaluate(el => el.scrollTop);
      await page.mouse.wheel(0, 250);
      await expect.poll(() => table.verticalViewport.evaluate(el => el.scrollTop)).toBeGreaterThan(initialScrollTop);
      await expect(table.rowActions).toBeHidden();
    });

    test('should keep row actions visible when moving between row toolbar and overlay', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'test', header: 'Test', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      await table.row(10).hover();
      await expect(table.rowActions).toBeVisible();

      await table.rowActions.hover();
      await expect(table.rowActions).toBeVisible();

      const splitterBounds = await table.splitterBounds('column:name');
      await page.mouse.move(splitterBounds.hcenter, splitterBounds.vcenter);
      await expect(table.rowActions).toBeVisible();
    });

    test('should hide row actions when leaving overlay or toolbar for header', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePo(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'test', header: 'Test', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      await table.row(10).hover();
      await expect(table.rowActions).toBeVisible();

      const splitterBounds = await table.splitterBounds('column:name');
      await page.mouse.move(splitterBounds.hcenter, splitterBounds.vcenter);
      await expect(table.rowActions).toBeVisible();

      await table.headers.first().hover();
      await expect(table.rowActions).toBeHidden();

      await table.row(10).hover();
      await expect(table.rowActions).toBeVisible();

      await table.rowActions.hover();
      await expect(table.rowActions).toBeVisible();

      await table.headers.first().hover();
      await expect(table.rowActions).toBeHidden();
    });
  });
});
