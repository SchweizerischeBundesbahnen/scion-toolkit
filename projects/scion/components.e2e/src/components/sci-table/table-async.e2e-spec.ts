import {test} from '../../fixtures';
import {TablePagePO} from './table-page.po';
import {TablePo} from './table.po';
import {expect} from '@playwright/test';

test.describe('sci-table async datasource', () => {
  test('should load pages', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePo(page);
    await tablePage.navigate('slow-data-source');
    await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

    // wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await expect(table.locateColumnCells(0).first()).not.toBeEmpty();

    await table.scrollViewPort({x: 0, y: 1500});

    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await expect(table.locateColumnCells(0).first()).not.toBeEmpty();
  });

  test('should load pages when scrolling with scrollbar', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePo(page);
    await tablePage.navigate('slow-data-source');
    await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

    // wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await expect(table.locateColumnCells(0).first()).not.toBeEmpty();

    await table.scrollVerticalWithScrollbar(100);

    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await expect(table.locateColumnCells(0).first()).not.toBeEmpty();
  });

  test('should show skeletons when applying sort while using async datasource', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePo(page);
    await tablePage.navigate('slow-data-source');
    await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

    // wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();

    await table.column(0).sort();
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
  });

  test('should show skeletons when applying filter while using async datasource', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePo(page);
    await tablePage.navigate('slow-data-source');
    await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

    // wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();

    await table.column(0).filter('1');
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
  });

  test('should not show skeletons when scrolling back to an already-loaded page', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePo(page);
    await tablePage.navigate('slow-data-source');
    await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

    // wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();

    await table.scrollViewPort({x: 0, y: 1500});
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();

    await table.scrollViewPort({x: 0, y: 0});
    await expect(table.rows.locator('.skeleton').isVisible()).resolves.toBe(false);

    await table.scrollViewPort({x: 0, y: 1500});
    await expect(table.rows.locator('.skeleton').isVisible()).resolves.toBe(false);
  });

  test('should select over multiple pages', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePo(page);
    await tablePage.navigate('slow-data-source');
    await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

    // wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await table.rows.first().click();

    await table.scrollViewPort({x: 0, y: 10_000});
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await table.rows.first().click({modifiers: ['Shift']});

    await expect(tablePage.selectedItems).toContainText('348');
  });

  test('should select all items with ctrl+a', async ({page}) => {
    const tablePage = new TablePagePO(page);
    const table = new TablePo(page);
    await tablePage.navigate('slow-data-source');
    await tablePage.addColumn({name: 'name', header: 'Name', type: 'string'});

    // wait for initial page to finish loading.
    await expect(table.rows.locator('.skeleton').first()).toBeAttached();
    await expect(table.rows.locator('.skeleton').first()).not.toBeAttached();
    await table.verticalViewport.click();
    await page.keyboard.press('Control+A');
    await expect(tablePage.selectedItems).toContainText('10000');
  });
});
