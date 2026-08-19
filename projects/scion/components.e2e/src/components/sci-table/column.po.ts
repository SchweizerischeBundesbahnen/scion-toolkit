import {Locator} from '@playwright/test';
import {fromRect, waitUntilStable} from '../../helper/testing.utils';
import {ColumnSplitterPO, TablePO} from './table.po';
import {RequireOne} from '@scion/toolkit/types';

export class ColumnPO {

  public readonly filterField: Locator;
  public readonly splitter: ColumnSplitterPO;
  public readonly locator: Locator;

  constructor(table: TablePO, locateBy: RequireOne<{name: `column:${string}`; index: number}>) {
    this.locator = locate(table.locator.locator('sci-column-header'), locateBy);
    this.splitter = new ColumnSplitterPO(locate(table.locator.locator('sci-column-splitters sci-splitter'), locateBy), table);
    this.filterField = this.locator.locator('sci-column-filter');
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

function locate(locator: Locator, locateBy: RequireOne<{name: `column:${string}`; index: number}>): Locator {
  if (locateBy.name !== undefined) {
    locator = locator.locator(`:scope[data-column="${locateBy.name}"]`);
  }
  if (locateBy.index !== undefined) {
    locator = locator.nth(locateBy.index);
  }
  return locator;
}
