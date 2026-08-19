import {test} from '../../fixtures';
import {TablePagePO} from './table-page.po';
import {TablePO} from './table.po';
import {expect} from '@playwright/test';

test.describe.only('sci-table async datasource', () => {

  test('should load pages', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePO(tablePage.table);
    await tablePage.navigate();
    await tablePage.setSlowDataSource(true);
    await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

    // Wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await expect(table.column({name: 'column:name'}).cells.first()).not.toBeEmpty();

    await table.scrollTo({y: 1500});

    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await expect(table.column({name: 'column:name'}).cells.first()).not.toBeEmpty();
  });

  test('should load pages when scrolling with scrollbar', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePO(tablePage.table);
    await tablePage.navigate();
    await tablePage.setSlowDataSource(true);
    await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

    // Wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await expect(table.column({name: 'column:name'}).cells.first()).not.toBeEmpty();

    await table.verticalScrollbar.scroll(10_000);

    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await expect(table.column({name: 'column:name'}).cells.last()).toHaveText('Product 10000');
  });

  test('should load first and last row correctly', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePO(tablePage.table);
    await tablePage.navigate();
    await tablePage.setSlowDataSource(true);
    await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

    await expect(table.column({name: 'column:name'}).cells.first()).toHaveText('Product 1');

    await table.scrollTo({y: 'end'});
    await expect(table.column({name: 'column:name'}).cells.last()).toHaveText('Product 10000');
  });

  test('should show skeletons when applying sort while using async datasource', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePO(tablePage.table);
    await tablePage.navigate();
    await tablePage.setSlowDataSource(true);
    await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

    // Wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();

    await table.column({name: 'column:name'}).sort();
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
  });

  test('should show skeletons when applying filter while using async datasource', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePO(tablePage.table);
    await tablePage.navigate();
    await tablePage.setSlowDataSource(true);
    await tablePage.addColumn({name: 'column:name', header: 'Name', type: 'string'});

    // Wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();

    await table.column({name: 'column:name'}).filter('1');
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
  });

  test('should not show skeletons when scrolling back to an already-loaded page', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePO(tablePage.table);
    await tablePage.navigate();
    await tablePage.setSlowDataSource(true);
    await tablePage.addColumn({header: 'Name', type: 'string'});

    // Wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();

    await table.scrollTo({y: 1500});
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();

    await table.scrollTo({y: 0});
    await expect(table.rows.locator('.skeleton').isVisible()).resolves.toBe(false);

    await table.scrollTo({y: 1500});
    await expect(table.rows.locator('.skeleton').isVisible()).resolves.toBe(false);
  });

  test('should select over multiple pages', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePO(tablePage.table);
    await tablePage.navigate();
    await tablePage.setSlowDataSource(true);
    await tablePage.addColumn({header: 'Name', type: 'string'});

    // Wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await table.rows.first().click();

    await table.scrollTo({y: 10_000});
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await table.rows.first().click({modifiers: ['Shift']});

    await expect(tablePage.selectedItems).toContainText('345');
  });

  test('should select all items with ctrl+a', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePO(tablePage.table);
    await tablePage.navigate();
    await tablePage.setSlowDataSource(true);
    await tablePage.addColumn({header: 'Name', type: 'string'});

    // Wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await table.locator.click();
    await page.keyboard.press('Control+A');
    await expect(tablePage.selectedItems).toContainText('10000');
  });
});
