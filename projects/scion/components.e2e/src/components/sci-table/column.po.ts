import {Locator} from '@playwright/test';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';
import {ColumnSplitterPO, TablePO} from './table.po';
import {OneOf, RequireOne} from '@scion/toolkit/types';
import {CellPO} from './cell.po';

export class ColumnPO {

  public readonly locator: Locator;
  public readonly splitter: ColumnSplitterPO;
  public readonly columnHeader: Locator;
  public readonly columnFilter: Locator;
  public readonly cells: Locator;
  public readonly sortButton: Locator;

  constructor(public table: TablePO, public locateBy: RequireOne<{name: `column:${string}`; index: number}>) {
    this.locator = table.locator.locator('sci-virtual-columns sci-column').locator(selectByColumn(locateBy));
    this.columnHeader = table.locator.locator('sci-column-header').locator(selectByColumn(locateBy));
    this.columnFilter = table.locator.locator('sci-column-filter').locator(selectByColumn(locateBy));
    this.sortButton = this.columnHeader.locator('button.e2e-sort');
    this.splitter = new ColumnSplitterPO(table.locator.locator('sci-column-splitters sci-splitter').locator(selectByColumn(locateBy)), table);
    this.cells = table.rows.locator('sci-table-cell').locator(selectByColumn(locateBy));
  }

  public cell(locateBy: OneOf<{index: number; nth: number}>): CellPO {
    const row = this.table.row(locateBy);
    return new CellPO(row.locator.locator('sci-table-cell').locator(selectByColumn(this.locateBy)), row, this);
  }

  public async width(): Promise<number> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()).width);
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public async sort(options?: {modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>}): Promise<void> {
    await this.sortButton.click({modifiers: options?.modifiers});
  }

  public async clearFilter(): Promise<void> {
    await this.columnFilter.locator('button.e2e-clear').click();
  }

  public async filter(value: string): Promise<void> {
    const input = this.columnFilter.locator('input');
    const select = this.columnFilter.locator('select');

    await Promise.race([input.waitFor({state: 'visible'}), select.waitFor({state: 'visible'})]);

    if (await input.isVisible()) {
      await input.fill(value);
    }
    else {
      await select.selectOption(value);
    }
  }

  public async sortDirection(): Promise<'asc' | 'desc' | null> {
    return (await this.sortButton.getAttribute('data-sort-direction')) as 'asc' | 'desc' | null;
  }
}

/**
 * Creates a CSS selector to match an element (column, cell) by the given column name and index.
 */
export function selectByColumn(selectBy: RequireOne<{name: `column:${string}`; index: number}>): string {
  if (selectBy.name !== undefined) {
    return `:scope[data-column="${selectBy.name}"]`;
  }
  else {
    return `:scope:nth-of-type(${selectBy.index + 1})`;
  }
}
