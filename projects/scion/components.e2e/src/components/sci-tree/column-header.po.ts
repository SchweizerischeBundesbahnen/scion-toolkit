import {Locator} from '@playwright/test';

export class ColumnHeaderPO {

  public readonly label: Locator;

  constructor(public locator: Locator) {
    this.label = locator.locator('span.e2e-label');
  }
}
