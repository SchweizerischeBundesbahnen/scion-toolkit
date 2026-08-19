import {Locator} from '@playwright/test';
import {fromRect, waitUntilStable} from '../../helper/testing.utils';
import {ColumnSplitterPO, TablePO} from './table.po';
import {RequireOne} from '@scion/toolkit/types';

export class ColumnPO {

  public readonly filterField: Locator;
  public readonly splitter: ColumnSplitterPO;
  public readonly locator: Locator;
  public readonly cells: Locator;

  constructor(table: TablePO, locateBy: RequireOne<{name: `column:${string}`; index: number}>) {
    this.locator = table.locator.locator('sci-column-header').locator(selectByColumn(locateBy));
    this.splitter = new ColumnSplitterPO(table.locator.locator('sci-column-splitters sci-splitter').locator(selectByColumn(locateBy)), table);
    this.filterField = this.locator.locator('sci-column-filter');
    this.cells = table.rows.locator('sci-table-cell').locator(selectByColumn(locateBy));
  }

  public async width(): Promise<number> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()).width);
  }

  public async sort(): Promise<void> {
    await this.locator.locator('button.e2e-column-sort').click();
  }

  public async clearFilter(): Promise<void> {
    await this.locator.locator('button.e2e-clear').click();
  }

  public async filter(value: string): Promise<void> {
    const input = this.filterField.locator('input');
    const select = this.filterField.locator('select');

    await Promise.race([input.waitFor({state: 'visible'}), select.waitFor({state: 'visible'})]);

    if (await input.isVisible()) {
      await input.fill(value);
    }
    else {
      await select.selectOption(value);
    }
  }
}

/**
 * Creates a CSS selector to match an element (column, cell) by the given column name and index.
 */
export function selectByColumn(selectBy: RequireOne<{name: `column:${string}`; index: number}>): string {
  if (selectBy.name !== undefined) {
    return `:scope[data-column="${selectBy.name}"]`;
  }
  if (selectBy.index !== undefined) {
    return `:scope:nth-child(${selectBy.index + 1})`;
  }
  return ':scope';
}
