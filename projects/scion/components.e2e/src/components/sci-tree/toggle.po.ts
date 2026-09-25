import {Locator} from '@playwright/test';

export class TogglePO {

  public expanded: Locator;
  public collapsed: Locator;

  constructor(public locator: Locator) {
    this.expanded = locator.locator('sci-icon.e2e-expanded');
    this.collapsed = locator.locator('sci-icon.e2e-collapsed');
  }
}
