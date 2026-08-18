import {Locator} from '@playwright/test';

export class CellPO {

  constructor(public locator: Locator) {
  }

  public textContent(): Promise<string | null> {
    return this.locator.textContent();
  }

  public paddingInline(): Promise<number> {
    return this.locator.evaluate(cell => Number.parseFloat(getComputedStyle(cell).paddingLeft));
  }
}
