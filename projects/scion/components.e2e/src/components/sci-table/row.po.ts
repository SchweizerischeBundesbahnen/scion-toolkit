import {Locator} from '@playwright/test';
import {CellPO} from './cell.po';
import {DomRect, fromRect} from '../../helper/testing.utils';

export class RowPO {
  public cells: Locator;
  public rowActions: Locator;

  constructor(public locator: Locator) {
    this.cells = this.locator.locator('sci-table-cell');
    this.rowActions = this.locator.locator('sci-toolbar');
  }

  public cell(index: number): CellPO {
    return new CellPO(this.cells.nth(index));
  }

  public async click(modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>): Promise<void> {
    await this.locator.click({modifiers});
  }

  public async hover(): Promise<void> {
    const bounds = await this.bounds();
    await this.locator.page().mouse.move(bounds.left, bounds.vcenter);
  }

  public async bounds(): Promise<DomRect> {
    return fromRect(await this.locator.boundingBox());
  }

  public async rowActionsBounds(): Promise<DomRect> {
    return fromRect(await this.rowActions.boundingBox());
  }
}
