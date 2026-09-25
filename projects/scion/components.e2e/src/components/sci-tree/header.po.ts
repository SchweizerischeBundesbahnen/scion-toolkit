import {Locator} from '@playwright/test';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';
import {ColumnHeaderPO} from './column-header.po';

export class HeaderPO {

  public readonly columnHeader: ColumnHeaderPO;

  constructor(public locator: Locator) {
    this.columnHeader = new ColumnHeaderPO(locator.locator('sci-column-header'));
  }

  public async height(): Promise<number> {
    return waitUntilStable(async () => await this.locator.boundingBox().then(bounds => bounds!.height));
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }
}
