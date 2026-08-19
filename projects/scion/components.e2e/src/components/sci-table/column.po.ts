import {Locator} from '@playwright/test';
import {fromRect, waitUntilStable} from '../../helper/testing.utils';

export class ColumnPO {

  public readonly filterLocator: Locator;

  constructor(public locator: Locator) {
    this.filterLocator = this.locator.locator('sci-column-filter');
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
    const input = this.filterLocator.locator('input');
    const select = this.filterLocator.locator('select');

    await Promise.race([input.waitFor({state: 'visible'}), select.waitFor({state: 'visible'})]);

    if (await input.isVisible()) {
      await input.fill(value);
    }
    else {
      await select.selectOption(value);
    }
  }
}
