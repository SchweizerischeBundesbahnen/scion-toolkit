import {Locator} from '@playwright/test';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';
import {RowPO} from './row.po';
import {ColumnPO} from './column.po';

export class CellPO {

  public readonly icon: Locator;

  constructor(public locator: Locator, public row: RowPO, public column: ColumnPO) {
    this.icon = this.locator.locator('sci-icon');
  }

  public textContent(): Promise<string | null> {
    return this.locator.textContent();
  }

  public value(): Promise<string | null> {
    return this.locator.getAttribute('data-value');
  }

  public paddingInline(): Promise<number> {
    return this.locator.evaluate(cell => Number.parseFloat(getComputedStyle(cell).borderLeft));
  }

  public textAlign(): Promise<'start' | 'end' | 'center' | 'justify'> {
    return this.locator.evaluate(cell => getComputedStyle(cell).textAlign as 'start' | 'end' | 'center' | 'justify');
  }

  public lineHeight(): Promise<string> {
    return this.locator.evaluate(cell => getComputedStyle(cell).lineHeight);
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public async hover(): Promise<void> {
    await this.locator.hover();
  }
}
