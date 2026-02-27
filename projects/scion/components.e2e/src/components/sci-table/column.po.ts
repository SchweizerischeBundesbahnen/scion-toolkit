import {Locator} from '@playwright/test';
import {TablePo} from './table.po';
import {fromRect} from '../../helper/testing.utils';

export class ColumnPo {
  public locator: Locator;
  public filterLocator: Locator;

  constructor(locatorOrHeader: Locator | string, table: TablePo) {
    this.locator = typeof locatorOrHeader === 'string' ?
      table.locator.locator('sci-column-header', {hasText: locatorOrHeader}) :
      locatorOrHeader;
    this.filterLocator = this.locator.locator('sci-column-filter');
  }

  public async sort(): Promise<void> {
    await this.locator.locator('button.e2e-column-sort').click();
  }

  public async clearFilter(): Promise<void> {
    await this.locator.locator('button.e2e-clear').click();
  }

  public async filter(value: string): Promise<void> {
    const input = this.filterLocator.locator('input');
    const select = this.filterLocator.locator('select');
    if (await input.isVisible()) {
      await input.fill(value);
    }
    else {
      await select.selectOption(value);
    }
  }

  public async getHeaderWidth(): Promise<number | undefined> {
    return this.locator.boundingBox().then(b => b?.width);
  }

  public async dragSplitter(distance: number): Promise<void> {
    const splitterBounds = fromRect(await this.locator.locator('sci-splitter').boundingBox());

    await this.locator.page().mouse.move(splitterBounds.hcenter, splitterBounds.vcenter);
    await this.locator.page().mouse.down();
    await this.locator.page().mouse.move(splitterBounds.hcenter + distance, splitterBounds.vcenter, {steps: 10});
    await this.locator.page().mouse.up();
  }

  public async dblclickSplitter(): Promise<void> {
    await this.locator.locator('sci-splitter').dblclick();
  }
}
