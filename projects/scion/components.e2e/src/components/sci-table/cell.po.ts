import {Locator} from '@playwright/test';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';
import {RowPO} from './row.po';
import {ColumnPO} from './column.po';

export class CellPO {

  constructor(public locator: Locator, public row: RowPO, public column: ColumnPO) {
  }

  public textContent(): Promise<string | null> {
    return this.locator.textContent();
  }

  public paddingInline(): Promise<number> {
    return this.locator.evaluate(cell => Number.parseFloat(getComputedStyle(cell).paddingLeft));
  }

  public textAlign(): Promise<'start' | 'end' | 'center' | 'justify'> {
    return this.locator.evaluate(cell => getComputedStyle(cell).textAlign as 'start' | 'end' | 'center' | 'justify');
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }
}
