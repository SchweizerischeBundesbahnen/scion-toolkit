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

test.describe.only('sci-table', () => {

  test.describe('global properties', () => {
    test('should disable filters', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

      await tablePage.setFilterable(false);
      await expect(table.filters).toHaveCount(0);

      await tablePage.setFilterable(true);
      await expect(table.filters).toHaveCount(1);
    });

    test('should disable sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

      await tablePage.setSortable(false);
      await expect(table.sortButtons).toHaveCount(0);

      await tablePage.setSortable(true);
      await expect(table.sortButtons).toHaveCount(1);
    });

    test('should hide header', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

      await tablePage.showHeader(false);
      await expect(table.headers).toHaveCount(0);

      await tablePage.showHeader(true);
      await expect(table.headers).toHaveCount(1);
    });

    test('should disable resize', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await tablePage.setResizable(false);
      await expect(table.column({name: 'column:name'}).splitter.locator).not.toBeAttached();

      await tablePage.setResizable(true);
      await expect(table.column({name: 'column:name'}).splitter.locator).toBeAttached();
    });

    test('should adapt to container size', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

      await expectRow(table.row(0)).toBeAttached();
      const count = await table.rows.count();

      await tablePage.setHeight(1500);
      await expect.poll(() => table.rows.count()).toBeGreaterThan(count);

      await tablePage.setHeight(200);
      await expect.poll(() => table.rows.count()).toBeLessThan(count);
    });

    test('should be able to set item size', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

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
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

      await tablePage.setTableCount(4);

      await expect(table.locator).toHaveCount(4);

      // Should not interfere with other tables
      await table.column({index: 0}).sort();

      await expect(table.column({index: 0}).locator.locator('[data-sort="asc"]')).toBeAttached();
      await expect(table.column({index: 1}).locator).toBeAttached();
      await expect(table.column({index: 1}).locator.locator('[data-sort="asc"]')).not.toBeAttached();
      await expect(table.column({index: 2}).locator).toBeAttached();
      await expect(table.column({index: 2}).locator.locator('[data-sort="asc"]')).not.toBeAttached();
      await expect(table.column({index: 3}).locator).toBeAttached();
      await expect(table.column({index: 3}).locator.locator('[data-sort="asc"]')).not.toBeAttached();
    });
  });

  test.describe('columns', () => {
    test('should add string column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:testee', header: 'Test Column', type: 'string'});
      await expect(table.column({name: 'column:testee'}).locator).toBeVisible();
    });

    test('should add number column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:testee', header: 'Test Column', type: 'number'});
      await expect(table.column({name: 'column:testee'}).locator).toBeVisible();
    });

    test('should add boolean column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:testee', header: 'Test Column', type: 'boolean'});
      await expect(table.column({name: 'column:testee'}).locator).toBeVisible();
    });

    test('should add template column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:testee', header: 'Test Column', type: 'template'});
      await expect(table.column({name: 'column:testee'}).locator).toBeVisible();
    });

    test('should add component column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:testee', header: 'Test Column', type: 'component'});
      await expect(table.column({name: 'column:testee'}).locator).toBeVisible();
    });

    test('should add a lot of columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      for (let i = 0; i < 20; i++) {
        await tablePage.addColumn({header: `Column ${i}`, type: 'string'});
      }

      await expectTable(table).toHaveColumnCount(20);
      await expectTable(table).toHaveHorizontalOverflow();

      const col19 = table.column({index: 19});

      await expect(col19.locator).not.toBeInViewport();
      await table.scrollTo({x: 'end'});
      await expect(col19.locator).toBeInViewport();
      await table.scrollTo({x: 'start'});
      await expect(col19.locator).not.toBeInViewport();
    });
  });

  test.describe('filtering', () => {
    test('should filter string column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      const noFilterCount = await waitUntilStable(() => table.rows.count());

      await table.column({name: 'column:name'}).filter('Product 1');
      await expectTable(table).column({name: 'column:name'}).cells.toContainText('Product 1');

      await table.column({name: 'column:name'}).clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter number column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:price', header: 'Price', type: 'number'});
      const noFilterCount = await waitUntilStable(() => table.rows.count());

      // read the first visible price value and use it as the filter criterion
      const firstPrice = (await table.row(0).cell(0).textContent())!.trim();
      await table.column({name: 'column:price'}).filter(firstPrice);
      await expectTable(table).column({name: 'column:price'}).cells.toContainText(firstPrice);

      await table.column({name: 'column:price'}).clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter boolean column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:inStock', header: 'In Stock', type: 'boolean'});
      const noFilterCount = await waitUntilStable(() => table.rows.count());

      await table.column({name: 'column:inStock'}).filter('false');
      await expectTable(table).column({name: 'column:inStock'}).cells.toContainText('clear');

      await table.column({name: 'column:inStock'}).filter('');
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should not filter template column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:template', header: 'Template', type: 'template'});

      const templateColumn = table.column({name: 'column:template'});
      await expect(templateColumn.locator).toBeAttached();
      await expect(templateColumn.filterField).not.toBeAttached();
    });

    test('should filter template column with custom filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:template', header: 'Template', type: 'template', customFilter: true});
      const noFilterCount = await waitUntilStable(() => table.rows.count());

      await table.column({name: 'column:template'}).filter('Product 9999');
      await expect(table.rows).toHaveCount(1);

      await table.column({name: 'column:template'}).clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should not filter component column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:component', header: 'Component', type: 'component'});

      const componentColumn = table.column({name: 'column:component'});

      await expect(componentColumn.locator).toBeAttached();
      await expect(componentColumn.filterField).not.toBeAttached();
    });

    test('should filter component column with custom filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:component', header: 'Component', type: 'component', customFilter: true});
      const noFilterCount = await waitUntilStable(() => table.rows.count());

      await table.column({name: 'column:component'}).filter('Product 9999');
      await expect(table.rows).toHaveCount(1);

      await table.column({name: 'column:component'}).clearFilter();
      await expect(table.rows).toHaveCount(noFilterCount);
    });

    test('should filter large amount of data', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.setRowCount(1_000_000);
      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await table.column({name: 'column:name'}).filter('999999');
      await expect(table.rows).toHaveCount(1);
    });

    test('should reset scroll position to top when applying filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await table.scrollTo({y: 1000});
      await expect.poll(() => table.scrollTop()).toBeGreaterThan(0);

      await table.column({name: 'column:name'}).filter('999');
      await expect.poll(() => table.scrollTop()).toBe(0);
    });

    test('should show empty state', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await table.column({name: 'column:name'}).filter('abc');
      await expect(table.rows).toHaveCount(0);
      await expect(table.locator).toContainText('No items found.');
    });

    test('should retain selection on filtering', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.column({name: 'column:name'}).filter('Product 1');
      await expectTable(table).column({name: 'column:name'}).cells.toContainText('Product 1');
      await expectRow(table.row(0)).toBeSelected();
    });
  });

  test.describe('resizing', () => {
    test('should resize column by moving splitter between column headers', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px'});

      const splitterBounds = await table.column({name: 'column:name'}).splitter.bounds();
      let mouseX = splitterBounds.hcenter;
      await page.mouse.move(mouseX, splitterBounds.top);
      await page.mouse.down();

      mouseX += 100;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(200);

      mouseX += 50;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(250);

      mouseX -= 20;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(230);

      mouseX += 50;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(280);

      await page.mouse.up();
      mouseX += 50;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(280);
    });

    test('should resize column by moving splitter between column cells', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px'});

      const splitterBounds = await table.column({name: 'column:name'}).splitter.bounds();
      const tableBounds = await table.bounds();
      let mouseX = splitterBounds.hcenter;
      await page.mouse.move(mouseX, tableBounds.vcenter);
      await page.mouse.down();

      mouseX += 100;
      await page.mouse.move(mouseX, tableBounds.vcenter, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(200);

      mouseX += 50;
      await page.mouse.move(mouseX, tableBounds.vcenter, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(250);

      mouseX -= 20;
      await page.mouse.move(mouseX, tableBounds.vcenter, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(230);

      mouseX += 50;
      await page.mouse.move(mouseX, tableBounds.vcenter, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(280);

      await page.mouse.up();
      mouseX += 50;
      await page.mouse.move(mouseX, tableBounds.vcenter, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(280);
    });

    test('should resize multiple columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '200px'});
      await tablePage.addColumn({name: 'column:testee', header: 'Testee', type: 'string', width: '200px'});

      await table.column({name: 'column:name'}).splitter.drag(-50);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(150);
      await expect.poll(() => table.column({name: 'column:testee'}).width()).toBe(200);

      await table.column({name: 'column:testee'}).splitter.drag(50);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(150);
      await expect.poll(() => table.column({name: 'column:testee'}).width()).toBe(250);
    });

    test('should stop at max width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px', maxWidth: 200});

      await table.column({name: 'column:name'}).splitter.drag(300);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(200);
    });

    test('should ignore reverse dragging when pointer is beyond splitter bounds', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px', maxWidth: 200});

      const splitterBounds = await table.column({name: 'column:name'}).splitter.bounds();
      let mouseX = splitterBounds.hcenter;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await page.mouse.down();

      // Move mouse beyond max width.
      mouseX += 300;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(200);

      // Move mouse back between min and max width.
      mouseX -= 250;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      // Should be somewhere between the min and max width. Absolute values can not be expected, because the sashing can be too fast for the boundary check in overlay.
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBeGreaterThan(100);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBeLessThan(200);

      // Move mouse beyond min width.
      mouseX -= 150;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(100);

      // Move mouse back between min and max width.
      mouseX += 125;
      await page.mouse.move(mouseX, splitterBounds.top, {steps: 20});
      // Should be somewhere between the min and max size. Absolute values can not be expected, because the sashing can be too fast for the boundary check in overlay.
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBeGreaterThan(100);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBeLessThan(200);
      await page.mouse.up();
    });

    test('should decrease column width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '200px'});

      await table.column({name: 'column:name'}).splitter.drag(-100);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(100);
    });

    test('should stop at min width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '200px', minWidth: 100});

      await table.column({name: 'column:name'}).splitter.drag(-300);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(100);
    });

    test('should allow to overflow while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '200px'});

      await table.column({name: 'column:name'}).splitter.drag(page.viewportSize()?.width ?? 0);
      await expectTable(table).toHaveHorizontalOverflow();
    });

    test('should auto resize', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '200px'});
      await tablePage.addColumn({name: 'column:price', header: 'Price', type: 'string'});

      await table.column({name: 'column:name'}).splitter.dblclick();
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBeLessThan(200);
    });

    test('should auto resize to max-width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '50px', minWidth: 0, maxWidth: 75});
      await tablePage.addColumn({name: 'column:price', header: 'Price', type: 'string'});

      await table.column({name: 'column:name'}).splitter.dblclick();
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(75);

      // Should still be able to resize after auto resize
      await table.column({name: 'column:name'}).splitter.drag(-25);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(50);
    });

    test('should auto resize to min-width', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '600px', minWidth: 400});
      await tablePage.addColumn({name: 'column:price', header: 'Price', type: 'string'});

      await table.column({name: 'column:name'}).splitter.dblclick();
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(400);

      // Should still be able to resize after auto resize
      await table.column({name: 'column:name'}).splitter.drag(25);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(425);
    });

    test('should save sizes between reloads', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await table.column({name: 'column:name'}).splitter.drag(-100);
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(500);

      await page.reload();
      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});
      await expect.poll(() => table.column({name: 'column:name'}).width()).toBe(500);
    });

    test('should push out flexible columns', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', header: 'Column 1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', header: 'Column 2', type: 'string'});
      await tablePage.addColumn({name: 'column:3', header: 'Column 3', type: 'string'});

      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);

      // Grow column two. Columns to the left should stay the same, to the right should shrink to min width and push out.
      await table.column({name: 'column:2'}).splitter.drag(600);
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(800);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(100);

      // Scroll right to grab the splitter.
      await table.scrollTo({x: 'end'});
      // Shrink column two. Columns to the left should stay the same, to the right should grow.
      await table.column({name: 'column:2'}).splitter.drag(-650);
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(150);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBe(250);
      await expectTable(table).not.toHaveVerticalScroll();
    });

    test('should never grow columns beyond max-size', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', header: 'Column 1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', header: 'Column 2', type: 'string', maxWidth: 200});
      await tablePage.addColumn({name: 'column:3', header: 'Column 3', type: 'string'});

      // Shrink column one.
      await table.column({name: 'column:1'}).splitter.drag(-100);
      // Expect only column three to grow, since column two has a max width of 200.
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBeBetween(95, 105);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBeBetween(195, 205);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBeBetween(295, 305);
    });

    test('should shrink table when all flexible columns shrink', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', header: 'Column 1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', header: 'Column 2', type: 'string'});
      await tablePage.addColumn({name: 'column:3', header: 'Column 3', type: 'string'});

      await table.column({name: 'column:1'}).splitter.drag(-100);
      await table.column({name: 'column:2'}).splitter.drag(-100);
      await table.column({name: 'column:3'}).splitter.drag(-100);

      await expect.poll(() => table.column({name: 'column:1'}).width()).toBeBetween(95, 105);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBeBetween(145, 155);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBeBetween(245, 255);
      await expect.poll(() => table.body.boundingBox().then(bb => bb?.width)).toBeLessThan(600);
    });

    test('should lock flexible columns on overflow', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.setWidth(800);

      await tablePage.addColumn({name: 'column:1', header: 'Column 1', type: 'string'});
      await tablePage.addColumn({name: 'column:2', header: 'Column 2', type: 'string'});
      await tablePage.addColumn({name: 'column:3', header: 'Column 3', type: 'string'});
      await tablePage.addColumn({name: 'column:4', header: 'Column 4', type: 'string'});

      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);

      await table.column({name: 'column:3'}).splitter.drag(600);
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBe(200);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBeBetween(795, 805);
      await expect.poll(() => table.column({name: 'column:4'}).width()).toBeBetween(95, 105);

      await table.column({name: 'column:1'}).splitter.drag(100);
      await expect.poll(() => table.column({name: 'column:1'}).width()).toBeBetween(295, 305);
      await expect.poll(() => table.column({name: 'column:2'}).width()).toBeBetween(195, 205);
      await expect.poll(() => table.column({name: 'column:3'}).width()).toBeBetween(795, 805);
      await expect.poll(() => table.column({name: 'column:4'}).width()).toBeBetween(95, 105);
    });

    test('should hide row hover while resizing', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px'});

      const splitterBounds = await table.column({name: 'column:name'}).splitter.bounds();
      const rowBounds = await table.row(3).bounds();
      await page.mouse.move(splitterBounds.hcenter, splitterBounds.top);
      await page.mouse.down();
      await page.mouse.move(rowBounds.left, rowBounds.vcenter);
      await expect(table.row(3).locator).not.toHaveCSS('background-color', 'rgb(233, 233, 233)');

      await page.mouse.up();
      await expect(table.row(3).locator).toHaveCSS('background-color', 'rgb(233, 233, 233)');
    });

    test('should scroll viewport when wheeling on splitter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:testee', header: 'Testee', type: 'string', width: '100px'});

      const splitterBounds = await table.column({name: 'column:name'}).splitter.bounds();
      const viewportBounds = await table.bounds();

      // The splitter overlays the whole table body use viewportBound vcenter.
      await page.mouse.move(splitterBounds.hcenter, viewportBounds.vcenter);

      const initialScrollTop = await table.scrollTop();
      await page.mouse.wheel(0, 250);
      await expect.poll(() => table.scrollTop()).toBeGreaterThan(initialScrollTop);
    });
  });

  test.describe('sorting', () => {
    test('should sort string column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      // sort ascending
      await table.column({name: 'column:name'}).sort();
      await expectTable(table).column({name: 'column:price'}).toBeSorted();

      // sort descending
      await table.column({name: 'column:name'}).sort();
      await expectTable(table).column({name: 'column:price'}).toBeSorted('desc');
    });

    test('should sort number column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:price', header: 'Price', type: 'number'});

      // sort ascending
      await table.column({name: 'column:price'}).sort();
      await expectTable(table).column({name: 'column:price'}).toBeSorted();

      // sort descending
      await table.column({name: 'column:price'}).sort();
      await expectTable(table).column({name: 'column:price'}).toBeSorted('desc');
    });

    test('should sort boolean column ascending and descending', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:inStock', header: 'In Stock', type: 'boolean'});

      // sort ascending: false values first
      await table.column({name: 'column:inStock'}).sort();
      await expectTable(table).column({name: 'column:inStock'}).toBeSorted();

      // sort descending: true values first
      await table.column({name: 'column:inStock'}).sort();
      await expectTable(table).column({name: 'column:inStock'}).toBeSorted('desc');
    });

    test('should sort multiple columns with ctrl or meta', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});
      await tablePage.addColumn({name: 'column:price', header: 'Price', type: 'number'});

      const sortButtons = table.locator.locator('.e2e-column-sort');
      await sortButtons.nth(0).click();
      await sortButtons.nth(1).click({modifiers: ['ControlOrMeta']});

      await expectTable(table).column({name: 'column:name'}).toBeSorted();
      await expect(sortButtons.nth(0)).toHaveAttribute('data-sort', 'asc');
      await expect(sortButtons.nth(1)).toHaveAttribute('data-sort', 'asc');
    });

    test('should retain filter after sorting', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});
      await table.column({name: 'column:name'}).filter('Product 1');
      await expectTable(table).column({name: 'column:name'}).cells.toContainText('Product 1');

      await table.column({name: 'column:name'}).sort();

      await expectTable(table).column({name: 'column:name'}).cells.toContainText('Product 1');
      await expectTable(table).column({name: 'column:name'}).toBeSorted();
    });

    test('should sort large amount of data', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.setRowCount(1_000_000);
      await tablePage.addColumn({name: 'column:price', header: 'Price', type: 'number'});

      await table.column({name: 'column:price'}).sort();
      await expect(table.column({name: 'column:price'}).cells.first()).toHaveText('1');
      await table.column({name: 'column:price'}).sort();
      await expect(table.column({name: 'column:price'}).cells.first()).toHaveText('1000');
    });

    test('should reset scroll position to top when applying sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      // scroll down so the viewport is no longer at the top.
      await table.scrollTo({y: 1000});
      await expect.poll(() => table.scrollTop()).toBeGreaterThan(0);

      // applying a sort should reset the viewport scroll position to the top.
      await table.column({name: 'column:name'}).sort();
      await expect.poll(() => table.scrollTop()).toBe(0);
    });

    test('should retain selection after sorting', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.column({name: 'column:name'}).sort();
      await expectTable(table).column({name: 'column:name'}).toBeSorted();
      await expectRow(table.row(0)).toBeSelected();
    });
  });

  test.describe('selection', () => {
    test('should disable selection', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});
      await tablePage.setSelectable(false);

      await table.row(0).click();
      await expectRow(table.row(0)).toBeActive();
      await expectRow(table.row(0)).not.toBeSelected();

      await page.keyboard.press('ArrowDown');
      await expectRow(table.row(1)).toBeActive();
      await expectRow(table.row(1)).not.toBeSelected();
      await expect(tablePage.selectedItems).toHaveText('0');
    });

    test('should only select a single row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});
      await tablePage.setSelectable('single');

      await table.row(0).click();
      await table.row(1).click(['ControlOrMeta']);
      await expectRow(table.row(0)).not.toBeSelected();
      await expectRow(table.row(1)).toBeSelected();

      await table.row(3).click(['Shift']);
      await expectRow(table.row(1)).not.toBeSelected();
      await expectRow(table.row(2)).not.toBeSelected();
      await expectRow(table.row(3)).toBeSelected();
      await expect(tablePage.selectedItems).toHaveText('1');
    });

    test('should receive focus via tab navigation', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

      await table.sortButtons.first().focus();
      await page.keyboard.press('Tab'); // Filter
      await page.keyboard.press('Tab'); // Table keyboard navigator
      await page.keyboard.press('ArrowDown');

      await expectRow(table.row(0)).toBeActive();
    });

    test('should scroll the active row into view during keyboard navigation', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

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
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.setRowCount(3);
      await tablePage.addColumn({header: 'Name', type: 'string'});

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
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

      await table.body.focus();
      await page.keyboard.press('ControlOrMeta+A');

      await expect(tablePage.selectedItems).toHaveText('10000');
      await expect(table.body).toBeFocused();
    });

    test('should toggle the row with ctrl+space', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

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
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.row(1).click();
      await expectRow(table.row(0)).not.toBeSelected();
      await expectRow(table.row(1)).toBeSelected();
    });

    test('should select multiple rows with ctrl', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

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
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

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
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.scrollTo({y: 1000});
      await expectRow(table.row(0)).not.toBeSelected();

      await table.scrollTo({y: 0});
      await expectRow(table.row(0)).toBeSelected();
    });

    test('should keep selection on filter', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.column({name: 'column:name'}).filter('9999');
      await expectRow(table.row(0)).not.toBeSelected();

      await table.column({name: 'column:name'}).clearFilter();
      await expectRow(table.row(0)).toBeSelected();
    });

    test('should keep selection on sort', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await table.row(0).click();
      await expectRow(table.row(0)).toBeSelected();

      await table.column({name: 'column:name'}).sort();
      // click twice to sort descending
      await table.column({name: 'column:name'}).sort();
      await expectRow(table.row(0)).not.toBeSelected();

      await table.column({name: 'column:name'}).sort();
      await expectRow(table.row(0)).toBeSelected();
    });

    test('should activate element with keyboard', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

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
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

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
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Name', type: 'string'});

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
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await expect(table.row(0).cell(0).locator).not.toHaveAttribute('part', 'column:name row:red');
      await expect(table.row(1).cell(0).locator).not.toHaveAttribute('part', 'column:name row:red');
      await expect(table.row(2).cell(0).locator).not.toHaveAttribute('part', 'column:name row:red');

      await tablePage.conditionallyStyleRow();

      await expect(table.row(0).cell(0).locator).not.toHaveAttribute('part', 'column:name row:red');
      await expect(table.row(1).cell(0).locator).not.toHaveAttribute('part', 'column:name row:red');
      await expect(table.row(2).cell(0).locator).toHaveAttribute('part', 'column:name row:red');
      await expect.poll(() => table.row(2).cell(0).locator.evaluate(element => getComputedStyle(element).backgroundColor))
        .toEqual('rgba(255, 0, 0, 0.2)');
    });

    test('should not conditionally style selected row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

      await tablePage.conditionallyStyleRow();

      await expect(table.row(2).cell(0).locator).toHaveAttribute('part', 'column:name row:red');

      await table.row(2).click();

      await expect(table.row(2).cell(0).locator).not.toHaveAttribute('part');
    });

    test('should conditionally style column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.addColumn({header: 'Red', name: 'column:red', type: 'string'});

      await expect(table.row(0).cell(0).locator).toHaveAttribute('part', 'column:red');
      await expect.poll(() => table.row(0).cell(0).locator.evaluate(element => getComputedStyle(element).backgroundColor))
        .toEqual('rgba(255, 0, 0, 0.2)');
    });
  });

  test.describe('row actions', () => {
    test('should show row actions on hover', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.setRowActions(true);
      await tablePage.addColumn({header: 'Name', type: 'string'});

      await table.row(3).hover();
      await expect(table.row(3).rowActions).toBeVisible();
    });

    test('should stick row actions to the right', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();
      await tablePage.setWidth(500);
      await tablePage.setRowActions(true);

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px'});
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
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      const splitterBounds = await table.column({name: 'column:name'}).splitter.bounds();
      const rowBounds = await table.row(3).bounds();
      await page.mouse.move(splitterBounds.hcenter, splitterBounds.top);
      await page.mouse.down();
      await page.mouse.move(rowBounds.hcenter, rowBounds.vcenter);
      await expect(table.row(3).rowActions).not.toBeAttached();

      await page.mouse.up();
      await expect(table.row(3).rowActions).toBeVisible();
    });

    test('should hide row actions while scrolling', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({header: 'Name', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      await table.row(10).hover();
      await expect(table.row(10).rowActions).toBeVisible();

      await page.mouse.wheel(0, 250);
      await expect.poll(() => table.scrollTop()).toBe(250);
      await expect(table.row(10).rowActions).toBeHidden();

      await table.row(10).hover();
      await expect(table.row(10).rowActions).toBeVisible();
    });

    test('should scroll viewport when wheeling on toolbar', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:testee', header: 'Testee', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      await table.row(10).hover();
      await expect(table.row(10).rowActions).toBeVisible();

      const actionBounds = await table.row(10).rowActionsBounds();
      await table.row(10).rowActions.hover();
      await page.mouse.move(actionBounds.hcenter, actionBounds.vcenter);
      await page.mouse.wheel(0, 250);
      await expect.poll(() => table.scrollTop()).toBe(250);
    });

    test('should keep row actions visible when moving between row toolbar and overlay', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:testee', header: 'Testee', type: 'string', width: '100px'});
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

      // move out of splitter bounds on top
      await page.mouse.move(splitterBounds.hcenter, splitterBounds.top - 10);
      await expect(table.row(10).rowActions).not.toBeVisible();
    });

    test('should hide row actions when leaving overlay or toolbar for header', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:testee', header: 'Testee', type: 'string', width: '100px'});
      await tablePage.setRowActions(true);

      const row = table.row(10);
      await row.hover();
      await expect(row.rowActions).toBeVisible();

      const splitterBounds = await table.column({name: 'column:name'}).splitter.bounds();
      await page.mouse.move(splitterBounds.hcenter, await row.bounds().then(bb => bb.vcenter));
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
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({header: 'Name', type: 'string', width: '100px'});
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

  test.describe('scrollbar', () => {
    test('should overlap column splitters', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', header: 'Column 1', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:2', header: 'Column 2', type: 'string', width: '100000px'});

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
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({name: 'column:1', header: 'Column 1', type: 'string', width: '100px'});
      await tablePage.addColumn({name: 'column:2', header: 'Column 2', type: 'string', width: '100000px'});

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

    test('should not have horizontal overflow', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.setRowCount(1);
      await tablePage.addColumn({header: 'Column', type: 'string'});

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

  test.describe('layout', () => {

    test('should allow subsequent elements to cover the table', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(page);
      await tablePage.navigate();

      await tablePage.addColumn({header: 'Column', type: 'string', width: '100px'});

      // Verify that the table maintains a default stacking level, allowing subsequent DOM elements to cover it without an explicit z-index.
      expect(await hasDefaultStackingLevel(table.locator), 'Table has an elevated stacking level').toBe(true);
    });
  });
});
