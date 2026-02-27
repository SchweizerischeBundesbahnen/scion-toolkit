import {Locator} from '@playwright/test';

export class CellPo {
  constructor(public locator: Locator) {
  }

  public textContent(): Promise<string | null> {
    return this.locator.textContent();
  }
}
