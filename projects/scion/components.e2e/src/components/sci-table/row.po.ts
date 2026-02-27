import {Locator} from '@playwright/test';
import {CellPo} from './cell.po';

export class RowPo {
  public cells: Locator;

  constructor(public locator: Locator) {
    this.cells = this.locator.locator('sci-table-cell');
  }

  public cell(index: number): CellPo {
    return new CellPo(this.cells.nth(index));
  }

  public async click(modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>): Promise<void> {
    await this.locator.click({modifiers});
  }
}
