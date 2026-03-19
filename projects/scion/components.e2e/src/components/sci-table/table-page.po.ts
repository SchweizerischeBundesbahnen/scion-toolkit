/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator, Page} from '@playwright/test';

const PATH = '/#/components/sci-table';

export class TablePagePO {

  private readonly _locator: Locator;
  private readonly _properties: Locator;
  private readonly _tabbar: Locator;

  constructor(private _page: Page) {
    this._locator = this._page.locator('app-table-page');
    this._properties = this._locator.locator('aside.e2e-properties');
    this._tabbar = this._properties.locator('sci-tabbar');
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }

  public async setFilterable(checked: boolean): Promise<void> {
    await this._tabbar.locator('button.e2e-settings').click();
    await this._properties.locator('input.e2e-filterable').setChecked(checked);
  }

  public locateFilters(): Locator {
    return this._locator.locator('sci-column-filter');
  }
}
