import {Locator} from '@playwright/test';
import {CellPo} from './cell.po';
import {DomRect, fromRect} from '../../helper/testing.utils';

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

  public async hover(): Promise<void> {
    await this.locator.hover();
  }

  public async bounds(): Promise<DomRect> {
    return fromRect(await this.locator.boundingBox());
  }
}
