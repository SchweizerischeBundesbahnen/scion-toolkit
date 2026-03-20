import {expect, Locator, Page} from '@playwright/test';
import {fromRect} from '../../helper/testing.utils';

export class TablePo {

  public readonly locator: Locator;

  constructor(private _page: Page) {
    this.locator = this._page.locator('sci-table');
  }

  public locateFilters(): Locator {
    return this.locator.locator('sci-column-filter');
  }

  public locateSortButtons(): Locator {
    return this.locator.locator('button.e2e-column-sort.sortable');
  }

  public locateSplitters(): Locator {
    return this.locator.locator('sci-column-header sci-splitter');
  }

  public locateColumnHeaders(): Locator {
    return this.locator.locator('sci-column-header');
  }

  public locateColumnHeader(header: string): Locator {
    return this.locator.locator('sci-column-header button.e2e-column-sort', {hasText: header});
  }

  public locateColumnFilter(columnIndex: number): Locator {
    return this.locator.locator(`sci-column-header:nth-child(${columnIndex + 1}) sci-column-filter`);
  }

  public locateColumnCells(columnIndex: number, options?: {hasText: string | RegExp}): Locator {
    return this.locator.locator(`sci-table-row sci-table-cell:nth-child(${columnIndex + 1})`, options);
  }

  public locateColumnSplitter(columnIndex: number): Locator {
    return this.locator.locator(`sci-column-header:nth-child(${columnIndex + 1}) sci-splitter`);
  }

  public async clickColumnSort(header: string): Promise<void> {
    await this.locateColumnHeader(header).click();
  }

  public async clearColumnFilter(columnIndex: number): Promise<void> {
    await this.locateColumnFilter(columnIndex).locator('button.e2e-clear').click();
  }

  public async enterColumnFilter(columnIndex: number, value: string): Promise<void> {
    const filter = this.locateColumnFilter(columnIndex);
    const input = filter.locator('input');
    const select = filter.locator('select');
    if (await input.isVisible()) {
      await input.fill(value);
    }
    else {
      await select.selectOption(value);
    }
  }

  public async getColumnHeaderWidth(columnIndex: number): Promise<number> {
    return fromRect(await this.locator.locator(`sci-column-header:nth-child(${columnIndex + 1})`).boundingBox()).width;
  }

  public async dragColumnSplitter(columnIndex: number, distance: number): Promise<void> {
    const splitterBounds = fromRect(await this.locateColumnSplitter(columnIndex).boundingBox());

    await this._page.mouse.move(splitterBounds.hcenter, splitterBounds.vcenter);
    await this._page.mouse.down();
    await this._page.mouse.move(splitterBounds.hcenter + distance, splitterBounds.vcenter, {steps: 10});
    await this._page.mouse.up();
  }

  public async scrollViewPort(scroll: 'right' | {x: number; y: number}): Promise<void> {
    await this.locator.locator('div.e2e-viewport').evaluate((element, {scroll}) => {
      const {x, y} = scroll === 'right' ? {x: element.clientWidth, y: 0} : scroll;
      element.scrollTo(x, y);
    }, {scroll});
  }
}
