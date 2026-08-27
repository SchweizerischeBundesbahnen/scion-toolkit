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
import {TablePO} from './table.po';
import {expectTable} from './table-matcher';
import {expectRow} from './row-matcher';
import {fromRect, hasDefaultStackingLevel, waitUntilAngularStable, waitUntilStable} from '../../helper/testing.utils';
import {generateData, provideHttpDatasource} from './datasource/table-http-datasource';

test.describe.only('sci-table', () => {

  test.describe('Table Configuration', () => {

    test('should disable filters', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await tablePage.setFilterable(false);
      await expect(table.filters).toHaveCount(0);

      await tablePage.setFilterable(true);
      await expect(table.filters).toHaveCount(1);
    });

    test('should disable sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await tablePage.setSortable(false);
      await expect(table.sortButtons).toHaveCount(0);

      await tablePage.setSortable(true);
      await expect(table.sortButtons).toHaveCount(1);
    });

    test('should hide header', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await tablePage.showHeader(false);
      await expect(table.headers).toHaveCount(0);

      await tablePage.showHeader(true);
      await expect(table.headers).toHaveCount(1);
    });

    test('should disable resize', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await tablePage.setResizable(false);
      await expect(table.column({name: 'column:name'}).splitter.locator).not.toBeAttached();

      await tablePage.setResizable(true);
      await expect(table.column({name: 'column:name'}).splitter.locator).toBeAttached();
    });

    test('should adapt to container size', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await expectRow(table.row(0)).toBeAttached();
      const count = await table.rows.count();

      await tablePage.setHeight(1500);
      await expect.poll(() => table.rows.count()).toBeGreaterThan(count);

      await tablePage.setHeight(200);
      await expect.poll(() => table.rows.count()).toBeLessThan(count);
    });

    test('should be able to set item size', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await expectRow(table.row(0)).toBeAttached();
      const count = await table.rows.count();

      await tablePage.setRowHeight(50);
      await expect.poll(() => table.rows.first().boundingBox().then(b => b?.height)).toBe(50);
      await expect.poll(() => table.rows.count()).toBeLessThan(count);

      await tablePage.setRowHeight(20);
      await expect.poll(() => table.rows.first().boundingBox().then(b => b?.height)).toBe(20);
      await expect.poll(() => table.rows.count()).toBeGreaterThan(count);
    });

    test('should render multiple tables', async ({page}) => {
      const tablePage = new TablePagePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await tablePage.setTableCount(4);

      await expect(tablePage.table).toHaveCount(4);

      const table1 = new TablePO(tablePage.locator.locator('sci-table').nth(0));
      const table2 = new TablePO(tablePage.locator.locator('sci-table').nth(1));
      const table3 = new TablePO(tablePage.locator.locator('sci-table').nth(2));
      const table4 = new TablePO(tablePage.locator.locator('sci-table').nth(3));

      await expectTable(table1).toHaveColumnCount(1);
      await expectTable(table2).toHaveColumnCount(1);
      await expectTable(table3).toHaveColumnCount(1);
      await expectTable(table4).toHaveColumnCount(1);

      // Verify no interference when interacting with a table.
      await table1.column({name: 'column:name'}).sort();
      await expect.poll(() => table1.column({name: 'column:name'}).sortDirection()).toEqual('asc');
      await expect.poll(() => table2.column({name: 'column:name'}).sortDirection()).toBeNull();
      await expect.poll(() => table3.column({name: 'column:name'}).sortDirection()).toBeNull();
      await expect.poll(() => table4.column({name: 'column:name'}).sortDirection()).toBeNull();

      await table3.column({name: 'column:name'}).sort();
      await expect.poll(() => table1.column({name: 'column:name'}).sortDirection()).toEqual('asc');
      await expect.poll(() => table2.column({name: 'column:name'}).sortDirection()).toBeNull();
      await expect.poll(() => table3.column({name: 'column:name'}).sortDirection()).toEqual('asc')
      await expect.poll(() => table4.column({name: 'column:name'}).sortDirection()).toBeNull();
    });
  });

  test.describe('Columns', () => {

    test('should add string column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:testee', type: 'string'});
      await expect(table.column({name: 'column:testee'}).header).toBeVisible();
    });

    test('should add number column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:testee', type: 'number'});
      await expect(table.column({name: 'column:testee'}).header).toBeVisible();
    });

    test('should add boolean column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:testee', type: 'boolean'});
      await expect(table.column({name: 'column:testee'}).header).toBeVisible();
    });

    test('should add template column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:testee', type: 'template'});
      await expect(table.column({name: 'column:testee'}).header).toBeVisible();
    });

    test('should add component column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:testee', type: 'component'});
      await expect(table.column({name: 'column:testee'}).header).toBeVisible();
    });

    test('should add a lot of columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      for (let i = 0; i < 20; i++) {
        await tablePage.addColumn({name: `column:${i}`, type: 'string'});
      }

      await expectTable(table).toHaveColumnCount(20);
      await expectTable(table).toHaveHorizontalOverflow();

      const col19 = table.column({index: 19});

      await expect(col19.header).not.toBeInViewport();
      await table.scrollTo({x: 'end'});
      await expect(col19.header).toBeInViewport();
      await table.scrollTo({x: 'start'});
      await expect(col19.header).not.toBeInViewport();
    });

    test('should add and remove columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', type: 'string'});
      await tablePage.addColumn({name: 'column:3', type: 'string'});

      await expectTable(table).toHaveColumnCount(3);
      await expect(table.column({name: 'column:1'}).header).toBeVisible();
      await expect(table.column({name: 'column:2'}).header).toBeVisible();
      await expect(table.column({name: 'column:3'}).header).toBeVisible();

      // Hide column 2.
      await tablePage.setColumnVisible('column:2', false);
      await expectTable(table).toHaveColumnCount(2);
      await expect(table.column({name: 'column:1'}).header).toBeVisible();
      await expect(table.column({name: 'column:2'}).header).not.toBeAttached();
      await expect(table.column({name: 'column:3'}).header).toBeVisible();

      // Hide column 3.
      await tablePage.setColumnVisible('column:3', false);
      await expectTable(table).toHaveColumnCount(1);
      await expect(table.column({name: 'column:1'}).header).toBeVisible();
      await expect(table.column({name: 'column:2'}).header).not.toBeAttached();
      await expect(table.column({name: 'column:3'}).header).not.toBeAttached();

      // Hide column 1.
      await tablePage.setColumnVisible('column:1', false);
      await expectTable(table).toHaveColumnCount(0);
      await expect(table.column({name: 'column:1'}).header).not.toBeAttached();
      await expect(table.column({name: 'column:2'}).header).not.toBeAttached();
      await expect(table.column({name: 'column:3'}).header).not.toBeAttached();

      // Show column 2.
      await tablePage.setColumnVisible('column:2', true);
      await expectTable(table).toHaveColumnCount(1);
      await expect(table.column({name: 'column:1'}).header).not.toBeAttached();
      await expect(table.column({name: 'column:2'}).header).toBeVisible();
      await expect(table.column({name: 'column:3'}).header).not.toBeAttached();

      // Show column 1.
      await tablePage.setColumnVisible('column:1', true);
      await expectTable(table).toHaveColumnCount(2);
      await expect(table.column({name: 'column:1'}).header).toBeVisible();
      await expect(table.column({name: 'column:2'}).header).toBeVisible();
      await expect(table.column({name: 'column:3'}).header).not.toBeAttached();

      // Show column 3.
      await tablePage.setColumnVisible('column:3', true);
      await expectTable(table).toHaveColumnCount(3);
      await expect(table.column({name: 'column:1'}).header).toBeVisible();
      await expect(table.column({name: 'column:2'}).header).toBeVisible();
      await expect(table.column({name: 'column:3'}).header).toBeVisible();
    });
  });

  test.describe('Filtering', () => {

    test('should filter string column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string'});

      const noFilterCount = await waitUntilStable(() => table.rows.count());

      await table.column({name: 'column:name'}).filter('Product 1');
      await expectTable(table).column({name: 'column:name'}).cells.toContainText('Product 1');

      await table.column({name: 'column:name'}).clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter number column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:price', type: 'number'});
      const noFilterCount = await waitUntilStable(() => table.rows.count());

      // Read the first visible price value and use it as the filter criterion.
      const firstPrice = (await table.row(0).cell(0).textContent())!.trim();
      await table.column({name: 'column:price'}).filter(firstPrice);
      await expectTable(table).column({name: 'column:price'}).cells.toContainText(firstPrice);

      await table.column({name: 'column:price'}).clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter boolean column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:inStock', type: 'boolean'});
      const noFilterCount = await waitUntilStable(() => table.rows.count());

      await table.column({name: 'column:inStock'}).filter('false');
      await expectTable(table).column({name: 'column:inStock'}).cells.toContainText('clear');

      await table.column({name: 'column:inStock'}).filter('');
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should not filter template column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:template', type: 'template'});

      const templateColumn = table.column({name: 'column:template'});
      await expect(templateColumn.header).toBeAttached();
      await expect(templateColumn.filterField).not.toBeAttached();
    });

    test('should filter template column with custom filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setRowCount(10_000);
      await tablePage.addColumn({name: 'column:template', type: 'template', customFilter: true});
      const noFilterCount = await waitUntilStable(() => table.rows.count());

      await table.column({name: 'column:template'}).filter('Product 9999');
      await expect(table.rows).toHaveCount(1);

      await table.column({name: 'column:template'}).clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should not filter component column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:component', type: 'component'});

      const componentColumn = table.column({name: 'column:component'});

      await expect(componentColumn.header).toBeAttached();
      await expect(componentColumn.filterField).not.toBeAttached();
    });

    test('should filter component column with custom filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setRowCount(10_000);
      await tablePage.addColumn({name: 'column:component', type: 'component', customFilter: true});
      const noFilterCount = await waitUntilStable(() => table.rows.count());

      await table.column({name: 'column:component'}).filter('Product 9999');
      await expect(table.rows).toHaveCount(1);

      await table.column({name: 'column:component'}).clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter large amount of data', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setRowCount(1_000_000);
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.column({name: 'column:name'}).filter('999999');
      await expect(table.rows).toHaveCount(1);
    });

    test('should reset scroll position to top when applying filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.scrollTo({y: 1000});
      await expect.poll(() => table.scrollTop()).toBeGreaterThan(0);

      await table.column({name: 'column:name'}).filter('999');
      await expect.poll(() => table.scrollTop()).toBe(0);
    });

    test('should show empty state', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await tablePage.setRowCount(10_000);
      await table.column({name: 'column:name'}).filter('abc');
      await expect(table.rows).toHaveCount(0);
      await expect(table.locator).toContainText('No items found.');
    });

    test('should retain selection on filtering', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.column({name: 'column:name'}).filter('Product 1');
      await expectTable(table).column({name: 'column:name'}).cells.toContainText('Product 1');
      await expectRow(table.row(0)).toBeSelected();
    });
  });

  test.describe('Resizing', () => {

    test('should resize column by moving splitter between column headers', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});
      const splitter = table.column({name: 'column:name'}).splitter;
      const dragHandle = await splitter.startDrag({location: 'table-header'});

      await dragHandle.dragTo({deltaX: 100});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(200);

      await dragHandle.dragTo({deltaX: 50});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(250);

      await dragHandle.dragTo({deltaX: -20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(230);

      await dragHandle.dragTo({deltaX: 50});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(280);

      await dragHandle.release();

      await page.mouse.move(0, 0, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(280);
    });

    test('should resize column by moving splitter between column cells (table with header)', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});
      const splitter = table.column({name: 'column:name'}).splitter;
      const dragHandle = await splitter.startDrag({location: 'table-body'});

      await dragHandle.dragTo({deltaX: 100});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(200);

      await dragHandle.dragTo({deltaX: 50});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(250);

      await dragHandle.dragTo({deltaX: -20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(230);

      await dragHandle.dragTo({deltaX: 50});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(280);

      await dragHandle.release();

      await page.mouse.move(0, 0, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(280);
    });

    test('should resize column by moving splitter between column cells (table without header)', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.showHeader(false);
      await tablePage.setFilterable(false);
      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});
      const splitter = table.column({name: 'column:name'}).splitter;
      const dragHandle = await splitter.startDrag({location: 'table-body'});

      await dragHandle.dragTo({deltaX: 100});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(200);

      await dragHandle.dragTo({deltaX: 50});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(250);

      await dragHandle.dragTo({deltaX: -20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(230);

      await dragHandle.dragTo({deltaX: 50});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(280);

      await dragHandle.release();

      await page.mouse.move(0, 0, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(280);
    });

    test('should resize multiple columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '200px'});
      await tablePage.addColumn({name: 'column:testee', type: 'string', width: '200px'});

      await table.column({name: 'column:name'}).splitter.drag(-50);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(150);
      await expect.poll(() => table.column({name: 'column:testee'}).width()).toBe(200);

      await table.column({name: 'column:testee'}).splitter.drag(50);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(150);
      await expect.poll(() => table.column({name: 'column:testee'}).width()).toBe(250);
    });

    test('should render splitter at correct position', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      // Add resizable column.
      await tablePage.addColumn({name: 'column:1', type: 'string', resizable: true, width: '100px'});
      // Add non-resizable column.
      await tablePage.addColumn({name: 'column:2', type: 'string', resizable: false, width: '100px'});
      // Add resizable column.
      await tablePage.addColumn({name: 'column:3', type: 'string', resizable: true, width: '100px'});
      // Add resizable column.
      await tablePage.addColumn({name: 'column:4', type: 'string', resizable: true, width: '100px'});

      await expect(table.column({name: 'column:1'}).splitter.locator).toBeAttached();
      await expect(table.column({name: 'column:2'}).splitter.locator).not.toBeAttached();
      await expect(table.column({name: 'column:3'}).splitter.locator).toBeAttached();
      await expect(table.column({name: 'column:4'}).splitter.locator).toBeAttached();

      // Verify splitters to be at correct position.
      const tableLeft = await table.bounds().then(bounds => bounds!.x) - 1; // -1 because splitters are positioned at the end of cell content
      expect((await table.column({name: 'column:1'}).splitter.bounds()).left).toEqual(tableLeft + 100);
      expect((await table.column({name: 'column:3'}).splitter.bounds()).left).toEqual(tableLeft + 300);
      expect((await table.column({name: 'column:4'}).splitter.bounds()).left).toEqual(tableLeft + 400);

      // Resize 'column:1'.
      await table.column({name: 'column:1'}).splitter.drag(10);
      expect((await table.column({name: 'column:1'}).splitter.bounds()).left).toEqual(tableLeft + 100 + 10);
      expect((await table.column({name: 'column:3'}).splitter.bounds()).left).toEqual(tableLeft + 300 + 10);
      expect((await table.column({name: 'column:4'}).splitter.bounds()).left).toEqual(tableLeft + 400 + 10);

      // Resize 'column:3'.
      await table.column({name: 'column:3'}).splitter.drag(10);
      expect((await table.column({name: 'column:1'}).splitter.bounds()).left).toEqual(tableLeft + 100 + 10);
      expect((await table.column({name: 'column:3'}).splitter.bounds()).left).toEqual(tableLeft + 300 + 10 + 10);
      expect((await table.column({name: 'column:4'}).splitter.bounds()).left).toEqual(tableLeft + 400 + 10 + 10);

      // Resize 'column:4'.
      await table.column({name: 'column:4'}).splitter.drag(10);
      expect((await table.column({name: 'column:1'}).splitter.bounds()).left).toEqual(tableLeft + 100 + 10);
      expect((await table.column({name: 'column:3'}).splitter.bounds()).left).toEqual(tableLeft + 300 + 10 + 10);
      expect((await table.column({name: 'column:4'}).splitter.bounds()).left).toEqual(tableLeft + 400 + 10 + 10 + 10);
    });

    test('should stop at max width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px', maxWidth: 200});

      await table.column({name: 'column:name'}).splitter.drag(300);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(200);
    });

    test('should ignore reverse dragging when pointer is beyond splitter bounds', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px', maxWidth: 200});

      const dragHandle = await table.column({name: 'column:name'}).splitter.startDrag();

      // Move mouse beyond max width.
      await dragHandle.dragTo({deltaX: 300});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(200);

      // Move mouse back between min and max width.
      await dragHandle.dragTo({deltaX: -250});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(150);

      // Move mouse beyond min width.
      await dragHandle.dragTo({deltaX: -150});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(100);

      // Move mouse back between min and max width.
      await dragHandle.dragTo({deltaX: 125});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(125);

      await dragHandle.release();
    });

    test('should decrease column width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '200px'});

      await table.column({name: 'column:name'}).splitter.drag(-100);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(100);
    });

    test('should stop at min width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '200px', minWidth: 100});

      await table.column({name: 'column:name'}).splitter.drag(-300);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(100);
    });

    test('should allow to overflow while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '200px'});

      await table.column({name: 'column:name'}).splitter.drag(page.viewportSize()?.width ?? 0);
      await expectTable(table).toHaveHorizontalOverflow();
    });

    test('should auto resize', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '200px'});
      await tablePage.addColumn({name: 'column:price', type: 'string'});

      await table.column({name: 'column:name'}).splitter.dblclick();
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBeLessThan(200);
    });

    test('should auto resize to max-width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '50px', minWidth: 0, maxWidth: 75});
      await tablePage.addColumn({name: 'column:price', type: 'string'});

      await table.column({name: 'column:name'}).splitter.dblclick();
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(75);

      // Should still be able to resize after auto resize.
      await table.column({name: 'column:name'}).splitter.drag(-25);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(50);
    });

    test('should auto resize to min-width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '600px', minWidth: 400});
      await tablePage.addColumn({name: 'column:price', type: 'string'});

      await table.column({name: 'column:name'}).splitter.dblclick();
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(400);

      // Should still be able to resize after auto resize.
      await table.column({name: 'column:name'}).splitter.drag(25);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(425);
    });

    test('should save sizes between reloads', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate({tableStorage: true});
      await tablePage.setWidth(600);

      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.column({name: 'column:name'}).splitter.drag(-100);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(500);

      await tablePage.reload({tableStorage: true});

      await tablePage.addColumn({name: 'column:name', type: 'string'});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(500);
    });

    test('should push out flexible columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setWidth(600);

      await tablePage.addColumn({name: 'column:1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', type: 'string'});
      await tablePage.addColumn({name: 'column:3', type: 'string', minWidth: 100});

      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(200);

      // Grow column two. Columns to the left should stay the same, to the right should shrink to min width and push out.
      await table.column({name: 'column:2'}).splitter.drag(600);
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(800);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(100);
      await expectTable(table).not.toHaveHorizontalScroll();
      await expectTable(table).toHaveHorizontalOverflow();

      // Scroll right to grab the splitter.
      await table.scrollTo({x: 'end'});
      await expectTable(table).toHaveHorizontalScroll();

      // Shrink column two. Columns to the left and right should stay the same.
      const dragHandle = await table.column({name: 'column:2'}).splitter.startDrag();
      await dragHandle.dragTo({deltaX: -100}, {steps: 1});
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(700);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(100);
      await expectTable(table).toHaveHorizontalScroll();
      await expectTable(table).toHaveHorizontalOverflow();

      // Shrink column two. Columns to the left and right should stay the same.
      await dragHandle.dragTo({deltaX: 0}, {steps: 1});
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(600);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(100);
      await expectTable(table).toHaveHorizontalScroll();
      await expectTable(table).toHaveHorizontalOverflow();

      // Shrink column two. Columns to the left and right should stay the same.
      await dragHandle.dragTo({deltaX: 0}, {steps: 1});
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(500);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(100);
      await expectTable(table).toHaveHorizontalScroll();
      await expectTable(table).toHaveHorizontalOverflow();

      // Shrink column two. Columns to the left and right should stay the same.
      await dragHandle.dragTo({deltaX: 0}, {steps: 1});
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(400);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(100);
      await expectTable(table).toHaveHorizontalScroll();
      await expectTable(table).toHaveHorizontalOverflow();

      // Shrink column two. Columns to the left and right should stay the same.
      await dragHandle.dragTo({deltaX: 0}, {steps: 1});
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(300);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(100);
      await expectTable(table).not.toHaveHorizontalScroll();
      await expectTable(table).not.toHaveHorizontalOverflow();

      // Shrink column two. Columns to the left should stay the same, to the right should grow.
      await dragHandle.dragTo({deltaX: 0}, {steps: 1});
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(200);
      await expectTable(table).not.toHaveHorizontalScroll();
      await expectTable(table).not.toHaveHorizontalOverflow();

      // Shrink column two. Columns to the left should stay the same, to the right should grow.
      await dragHandle.dragTo({deltaX: -50}, {steps: 20});
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(150);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(250);
      await expectTable(table).not.toHaveHorizontalScroll();
      await expectTable(table).not.toHaveHorizontalOverflow();

      await dragHandle.release();
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(150);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(250);
      await expectTable(table).not.toHaveHorizontalScroll();
      await expectTable(table).not.toHaveHorizontalOverflow();
    });

    test('should never grow columns beyond max-size', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setWidth(600);

      await tablePage.addColumn({name: 'column:1', type: 'string', minWidth: 100});
      await tablePage.addColumn({name: 'column:2', type: 'string', maxWidth: 200});
      await tablePage.addColumn({name: 'column:3', type: 'string', minWidth: 100});

      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(200);

      // Shrink column one.
      await table.column({name: 'column:1'}).splitter.drag(-100);

      // Expect only column three to grow, since column two has a max width of 200.
      await expect.poll(() => table.column({name: 'column:1'}).width()).toEqual(100);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toEqual(200);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toEqual(300);
    });

    test('should shrink table when all flexible columns shrink', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setWidth(600);

      await tablePage.addColumn({name: 'column:1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', type: 'string'});
      await tablePage.addColumn({name: 'column:3', type: 'string'});

      await table.column({name: 'column:1'}).splitter.drag(-100);
      await table.column({name: 'column:2'}).splitter.drag(-100);
      await table.column({name: 'column:3'}).splitter.drag(-100);

      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(100);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(150);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(250);

      await expect.poll(() => table.body.boundingBox().then(bounds => bounds?.width)).toBeLessThan(600);
    });

    test('should lock flexible columns on overflow', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setWidth(800);

      await tablePage.addColumn({name: 'column:1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', type: 'string'});
      await tablePage.addColumn({name: 'column:3', type: 'string'});
      await tablePage.addColumn({name: 'column:4', type: 'string'});

      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);

      await table.column({name: 'column:3'}).splitter.drag(600);
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(800);
      await expect.poll(() => table.column({name: 'column:4'}).width()).toBe(100);

      await table.column({name: 'column:1'}).splitter.drag(100);
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(300);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(800);
      await expect.poll(() => table.column({name: 'column:4'}).width()).toBe(100);
    });

    test('should hide row hover while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setCssVariable('--sci-table-row-background-color-hover', 'rgb(0, 0, 255)');

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});

      const rowBounds = await table.row(3).bounds();

      const dragHandle = await table.column({name: 'column:name'}).splitter.startDrag();
      await dragHandle.dragTo({x: rowBounds.hcenter, y: rowBounds.vcenter})
      await expect(table.row(3).locator).not.toHaveCSS('background-color', 'rgb(0, 0, 255)');

      await dragHandle.release();
      await expect(table.row(3).locator).toHaveCSS('background-color', 'rgb(0, 0, 255)');
    });
  });

  test.describe('Splitters', () => {

    test('should display splitter on hover', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', type: 'string'});

      const scrollbarBounds = await table.verticalScrollbar.bounds();

      // Move mouse beside slitter splitter of column 1.
      const columnSplitterBounds = await table.column({name: 'column:1'}).splitter.bounds();
      await page.mouse.move(columnSplitterBounds.hcenter + 10, scrollbarBounds.vcenter);

      // Expect splitter not to be visible.
      await expect(table.column({name: 'column:1'}).splitter.locator).toHaveCSS('opacity', '0');

      // Move mouse over splitter of column 1.
      await page.mouse.move(columnSplitterBounds.hcenter, scrollbarBounds.vcenter);

      // Expect splitter to be visible.
      await expect(table.column({name: 'column:1'}).splitter.locator).toHaveCSS('opacity', '1');
    });

    /**
     * Verifies that splitters are still not displayed also if the scroll operation temporarily stops.
     */
    test('should not display splitter during scroll if not active scrolling', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', type: 'string'});

      const scrollbarBounds = await table.verticalScrollbar.bounds();

      // Click scrollbar thumb.
      await table.verticalScrollbar.thumb.locator.hover();
      await page.mouse.down();

      // Move mouse over splitter of column 1.
      const columnSplitterBounds = await table.column({name: 'column:1'}).splitter.bounds();
      await page.mouse.move(columnSplitterBounds.hcenter, scrollbarBounds.vcenter);

      // Wait some time to simulate no active scrolling, but still not completed scrolling.
      await page.waitForTimeout(1000);

      // Expect splitter not to be visible.
      await expect(table.column({name: 'column:1'}).splitter.locator).not.toBeVisible();

      // Move mouse over splitter of column 2.
      const columnSplitterBounds2 = await table.column({name: 'column:2'}).splitter.bounds();
      await page.mouse.move(columnSplitterBounds2.hcenter, scrollbarBounds.vcenter);

      // Expect splitter not to be visible.
      await expect(table.column({name: 'column:2'}).splitter.locator).not.toBeVisible();
    });

    test('should not display splitter when scrolling via scrollbar', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', type: 'string'});

      const scrollbarBounds = await table.verticalScrollbar.bounds();

      // Click scrollbar thumb.
      await table.verticalScrollbar.thumb.locator.hover();
      await page.mouse.down();

      // Move mouse over splitter of column 1.
      const columnSplitterBounds = await table.column({name: 'column:1'}).splitter.bounds();
      await page.mouse.move(columnSplitterBounds.hcenter, scrollbarBounds.vcenter);

      // Expect splitter not to be visible.
      await expect(table.column({name: 'column:1'}).splitter.locator).not.toBeVisible();

      // Scroll viewport to the end.
      void page.mouse.move(columnSplitterBounds.hcenter, scrollbarBounds.bottom); // do not await scrolling

      // Expect splitter not to be visible.
      await expect(table.column({name: 'column:1'}).splitter.locator).not.toBeVisible();

      // Expect viewport to be scrolled.
      await expect.poll(() => table.scrollTop()).toBeGreaterThan(0);

      // Expect splitter not to be visible.
      await expect(table.column({name: 'column:1'}).splitter.locator).not.toBeVisible();
    });
  });

  test.describe('Sorting', () => {

    test('should sort string column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:string', type: 'string'});

      // Sort ascending.
      await table.column({name: 'column:string'}).sort();
      await expectTable(table).column({name: 'column:string'}).toBeSorted('asc');

      // Sort descending.
      await table.column({name: 'column:string'}).sort();
      await expectTable(table).column({name: 'column:string'}).toBeSorted('desc');
    });

    test('should sort number column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:number', type: 'number'});

      // Sort ascending.
      await table.column({name: 'column:number'}).sort();
      await expectTable(table).column({name: 'column:number'}).toBeSorted('asc');

      // Sort descending.
      await table.column({name: 'column:number'}).sort();
      await expectTable(table).column({name: 'column:number'}).toBeSorted('desc');
    });

    test('should sort boolean column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:boolean', type: 'boolean'});

      // Sort ascending: false values first.
      await table.column({name: 'column:boolean'}).sort();
      await expectTable(table).column({name: 'column:boolean'}).toBeSorted('asc');

      // Sort descending: true values first.
      await table.column({name: 'column:boolean'}).sort();
      await expectTable(table).column({name: 'column:boolean'}).toBeSorted('desc');
    });

    test('should sort multiple columns with ctrl or meta', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', type: 'number'});

      await table.column({name: 'column:1'}).sort()
      await table.column({name: 'column:2'}).sort({modifiers: ['ControlOrMeta']})

      await expect.poll(() => table.column({name: 'column:1'}).sortDirection()).toEqual('asc')
      await expect.poll(() => table.column({name: 'column:2'}).sortDirection()).toEqual('asc')
    });

    test('should retain filter after sorting', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string'});
      await table.column({name: 'column:name'}).filter('Product 1');
      await expectTable(table).column({name: 'column:name'}).cells.toContainText('Product 1');

      await table.column({name: 'column:name'}).sort();

      await expectTable(table).column({name: 'column:name'}).cells.toContainText('Product 1');
      await expectTable(table).column({name: 'column:name'}).toBeSorted();
    });

    test('should sort large amount of data', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setRowCount(1_000_000);
      await tablePage.addColumn({name: 'column:price', type: 'number'});

      await table.column({name: 'column:price'}).sort();
      await expect(table.column({name: 'column:price'}).cells.first()).toHaveText('1');
      await table.column({name: 'column:price'}).sort();
      await expect(table.column({name: 'column:price'}).cells.first()).toHaveText('1000');
    });

    test('should reset scroll position to top when applying sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string'});

      // Scroll down so the viewport is no longer at the top.
      await table.scrollTo({y: 1000});
      await expect.poll(() => table.scrollTop()).toBeGreaterThan(0);

      // Applying a sort should reset the viewport scroll position to the top.
      await table.column({name: 'column:name'}).sort();
      await expect.poll(() => table.scrollTop()).toBe(0);
    });

    test('should retain selection after sorting', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.column({name: 'column:name'}).sort();
      await expectTable(table).column({name: 'column:name'}).toBeSorted();
      await expectRow(table.row(0)).toBeSelected();
    });
  });

  test.describe('Selection', () => {

    test('should disable selection', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});
      await tablePage.setSelectable(false);

      await table.row(0).click();
      await expectRow(table.row(0)).toBeActive();
      await expectRow(table.row(0)).not.toBeSelected();

      await page.keyboard.press('ArrowDown');
      await expectRow(table.row(1)).toBeActive();
      await expectRow(table.row(1)).not.toBeSelected();
      await expect(tablePage.selectionCount).toHaveText('0');
    });

    test('should only select a single row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});
      await tablePage.setSelectable('single');

      await table.row(0).click();
      await table.row(1).click(['ControlOrMeta']);
      await expectRow(table.row(0)).not.toBeSelected();
      await expectRow(table.row(1)).toBeSelected();

      await table.row(3).click(['Shift']);
      await expectRow(table.row(1)).not.toBeSelected();
      await expectRow(table.row(2)).not.toBeSelected();
      await expectRow(table.row(3)).toBeSelected();
      await expect(tablePage.selectionCount).toHaveText('1');
    });

    test('should receive focus via tab navigation', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.sortButtons.first().focus();
      await page.keyboard.press('Tab'); // Filter
      await page.keyboard.press('Tab'); // Table keyboard navigator
      await page.keyboard.press('ArrowDown');

      await expectRow(table.row(0)).toBeActive();
    });

    test('should scroll the active row into view during keyboard navigation', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.body.focus();
      const visibleRowCount = await waitUntilStable(() => table.rows.count());
      for (let i = 0; i < visibleRowCount; i++) {
        await page.keyboard.press('ArrowDown');
      }

      // Subtract the buffer-1=9 from the visible row count to get the active row.
      const activeRowIndex = visibleRowCount - 9;

      await expectTable(table).toHaveVerticalScroll();
      await expectRow(table.row(activeRowIndex)).toBeActive();
      await expect(table.row(activeRowIndex).locator).toBeInViewport({ratio: 1});
    });

    test('should keep the active row within keyboard navigation boundaries', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setRowCount(3);
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.body.focus();
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowDown');
      await expectRow(table.row(0)).toBeActive();

      await page.keyboard.press('ArrowUp');
      await expectRow(table.row(0)).toBeActive();

      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ArrowDown');
      await expectRow(table.row(2)).toBeActive();

      await page.keyboard.press('ArrowDown');
      await expectRow(table.row(2)).toBeActive();
    });

    test('should select all rows with ctrl+a from the keyboard navigator', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.body.focus();
      await page.keyboard.press('ControlOrMeta+A');

      await expect(tablePage.selectionCount).toHaveText('10000');
      await expect(table.body).toBeFocused();
    });

    test('should toggle the row with ctrl+space', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.body.focus();
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('ControlOrMeta+ArrowDown');
      await expectRow(table.row(1)).toBeActive();
      await expectRow(table.row(1)).not.toBeSelected();

      await page.keyboard.press('ControlOrMeta+Space');

      await expectRow(table.row(0)).toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
      await expect(table.body).toBeFocused();
    });

    test('should toggle row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.row(1).click();
      await expectRow(table.row(0)).not.toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
    });

    test('should select multiple rows with ctrl', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

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
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

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
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.scrollTo({y: 1000});
      await expectRow(table.row(0)).not.toBeSelected();

      await table.scrollTo({y: 0});
      await expectRow(table.row(0)).toBeSelected();
    });

    test('should keep selection on filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.column({name: 'column:name'}).filter('9999');
      await expectRow(table.row(0)).not.toBeSelected();

      await table.column({name: 'column:name'}).clearFilter();
      await expectRow(table.row(0)).toBeSelected();
    });

    test('should keep selection on sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.column({name: 'column:name'}).sort();

      // Click twice to sort descending.
      await table.column({name: 'column:name'}).sort();
      await expectRow(table.row(0)).not.toBeSelected();

      await table.column({name: 'column:name'}).sort();
      await expectRow(table.row(0)).toBeSelected();
    });

    test('should activate element with keyboard', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

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
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

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
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

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

  test.describe('Styling', () => {

    test('should conditionally style row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await expect(table.row(0).cell(0).locator).not.toHaveAttribute('part', 'column:name row:negative');
      await expect(table.row(1).cell(0).locator).not.toHaveAttribute('part', 'column:name row:negative');
      await expect(table.row(2).cell(0).locator).not.toHaveAttribute('part', 'column:name row:negative');

      await tablePage.setCustomRowStyling(true);

      await expect(table.row(0).cell(0).locator).not.toHaveAttribute('part', 'column:name row:negative');
      await expect(table.row(1).cell(0).locator).not.toHaveAttribute('part', 'column:name row:negative');
      await expect(table.row(2).cell(0).locator).toHaveAttribute('part', 'column:name row:negative');
      await expect(table.row(2).cell(0).locator).toHaveCSS('background-color', 'rgba(255, 0, 0, 0.2)');
    });

    test('should not conditionally style selected row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await tablePage.setCustomRowStyling(true);

      await expect(table.row(2).cell(0).locator).toHaveAttribute('part', 'column:name row:negative');

      await table.row(2).click();

      await expect(table.row(2).cell(0).locator).not.toHaveAttribute('part');
    });

    test('should conditionally style column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:negative', type: 'string'});

      await expect(table.row(0).cell(0).locator).toHaveAttribute('part', 'column:negative');
      await expect(table.row(0).cell(0).locator).toHaveCSS('background-color', 'rgba(255, 0, 0, 0.2)');
    });

    test('should show/hide gridlines', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      // Configure gridline color.
      await tablePage.setCssVariable('--sci-table-gridline-color', 'rgb(0, 0, 255)');

      // Show gridlines.
      await tablePage.showGridlines(true);
      await expect(table.row(0).locator).toHaveCSS('border-bottom-color', 'rgb(0, 0, 255)');

      // Hide gridlines.
      await tablePage.showGridlines(false);
      await expect(table.row(0).locator).toHaveCSS('border-bottom-color', 'rgba(0, 0, 0, 0)');
    });
  });

  test.describe('Row Actions', () => {

    test('should show row actions on hover', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setRowActions(true);
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await table.row(3).hover();
      await expect(table.row(3).rowActions).toBeVisible();
    });

    test('should stick row actions to the right', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setWidth(500);
      await tablePage.setRowActions(true);

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});
      await table.column({name: 'column:name'}).splitter.drag(500);

      const rowBounds = await table.row(3).bounds();
      const tableBounds = await table.bounds();
      const cellPadding = await table.row(3).cell(0).paddingInline();

      // Expect horizontal overflow.
      await expect(table.horizontalScrollbar.locator).toBeVisible();

      // Hover row.
      await table.row(3).hover();

      // Scroll to end.
      await table.scrollTo({x: 'end'});
      await expect(table.row(3).rowActions).toBeInViewport({ratio: 1});
      expect(fromRect(await table.row(3).rowActions.boundingBox()).right).toBe(tableBounds.right - cellPadding);
      expect(fromRect(await table.row(3).rowActions.boundingBox()).vcenter).toBe(rowBounds.vcenter);

      // Scroll to start.
      await table.scrollTo({x: 'start'});
      await expect(table.row(3).rowActions).toBeInViewport({ratio: 1});
      expect(fromRect(await table.row(3).rowActions.boundingBox()).right).toBe(tableBounds.right - cellPadding);
      expect(fromRect(await table.row(3).rowActions.boundingBox()).vcenter).toBe(rowBounds.vcenter);
    });

    test('should hide row actions while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      const rowBounds = await table.row(3).bounds();

      const dragHandle = await table.column({name: 'column:name'}).splitter.startDrag();
      await dragHandle.dragTo({x: rowBounds.hcenter, y: rowBounds.vcenter})
      await expect(table.row(3).rowActions).not.toBeAttached();

      await dragHandle.release();
      await expect(table.row(3).rowActions).toBeVisible();
    });

    test('should hide row actions while scrolling', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      await table.row(10).hover();
      await expect(table.row(10).rowActions).toBeVisible();

      await page.mouse.wheel(0, 250);
      await expect.poll(() => table.scrollTop()).toBe(250);
      await expect(table.row(10).rowActions).toBeHidden();

      await table.row(10).hover();
      await expect(table.row(10).rowActions).toBeVisible();
    });

    test('should keep row actions visible when moving pointer over splitter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:testee', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      const rowBounds = await table.row(10).bounds();

      await page.mouse.move(rowBounds.left, rowBounds.vcenter);
      await expect(table.row(10).rowActions).toBeVisible();

      const rowActionBounds = fromRect(await table.row(10).rowActions.boundingBox());
      await page.mouse.move(rowActionBounds.hcenter, rowActionBounds.vcenter);
      await expect(table.row(10).rowActions).toBeVisible();

      const splitterBounds = await table.column({name: 'column:name'}).splitter.bounds();
      await page.mouse.move(splitterBounds.hcenter, rowBounds.vcenter);
      await expect(table.row(10).rowActions).toBeVisible();

      // Move out of splitter bounds on top.
      await page.mouse.move(splitterBounds.hcenter, splitterBounds.top - 10);
      await expect(table.row(10).rowActions).not.toBeVisible();
    });

    test('should hide row actions when leaving splitter or toolbar for header', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:testee', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      const row = table.row(10);
      await row.hover();
      await expect(row.rowActions).toBeVisible();

      const splitterBounds = await table.column({name: 'column:name'}).splitter.bounds();
      await page.mouse.move(splitterBounds.hcenter, await row.bounds().then(bounds => bounds.vcenter));
      await expect(row.rowActions).toBeVisible();

      await table.headers.first().hover();
      await expect(row.rowActions).toBeHidden();

      await table.row(10).hover();
      await expect(row.rowActions).toBeVisible();

      await row.rowActions.hover();
      await expect(row.rowActions).toBeVisible();

      await table.headers.first().hover();
      await expect(row.rowActions).toBeHidden();
    });

    test('should keep menu open when hovering other row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      const row = table.row(10);
      await row.hover();
      await row.rowActions.locator('button.e2e-menu-item').click();
      await expect(row.locator.locator('sci-menu')).toBeVisible();

      await table.row(1).hover();
      await expect(table.row(1).rowActions).toBeVisible();
      await expect(row.locator.locator('sci-menu')).toBeVisible();

      await table.row(2).hover();
      await expect(table.row(1).rowActions).not.toBeVisible();
      await expect(table.row(2).rowActions).toBeVisible();
      await expect(row.locator.locator('sci-menu')).toBeVisible();

      await table.row(2).click();
      await expect(row.locator.locator('sci-menu')).not.toBeVisible();
    });
  });

  test.describe('Scrollbar', () => {

    /**
     * Verifies that splitters do not cover scrollbars.
     */
    test('should overlap column splitters', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:2', type: 'string', width: '100000px'});

      const column = table.column({name: 'column:1'});
      const columnSplitter = table.column({name: 'column:1'}).splitter;
      const columnSplitterBounds = await columnSplitter.bounds();
      const columnWidth = await column.width();

      // Expect horizontal overflow.
      await expect(table.horizontalScrollbar.locator).toBeVisible();

      // Expect column splitter not to be visible.
      await expect(columnSplitter.locator).toHaveCSS('opacity', '0');

      // Move mouse over column splitter.
      const tableBounds = await table.bounds();
      await page.mouse.move(columnSplitterBounds.hcenter, tableBounds.vcenter);

      // Expect column splitter to be visible.
      await expect(columnSplitter.locator).toHaveCSS('opacity', '1');

      // Capture scrollbar thumb height in non-hovered state.
      const thumbHeight = await table.horizontalScrollbar.thumb.height();

      // Move mouse down along the column splitter over the horizontal scrollbar.
      const scrollbarBounds = await table.horizontalScrollbar.bounds();
      await page.mouse.move(columnSplitterBounds.hcenter, scrollbarBounds.vcenter);

      // Expect scrollbar to overlap the column splitter.
      await expect(columnSplitter.locator).toHaveCSS('opacity', '0');
      await expect.poll(() => table.horizontalScrollbar.thumb.height()).toBeGreaterThan(thumbHeight);

      // Move mouse to the start of the scrollbar.
      await page.mouse.move(scrollbarBounds.x, scrollbarBounds.vcenter);

      // Move mouse to the right along scrollbar over the column splitter.
      await page.mouse.move(columnSplitterBounds.hcenter, scrollbarBounds.vcenter);

      // Expect scrollbar to overlap the column splitter.
      await expect(columnSplitter.locator).toHaveCSS('opacity', '0');
      await expect.poll(() => table.horizontalScrollbar.thumb.height()).toBeGreaterThan(thumbHeight);

      // Scroll the viewport.
      await page.mouse.down();
      await page.mouse.move(columnSplitterBounds.hcenter + 10, scrollbarBounds.vcenter);

      // Expect viewport to be scrolled
      await expect.poll(() => table.scrollLeft()).toBeGreaterThan(0);

      // Expect column not to be resized.
      await expect.poll(() => column.width()).toEqual(columnWidth);
    });

    test('should not hover scrollbar during resize', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:2', type: 'string', width: '100000px'});

      const column = table.column({name: 'column:1'});
      const columnSplitter = table.column({name: 'column:1'}).splitter;
      const columnSplitterBounds = await columnSplitter.bounds();
      const columnWidth = await column.width();

      // Expect horizontal overflow.
      await expect(table.horizontalScrollbar.locator).toBeVisible();

      // Move mouse over column splitter.
      const tableBounds = await table.bounds();
      await page.mouse.move(columnSplitterBounds.hcenter, tableBounds.vcenter);

      // Expect column splitter to be visible.
      await expect(columnSplitter.locator).toHaveCSS('opacity', '1');

      // Capture scrollbar thumb height in non-hovered state.
      const thumbHeight = await table.horizontalScrollbar.thumb.height();

      // Start resizing by clicking on the splitter.
      await page.mouse.down();

      // Move mouse down along the column splitter over the horizontal scrollbar.
      const scrollbarBounds = await table.horizontalScrollbar.bounds();
      await page.mouse.move(columnSplitterBounds.hcenter, scrollbarBounds.vcenter);

      // Expect splitter to be visible and scrollbar not hovered.
      await expect(columnSplitter.locator).toHaveCSS('opacity', '1');
      await expect.poll(() => table.horizontalScrollbar.thumb.height()).toEqual(thumbHeight);

      // Move mouse 10px to the right along the scrollbar.
      await page.mouse.move(columnSplitterBounds.hcenter + 10, scrollbarBounds.vcenter);

      // Expect column not to be resized.
      await expect.poll(() => column.width()).toBeGreaterThan(columnWidth);

      // Expect viewport not to be scrolled
      await expect.poll(() => table.scrollLeft()).toEqual(0);
    });

    /**
     * Verifies the table not to have a horizontal overflow if enough horizontal space.
     */
    test('should not have horizontal overflow', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setRowCount(1);
      await tablePage.addColumn({name: 'column:name', type: 'string'});

      // Hover the table.
      await table.locator.hover();
      await waitUntilAngularStable(page);

      // Expect no horizontal overflow.
      await expect(table.horizontalScrollbar.locator).not.toBeVisible();

      // Expect no vertical overflow.
      await expect(table.horizontalScrollbar.locator).not.toBeVisible();

      // Force vertical overflow.
      await tablePage.setRowCount(10_000);

      // Hover the table.
      await table.locator.hover();
      await waitUntilAngularStable(page);

      // Expect no horizontal overflow.
      await expect(table.horizontalScrollbar.locator).not.toBeVisible();

      // Expect vertical overflow.
      await expect(table.verticalScrollbar.locator).toBeVisible();
    });
  });

  test.describe('Scrolling', () => {

    test('should scroll viewport when wheeling on toolbar', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setWidth(600);
      await tablePage.setHeight(500);
      await tablePage.setRowCount(10_000);

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:testee', type: 'string', width: '1200px'});
      await tablePage.setRowActions(true);

      await expectTable(table).toHaveVerticalOverflow();
      await expectTable(table).toHaveHorizontalOverflow();

      await table.row(10).hover();
      await expect(table.row(10).rowActions).toBeVisible();

      const actionBounds = await table.row(10).rowActionsBounds();
      await table.row(10).rowActions.hover();
      await page.mouse.move(actionBounds.hcenter, actionBounds.vcenter);
      await page.mouse.wheel(0, 250);
      await expect.poll(() => table.scrollTop()).toBe(250);
      await expect.poll(() => table.scrollLeft()).toBe(0);
    });

    test('should scroll viewport when wheeling on splitter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setWidth(600);
      await tablePage.setHeight(500);
      await tablePage.setRowCount(10_000);

      await tablePage.addColumn({name: 'column:1', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:2', type: 'string', width: '1200px'});

      const splitterBounds = await table.column({name: 'column:1'}).splitter.bounds();
      const viewportBounds = await table.bounds();

      await expectTable(table).toHaveVerticalOverflow();
      await expectTable(table).toHaveHorizontalOverflow();

      await page.mouse.move(splitterBounds.hcenter, viewportBounds.vcenter);
      await expect(table.column({name: 'column:1'}).splitter.locator).toBeVisible();

      await page.mouse.wheel(0, 250);

      await expect.poll(() => table.scrollTop()).toBe(250);
      await expect(table.column({name: 'column:1'}).splitter.locator).toBeVisible();
      await expect.poll(() => table.scrollLeft()).toBe(0);
    });

    test('should scroll viewport vertically when wheeling on table body', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setWidth(600);
      await tablePage.setHeight(500);
      await tablePage.setRowCount(10_000);

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '1200px'});
      const tableBounds = await table.bounds();

      await expectTable(table).toHaveVerticalOverflow();
      await expectTable(table).toHaveHorizontalOverflow();

      await page.mouse.move(tableBounds.hcenter, tableBounds.vcenter);
      await page.mouse.wheel(0, 250);
      await expect.poll(() => table.scrollTop()).toBe(250);
      await expect.poll(() => table.scrollLeft()).toBe(0);
    });

    test('should scroll viewport horizontally when wheeling on table body with the shift-key pressed', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setWidth(600);
      await tablePage.setHeight(500);
      await tablePage.setRowCount(10_000);

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '1200px'});
      const tableBounds = await table.bounds();

      await expectTable(table).toHaveVerticalOverflow();
      await expectTable(table).toHaveHorizontalOverflow();

      await page.mouse.move(tableBounds.hcenter, tableBounds.vcenter);
      await page.keyboard.down('Shift');
      await page.mouse.wheel(0, 250);
      await page.keyboard.up('Shift');
      await expect.poll(() => table.scrollTop()).toBe(0);
      await expect.poll(() => table.scrollLeft()).toBe(250);
    });

    test('should not scroll viewport vertically when wheeling on table header', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setWidth(600);
      await tablePage.setHeight(500);
      await tablePage.setRowCount(10_000);
      await tablePage.showHeader(true);

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '1200px'});
      const tableBounds = await table.bounds();
      const tableHeaderBounds = fromRect(await table.header.boundingBox());

      await expectTable(table).toHaveVerticalOverflow();
      await expectTable(table).toHaveHorizontalOverflow();

      await page.mouse.move(tableBounds.hcenter, tableHeaderBounds.vcenter);
      await page.mouse.wheel(0, 250);

      // Wait some time until wheeling ends.
      await page.waitForTimeout(1000);

      await expect.poll(() => table.scrollTop()).toBe(0);
      await expect.poll(() => table.scrollLeft()).toBe(0);
    });

    test('should scroll viewport horizontally when wheeling on table header with the shift-key pressed', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setWidth(600);
      await tablePage.setHeight(500);
      await tablePage.setRowCount(10_000);
      await tablePage.showHeader(true);

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '1200px'});
      const tableBounds = await table.bounds();
      const tableHeaderBounds = fromRect(await table.header.boundingBox());

      await expectTable(table).toHaveVerticalOverflow();
      await expectTable(table).toHaveHorizontalOverflow();

      await page.mouse.move(tableBounds.hcenter, tableHeaderBounds.vcenter);
      await page.keyboard.down('Shift');
      await page.mouse.wheel(0, 250);
      await page.keyboard.up('Shift');

      // Wait some time until wheeling ends.
      await page.waitForTimeout(1000);

      await expect.poll(() => table.scrollTop()).toBe(0);
      await expect.poll(() => table.scrollLeft()).toBe(250);
    });
  });

  test.describe('Layout', () => {

    test('should allow subsequent elements to cover the table', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '100px'});

      // Verify that the table maintains a default stacking level, allowing subsequent DOM elements to cover it without an explicit z-index.
      expect(await hasDefaultStackingLevel(table.locator), 'Table has an elevated stacking level').toBe(true);
    });

    test('should fill full width if no column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setRowCount(1);
      await tablePage.setWidth(500);

      await expect.poll(() => table.body.boundingBox().then(bounds => bounds!.width)).toEqual(500);
      await expect.poll(() => table.grid.boundingBox().then(bounds => bounds!.width)).toEqual(500);
      await expect.poll(() => table.viewport.boundingBox().then(bounds => bounds!.width)).toEqual(500);
      await expect.poll(() => table.bounds().then(bounds => bounds!.width)).toEqual(500);
      await expect.poll(() => table.rows.first().boundingBox().then(bounds => bounds!.width)).toEqual(500);

      // Change width.
      await tablePage.setWidth(800);

      await expect.poll(() => table.body.boundingBox().then(bounds => bounds!.width)).toEqual(800);
      await expect.poll(() => table.grid.boundingBox().then(bounds => bounds!.width)).toEqual(800);
      await expect.poll(() => table.viewport.boundingBox().then(bounds => bounds!.width)).toEqual(800);
      await expect.poll(() => table.bounds().then(bounds => bounds!.width)).toEqual(800);
      await expect.poll(() => table.rows.first().boundingBox().then(bounds => bounds!.width)).toEqual(800);
    });

    test('should fill full width if one or more columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.setRowCount(1);
      await tablePage.setWidth(500);

      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await expect.poll(() => table.body.boundingBox().then(bounds => bounds!.width)).toEqual(500);
      await expect.poll(() => table.grid.boundingBox().then(bounds => bounds!.width)).toEqual(500);
      await expect.poll(() => table.viewport.boundingBox().then(bounds => bounds!.width)).toEqual(500);
      await expect.poll(() => table.bounds().then(bounds => bounds!.width)).toEqual(500);
      await expect.poll(() => table.rows.first().boundingBox().then(bounds => bounds!.width)).toEqual(500);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toEqual(500);

      // Change width.
      await tablePage.setWidth(800);

      await expect.poll(() => table.body.boundingBox().then(bounds => bounds!.width)).toEqual(800);
      await expect.poll(() => table.grid.boundingBox().then(bounds => bounds!.width)).toEqual(800);
      await expect.poll(() => table.viewport.boundingBox().then(bounds => bounds!.width)).toEqual(800);
      await expect.poll(() => table.bounds().then(bounds => bounds!.width)).toEqual(800);
      await expect.poll(() => table.rows.first().boundingBox().then(bounds => bounds!.width)).toEqual(800);
    });

    test('should shrink viewport-client instantly if scrolled to the end and row count drops (e.g., when clearing all rows)', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', type: 'string'});

      await tablePage.setRowCount(100_000);
      await tablePage.setRowHeight(20);
      await tablePage.setHeight(500);
      await waitUntilStable(() => table.rows.count());

      // Scroll to the end.
      await table.scrollTo({y: 'end'});

      // Wait until scrolled to the end.
      const scrollHeight = await table.scrollHeight();
      await expect.poll(() => table.scrollTop()).toBe(scrollHeight - 500);

      // Change row count to 5.
      await tablePage.setRowCount(5);

      // Expect viewport client to shrink instantly.
      await expect.poll(() => table.body.boundingBox().then(bounds => bounds!.height), {timeout: 250}).toBe(5 * 20);
      await expect.poll(() => table.scrollTop(), {timeout: 250}).toBe(0);
      await expect(table.rows).toHaveCount(5, {timeout: 250});
    });

    test('should have stable column width if scrolling table with variable column content length', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', type: 'string'});

      await tablePage.setWidth(200);
      await tablePage.setHeight(200);

      // Generate 100 products with short names, plus one with a long name at the end.
      await provideHttpDatasource(page, generateData(100, i => ({
        name: i < 99 ? 'Product' : 'This is a longer product name which should be truncated with ellipsis.',
      })));

      // Expect each column to be 100px wide
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(100);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(100);

      // Scroll to the end.
      await table.scrollTo({y: 'end'});

      // Wait until scrolled to the end.
      const scrollHeight = await table.scrollHeight();
      await expect.poll(() => table.scrollTop()).toBe(scrollHeight - 200);

      // Expect column widths not to have changed after scrolling.
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(100);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(100);
    });

    test('should not overflow horizontally if flex columns with large content', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setWidth(400);

      await tablePage.addColumn({name: 'column:1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', type: 'string'});

      await provideHttpDatasource(page, [
        {name: 'This is a long product name which should be truncated with ellipsis.'},
      ]);

      // Expect no horizontal overflow and column to fill available space.
      await expectTable(table).not.toHaveHorizontalOverflow();
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);

      // Add another column.
      await tablePage.addColumn({name: 'column:3', type: 'string', width: '200px'});

      // Expect no horizontal overflow and columns to fill available space.
      await expectTable(table).not.toHaveHorizontalOverflow();
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(100);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(100);
    });
  });
});
