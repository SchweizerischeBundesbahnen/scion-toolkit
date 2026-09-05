import {Locator} from '@playwright/test';
import {CellPO} from './cell.po';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';
import {RequireOne} from '@scion/toolkit/types';
import {selectByColumn} from './column.po';

export class RowPO {
  public rowActions: Locator;

  constructor(public locator: Locator) {
    this.rowActions = this.locator.locator('sci-toolbar');
  }

  public cell(columnName: `column:${string}`): CellPO;
  public cell(columnIndex: number): CellPO;
  public cell(locateBy: RequireOne<{name: `column:${string}`; index: number}>): CellPO;
  public cell(column: `column:${string}` | number | RequireOne<{name: `column:${string}`; index: number}>): CellPO {
    const locateBy = typeof column === 'number' ? {index: column} : typeof column === 'string' ? {name: column} : column;
    return new CellPO(this.locator.locator('sci-table-cell').locator(selectByColumn(locateBy)));
  }

  public async click(modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>): Promise<void> {
    await this.locator.click({modifiers});
  }

  public async hover(): Promise<void> {
    const bounds = await this.bounds();
    await this.locator.page().mouse.move(bounds.left, bounds.vcenter);
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public async rowActionsBounds(): Promise<DomRect> {
    return fromRect(await this.rowActions.boundingBox());
  }
}
