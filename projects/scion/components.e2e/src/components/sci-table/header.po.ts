import {Locator} from '@playwright/test';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';

export class HeaderPO {

  constructor(public locator: Locator) {
  }

  public async height(): Promise<number> {
    return waitUntilStable(async () => await this.locator.boundingBox().then(bounds => bounds!.height));
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }
}
