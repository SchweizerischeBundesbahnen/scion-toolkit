import {test} from '../../fixtures';
import {expect} from '@playwright/test';
import {TablePagePO} from './table-page.po';
import {TablePO} from './table.po';
import {provideHttpDatasource} from './datasource/table-http-datasource';
import {expectTable} from './table-matcher';
import {expectRow} from './row-matcher';
import {CustomInputColumnPO} from './custom-input-column.po';
import {setCaret} from '../../helper/testing.utils';
import {CustomButtonColumnPO} from './custom-button-column.po';

test.describe('sci-table hierarchical', () => {

  test.describe('Navigation', () => {

    test('should expand / collapse with click', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {
          id: 1,
          name: 'Item 1',
        },
        {
          id: 2,
          name: 'Item 2',
        },
        {
          id: 3,
          name: 'Item 3',
          parentId: 2,
        },
        {
          id: 4,
          name: 'Item 4',
          parentId: 2,
        },
        {
          id: 5,
          name: 'Item 5',
        },
        {
          id: 6,
          name: 'Item 6',
        },
        {
          id: 7,
          name: 'Item 7',
          parentId: 6,
        },
        {
          id: 8,
          name: 'Item 8',
          parentId: 7,
        },
        {
          id: 9,
          name: 'Item 9',
          parentId: 7,
        },
        {
          id: 10,
          name: 'Item 10',
          parentId: 6,
        },
      ], {datasource: 'array-http'});
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: 'collapsed'}],
        [{label: 'Item 5', state: null}],
        [{label: 'Item 6', state: 'collapsed'}],
      ]);

      // Expand Item 2
      await table.row({index: 1}).clickExpansionControl();
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: 'expanded'}],
        [{label: 'Item 3', state: null}],
        [{label: 'Item 4', state: null}],
        [{label: 'Item 5', state: null}],
        [{label: 'Item 6', state: 'collapsed'}],
      ]);

      // Expand Item 6
      await table.row({index: 5}).clickExpansionControl();
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: 'expanded'}],
        [{label: 'Item 3', state: null}],
        [{label: 'Item 4', state: null}],
        [{label: 'Item 5', state: null}],
        [{label: 'Item 6', state: 'expanded'}],
        [{label: 'Item 7', state: 'collapsed'}],
        [{label: 'Item 10', state: null}],
      ]);

      // Expand Item 7
      await table.row({index: 6}).clickExpansionControl();
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: 'expanded'}],
        [{label: 'Item 3', state: null}],
        [{label: 'Item 4', state: null}],
        [{label: 'Item 5', state: null}],
        [{label: 'Item 6', state: 'expanded'}],
        [{label: 'Item 7', state: 'expanded'}],
        [{label: 'Item 8', state: null}],
        [{label: 'Item 9', state: null}],
        [{label: 'Item 10', state: null}],
      ]);

      // Collapse Item 7
      await table.row({index: 6}).clickExpansionControl();
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: 'expanded'}],
        [{label: 'Item 3', state: null}],
        [{label: 'Item 4', state: null}],
        [{label: 'Item 5', state: null}],
        [{label: 'Item 6', state: 'expanded'}],
        [{label: 'Item 7', state: 'collapsed'}],
        [{label: 'Item 10', state: null}],
      ]);

      // Collapse Item 6
      await table.row({index: 5}).clickExpansionControl();
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: 'expanded'}],
        [{label: 'Item 3', state: null}],
        [{label: 'Item 4', state: null}],
        [{label: 'Item 5', state: null}],
        [{label: 'Item 6', state: 'collapsed'}],
      ]);

      // Collapse Item 2
      await table.row({index: 1}).clickExpansionControl();
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: 'collapsed'}],
        [{label: 'Item 5', state: null}],
        [{label: 'Item 6', state: 'collapsed'}],
      ]);
    });

    test('should expand / collapse with double click', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {
          id: 1,
          name: 'Item 1',
        },
        {
          id: 2,
          name: 'Item 2',
          parentId: 1,
        },
      ], {datasource: 'array-http'});

      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: 'collapsed'}],
      ]);

      // Expand Item 1
      await table.row({index: 0}).dblclick();
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: 'expanded'}],
        [{label: 'Item 2', state: null}],
      ]);

      // Collapse Item 1
      await table.row({index: 0}).dblclick();
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: 'collapsed'}],
      ]);
    });

    test('should expand a collapsed branch on ArrowRight without moving selection', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
      ], {datasource: 'array-http'});

      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: 'collapsed'}],
      ]);

      await table.row({index: 0}).click();
      await expect(tablePage.selection).toHaveText('1');
      await expect(tablePage.activeItemId).toHaveText('1');

      await page.keyboard.press('ArrowRight');
      await expect(tablePage.selection).toHaveText('1');
      await expect(tablePage.activeItemId).toHaveText('1');
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: 'expanded'}],
        [{label: 'Item 2', state: null}],
      ]);
      await expect(table.rows).toHaveCount(2);
    });

    test('should navigate visible rows in depth-first order with ArrowRight', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2'},
        {id: 3, name: 'Item 3', parentId: 2},
        {id: 4, name: 'Item 4', parentId: 3},
        {id: 5, name: 'Item 5', parentId: 3},
        {id: 6, name: 'Item 6', parentId: 2},
        {id: 7, name: 'Item 7'},
      ], {datasource: 'array-http'});

      await table.row({index: 1}).clickExpansionControl();
      await table.row({index: 2}).clickExpansionControl();
      await table.row({index: 0}).click();
      await expect(tablePage.selection).toHaveText('1');
      await expect(tablePage.activeItemId).toHaveText('1');

      for (const id of [2, 3, 4, 5, 6, 7]) {
        await test.step(`Navigate to Item ${id}`, async () => {
          await page.keyboard.press('ArrowRight');
          await expect(tablePage.selection).toHaveText(`${id}`);
          await expect(tablePage.activeItemId).toHaveText(`${id}`);
        });
      }

      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: 'expanded'}],
        [{label: 'Item 3', state: 'expanded'}],
        [{label: 'Item 4', state: null}],
        [{label: 'Item 5', state: null}],
        [{label: 'Item 6', state: null}],
        [{label: 'Item 7', state: null}],
      ]);
      await expect(table.rows).toHaveCount(7);
    });

    test('should collapse an expanded row on ArrowLeft without moving selection', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2'},
        {id: 3, name: 'Item 3', parentId: 2},
        {id: 4, name: 'Item 4', parentId: 3},
      ], {datasource: 'array-http'});

      await table.row({index: 1}).clickExpansionControl();
      await table.row({index: 2}).clickExpansionControl();
      await expect(table.rows).toHaveCount(4);
      await table.row({index: 1}).click();
      await expect(tablePage.selection).toHaveText('2');
      await expect(tablePage.activeItemId).toHaveText('2');

      await page.keyboard.press('ArrowLeft');
      await expect(tablePage.selection).toHaveText('2');
      await expect(tablePage.activeItemId).toHaveText('2');
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: 'collapsed'}],
      ]);
      await expect(table.rows).toHaveCount(2);
    });

    test('should move from a row to its parent on ArrowLeft', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
        {id: 3, name: 'Item 3', parentId: 2},
        {id: 4, name: 'Item 4', parentId: 1},
      ], {datasource: 'array-http'});

      await table.row({index: 0}).clickExpansionControl();
      await table.row({index: 1}).clickExpansionControl();
      await table.row({index: 3}).click();
      await expect(tablePage.selection).toHaveText('4');
      await expect(tablePage.activeItemId).toHaveText('4');

      await page.keyboard.press('ArrowLeft');
      await expect(tablePage.selection).toHaveText('1');
      await expect(tablePage.activeItemId).toHaveText('1');
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: 'expanded'}],
        [{label: 'Item 2', state: 'expanded'}],
        [{label: 'Item 3', state: null}],
        [{label: 'Item 4', state: null}],
      ]);
      await expect(table.rows).toHaveCount(4);
    });

    test('should stay on the first row on ArrowLeft', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2'},
      ], {datasource: 'array-http'});

      await table.row({index: 0}).click();
      await expect(tablePage.selection).toHaveText('1');
      await expect(tablePage.activeItemId).toHaveText('1');

      await page.keyboard.press('ArrowLeft');
      await expect(tablePage.selection).toHaveText('1');
      await expect(tablePage.activeItemId).toHaveText('1');
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: null}],
      ]);
      await expect(table.rows).toHaveCount(2);
    });

    test('should stay on the last visible row on ArrowRight', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
      ], {datasource: 'array-http'});

      await table.row({index: 0}).clickExpansionControl();
      await table.row({index: 1}).click();
      await expect(tablePage.selection).toHaveText('2');
      await expect(tablePage.activeItemId).toHaveText('2');

      await page.keyboard.press('ArrowRight');
      await expect(tablePage.selection).toHaveText('2');
      await expect(tablePage.activeItemId).toHaveText('2');
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: 'expanded'}],
        [{label: 'Item 2', state: null}],
      ]);
      await expect(table.rows).toHaveCount(2);
    });

    test('should select the previous expanded nested row from a root on ArrowLeft', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
        {id: 3, name: 'Item 3', parentId: 2},
        {id: 4, name: 'Item 4', parentId: 1},
        {id: 5, name: 'Item 5'},
      ], {datasource: 'array-http'});

      await table.row({index: 0}).clickExpansionControl();
      await table.row({index: 1}).clickExpansionControl();
      await table.row({index: 4}).click();
      await expect(tablePage.selection).toHaveText('5');
      await expect(tablePage.activeItemId).toHaveText('5');

      await page.keyboard.press('ArrowLeft');
      await expect(tablePage.selection).toHaveText('2');
      await expect(tablePage.activeItemId).toHaveText('2');
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: 'expanded'}],
        [{label: 'Item 2', state: 'expanded'}],
        [{label: 'Item 3', state: null}],
        [{label: 'Item 4', state: null}],
        [{label: 'Item 5', state: null}],
      ]);
      await expect(table.rows).toHaveCount(5);
    });

    test('should select the first row on ArrowLeft when no previous row is expanded', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2'},
        {id: 3, name: 'Item 3', parentId: 2},
        {id: 4, name: 'Item 4'},
        {id: 5, name: 'Item 5'},
        {id: 6, name: 'Item 6', parentId: 5},
      ], {datasource: 'array-http'});

      await table.row({index: 3}).click();
      await expect(tablePage.selection).toHaveText('5');
      await expect(tablePage.activeItemId).toHaveText('5');

      await page.keyboard.press('ArrowLeft');
      await expect(tablePage.selection).toHaveText('1');
      await expect(tablePage.activeItemId).toHaveText('1');
      await expectTable(table).toHaveContent([
        [{label: 'Item 1', state: null}],
        [{label: 'Item 2', state: 'collapsed'}],
        [{label: 'Item 4', state: null}],
        [{label: 'Item 5', state: 'collapsed'}],
      ]);
      await expect(table.rows).toHaveCount(4);
    });

    test('should navigate across viewport boundaries', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.showHeader(false);
      await tablePage.setFilterable(false);
      await tablePage.setRowHeight(20);
      await tablePage.setHeight(80);
      await tablePage.setBufferSize(0);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
        {id: 3, name: 'Item 3', parentId: 1},
        {id: 4, name: 'Item 4', parentId: 3},
        {id: 5, name: 'Item 5', parentId: 1},
        {id: 6, name: 'Item 6'},
        {id: 7, name: 'Item 7', parentId: 6},
        {id: 8, name: 'Item 8', parentId: 6},
        {id: 9, name: 'Item 9'},
        {id: 10, name: 'Item 10'},
        {id: 11, name: 'Item 11'},
      ], {datasource: 'array-http'});

      await tablePage.expandAll();

      await table.row({index: 0}).click();
      await expectRow(table.row({index: 0})).toBeFocused();

      await page.keyboard.press('PageDown');
      await expectRow(table.row({index: 3})).toBeFocused();

      await page.keyboard.press('ArrowDown');
      await expectRow(table.row({index: 4})).toBeFocused();

      await page.keyboard.press('PageDown');
      await expectRow(table.row({index: 7})).toBeFocused();

      await page.keyboard.press('ArrowUp');
      await expectRow(table.row({index: 6})).toBeFocused();

      await page.keyboard.press('PageUp');
      await expectRow(table.row({index: 3})).toBeFocused();

      await page.keyboard.press('PageUp');
      await expectRow(table.row({index: 0})).toBeFocused();
    });

    test('should not prevent native keystrokes (ArrowLeft, ArrowRight, dblclick) in inputs of custom column', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:component', type: 'component', extras: {componentColumn: {component: 'component:custom-input-column'}}});
      await provideHttpDatasource(page, [
        {id: 1},
        {id: 2, parentId: 1},
        {id: 3, parentId: 2},
      ], {datasource: 'array-http'});

      await table.row({index: 0}).clickExpansionControl();
      await table.row({index: 1}).click();
      await expectRow(table.row({index: 1})).toBeFocused();

      const cell = table.row({index: 1}).cell('column:component');
      const component = new CustomInputColumnPO(cell);
      await test.step('Pressing ArrowRight', async () => {
        await component.input.fill('0123456789');
        await setCaret(component.input, {start: 0, end: 0});

        await page.keyboard.press('ArrowRight');
        await expect(component.input).toHaveTextSelection({start: 1, end: 1});
        await expectRow(table.row({index: 1})).toBeFocused();
        await expectTable(table).toHaveContent([
          [{state: 'expanded', label: ''}],
          [{state: 'collapsed', label: ''}],
        ]);
      });

      await test.step('Pressing ArrowLeft', async () => {
        await component.input.fill('0123456789');
        await setCaret(component.input, {start: 10, end: 10});

        await page.keyboard.press('ArrowLeft');
        await expect(component.input).toHaveTextSelection({start: 9, end: 9});
        await expectRow(table.row({index: 1})).toBeFocused();
        await expectTable(table).toHaveContent([
          [{state: 'expanded', label: ''}],
          [{state: 'collapsed', label: ''}],
        ]);
      });

      await test.step('dblclick', async () => {
        await component.input.fill('0123456789');
        await component.input.dblclick();
        await expect(component.input).toHaveTextSelection({start: 0, end: 10});
        await expectRow(table.row({index: 1})).toBeFocused();
        await expectTable(table).toHaveContent([
          [{state: 'expanded', label: ''}],
          [{state: 'collapsed', label: ''}],
        ]);
      });
    });

    test('should not toggle row on double click on button of custom component', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:component', type: 'component', extras: {componentColumn: {component: 'component:custom-button-column'}}});
      await provideHttpDatasource(page, [
        {id: 1},
        {id: 2, parentId: 1},
      ], {datasource: 'array-http'});

      const cell = table.row({nth: 0}).cell('column:component');
      const component = new CustomButtonColumnPO(cell);
      await component.button.dblclick();
      await expectTable(table).toHaveContent([
        [{state: 'collapsed', label: 'Button'}],
      ]);
    });
  });

  test.describe('Selection', () => {

    test('should preserve selection after clicking chevron of another row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2'},
        {id: 3, name: 'Item 3', parentId: 2},
        {id: 4, name: 'Item 4'},
      ], {datasource: 'array-http'});

      await table.row({index: 1}).click();
      await table.row({index: 2}).click(['Shift']);
      await expectRow(table.row({index: 2})).toBeFocused();
      await expect(tablePage.selection).toHaveText('2 4');

      await table.row({index: 1}).clickExpansionControl();
      await expect(tablePage.selection).toHaveText('2 4');
      await expectRow(table.row({index: 2})).toBeFocused();
    });

    test('should select only visible rows on shift+click', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
        {id: 3, name: 'Item 3', parentId: 1},
        {id: 4, name: 'Item 4', parentId: 3},
        {id: 5, name: 'Item 5', parentId: 4},
        {id: 6, name: 'Item 6'},
      ], {datasource: 'array-http'});

      await table.row({index: 0}).clickExpansionControl();
      await table.row({index: 2}).clickExpansionControl();
      await expect(table.rows).toHaveCount(5);

      await table.row({index: 1}).click();
      await table.row({index: 4}).click(['Shift']);
      await expectRow(table.row({index: 4})).toBeFocused();
      await expect(tablePage.selection).toHaveText('2 3 4 6');
    });

    test('should select only visible rows on Shift+ArrowDown', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
        {id: 3, name: 'Item 3', parentId: 1},
        {id: 4, name: 'Item 4', parentId: 3},
        {id: 5, name: 'Item 5', parentId: 4},
        {id: 6, name: 'Item 6'},
      ], {datasource: 'array-http'});

      await table.row({index: 0}).clickExpansionControl();
      await table.row({index: 2}).clickExpansionControl();
      await expect(table.rows).toHaveCount(5);

      await table.row({index: 2}).click();
      await page.keyboard.press('Shift+ArrowDown');
      await page.keyboard.press('Shift+ArrowDown');
      await expectRow(table.row({index: 4})).toBeFocused();
      await expect(tablePage.selection).toHaveText('3 4 6');
    });

    test('should select only visible rows on Ctrl+a', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
        {id: 3, name: 'Item 3', parentId: 1},
        {id: 4, name: 'Item 4', parentId: 3},
        {id: 5, name: 'Item 5', parentId: 4},
        {id: 6, name: 'Item 6'},
      ], {datasource: 'array-http'});

      await table.row({index: 0}).clickExpansionControl();
      await expect(table.rows).toHaveCount(4);

      await page.keyboard.press('ControlOrMeta+A');
      await expect(tablePage.selection).toHaveText('1 2 3 6');
    });

    test('should select and scroll to selected row', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);
      await tablePage.setBufferSize(0);
      await tablePage.setRowHeight(50);
      await tablePage.setHeight(150);
      await tablePage.addColumn({name: 'column:string', type: 'string'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
        {id: 3, name: 'Item 3', parentId: 1},
        {id: 4, name: 'Item 4', parentId: 3},
        {id: 5, name: 'Item 5', parentId: 4},
        {id: 6, name: 'Item 6'},
      ], {datasource: 'array-http'});

      await tablePage.selectIds([5]);
      await expectRow(table.row({index: 4})).toBeFocused();
      await expect(table.row({index: 4}).cell({index: 0}).locator).toHaveText('Item 5');
    });
  });

  test.describe('Layout', () => {

    test('should indent nested rows according to their level', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:string', type: 'string'});
      await tablePage.addColumn({name: 'column:number', type: 'number'});
      await tablePage.setHierarchical(true);

      const chevronOffset = 21;
      const indent = chevronOffset;
      await tablePage.setCssVariable('--sci-tree-node-indent', `${indent}px`);

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
        {id: 3, name: 'Item 3', parentId: 2},
        {id: 4, name: 'Item 4', parentId: 1},
        {id: 5, name: 'Item 5'},
      ], {datasource: 'array-http'});

      await table.row({index: 0}).clickExpansionControl();
      await table.row({index: 1}).clickExpansionControl();
      await expect(table.rows).toHaveCount(5);

      const columnPadding = await table.row({index: 0}).cell('column:number').paddingInline();

      // Only the first column is indented, including for leaves without a chevron.
      await expect.poll(() => table.row({index: 0}).cell('column:string').paddingInline()).toBe(columnPadding + chevronOffset);
      await expect.poll(() => table.row({index: 0}).cell('column:number').paddingInline()).toBe(columnPadding);

      await expect.poll(() => table.row({index: 1}).cell('column:string').paddingInline()).toBe(columnPadding + indent + chevronOffset);
      await expect.poll(() => table.row({index: 1}).cell('column:number').paddingInline()).toBe(columnPadding);

      await expect.poll(() => table.row({index: 2}).cell('column:string').paddingInline()).toBe(columnPadding + 2 * indent + chevronOffset);
      await expect.poll(() => table.row({index: 2}).cell('column:number').paddingInline()).toBe(columnPadding);

      await expect.poll(() => table.row({index: 3}).cell('column:string').paddingInline()).toBe(columnPadding + indent + chevronOffset);
      await expect.poll(() => table.row({index: 3}).cell('column:number').paddingInline()).toBe(columnPadding);

      await expect.poll(() => table.row({index: 4}).cell('column:string').paddingInline()).toBe(columnPadding + chevronOffset);
      await expect.poll(() => table.row({index: 4}).cell('column:number').paddingInline()).toBe(columnPadding);
    });

    test('should indent nested rows according to their level with row icons', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.addColumn({name: 'column:string', type: 'string'});
      await tablePage.addColumn({name: 'column:number', type: 'number'});
      await tablePage.showRowIcon(true);
      await tablePage.setHierarchical(true);

      const iconOffset = 21;
      const indent = iconOffset;
      await tablePage.setCssVariable('--sci-tree-node-indent', `${indent}px`);

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
        {id: 3, name: 'Item 3', parentId: 2},
        {id: 4, name: 'Item 4', parentId: 1},
        {id: 5, name: 'Item 5'},
      ], {datasource: 'array-http'});

      await table.row({index: 0}).clickExpansionControl();
      await table.row({index: 1}).clickExpansionControl();
      await expect(table.rows).toHaveCount(5);

      const columnPadding = await table.row({index: 0}).cell('column:number').paddingInline();

      // only the first column is indented, including for leaves without a chevron.
      // column padding + spacing for 2 icons and the chevron + level indent.
      await expect.poll(() => table.row({index: 0}).cell('column:string').paddingInline()).toBe(columnPadding + 3 * iconOffset);
      await expect.poll(() => table.row({index: 0}).cell('column:number').paddingInline()).toBe(columnPadding);

      await expect.poll(() => table.row({index: 1}).cell('column:string').paddingInline()).toBe(columnPadding + 3 * iconOffset + indent);
      await expect.poll(() => table.row({index: 1}).cell('column:number').paddingInline()).toBe(columnPadding);

      await expect.poll(() => table.row({index: 2}).cell('column:string').paddingInline()).toBe(columnPadding + 3 * iconOffset + 2 * indent);
      await expect.poll(() => table.row({index: 2}).cell('column:number').paddingInline()).toBe(columnPadding);

      await expect.poll(() => table.row({index: 3}).cell('column:string').paddingInline()).toBe(columnPadding + 3 * iconOffset + indent);
      await expect.poll(() => table.row({index: 3}).cell('column:number').paddingInline()).toBe(columnPadding);

      await expect.poll(() => table.row({index: 4}).cell('column:string').paddingInline()).toBe(columnPadding + 3 * iconOffset);
      await expect.poll(() => table.row({index: 4}).cell('column:number').paddingInline()).toBe(columnPadding);
    });

    test('should pack first column correctly, when a deep child has the longest label', async ({page}) => {
      const tablePage = new TablePagePO(page);
      const table = new TablePO(tablePage.table);
      await tablePage.navigate();
      await tablePage.setHierarchical(true);

      await tablePage.addColumn({name: 'column:name', type: 'string', width: '200px'});
      await tablePage.addColumn({name: 'column:price', type: 'number'});

      await provideHttpDatasource(page, [
        {id: 1, name: 'Item 1'},
        {id: 2, name: 'Item 2', parentId: 1},
        {id: 3, name: 'Item 3', parentId: 2},
        {id: 4, name: 'Item 4', parentId: 3},
        {id: 5, name: 'Item 5, this label is very long', parentId: 4},
        {id: 6, name: 'Item 6'},
      ], {datasource: 'array-http'});

      await tablePage.expandAll();
      await expect(table.row({index: 4}).cell({index: 0}).locator).toHaveEllipsis();

      await table.column({name: 'column:name'}).splitter.dblclick();
      await expect(table.row({index: 4}).cell({index: 0}).locator).not.toHaveEllipsis();
    });
  });
});
