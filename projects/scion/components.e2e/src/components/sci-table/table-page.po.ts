/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator, Page} from '@playwright/test';

const PATH = '/#/components/sci-table';

export interface ColumnOptions {
  name: string;
  header: string;
  type: 'string' | 'number' | 'boolean' | 'template' | 'component';
  customFilter?: boolean;
  filterValues?: string[];
  customSort?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
}

export class TablePagePO {

  private readonly _locator: Locator;
  private readonly _properties: Locator;
  private readonly _tabbar: Locator;

  constructor(private _page: Page) {
    this._locator = this._page.locator('app-table-page');
    this._properties = this._locator.locator('aside.e2e-properties');
    this._tabbar = this._properties.locator('sci-tabbar');
  }

  public async navigate(type: 'slow-data-source' | 'default' = 'default'): Promise<void> {
    if (type === 'slow-data-source') {
      await this._page.goto(`${PATH}/slow`);
    }
    else {
      await this._page.goto(PATH);
    }
  }

  public async setFilterable(checked: boolean): Promise<void> {
    await this._tabbar.locator('button.e2e-settings').click();
    await this._properties.locator('input.e2e-filterable').setChecked(checked);
  }

  public async setSortable(checked: boolean): Promise<void> {
    await this._tabbar.locator('button.e2e-settings').click();
    await this._properties.locator('input.e2e-sortable').setChecked(checked);
  }

  public async setResizable(checked: boolean): Promise<void> {
    await this._tabbar.locator('button.e2e-settings').click();
    await this._properties.locator('input.e2e-resizable').setChecked(checked);
  }

  public async showHeader(show: boolean): Promise<void> {
    await this._tabbar.locator('button.e2e-settings').click();
    await this._properties.locator('input.e2e-show-header').setChecked(show);
  }

  public async setHeight(height: number): Promise<void> {
    await this._tabbar.locator('button.e2e-settings').click();
    await this._properties.locator('input.e2e-height').fill(height.toString());
  }

  public async setRowSize(rowSize: number): Promise<void> {
    await this._tabbar.locator('button.e2e-settings').click();
    await this._properties.locator('input.e2e-row-size').fill(rowSize.toString());
  }

  public async addColumn(options: ColumnOptions): Promise<void> {
    await this._tabbar.locator('button.e2e-columns').click();
    await this._properties.locator('form input.e2e-column-name').fill(options.name);
    await this._properties.locator('form input.e2e-column-header').fill(options.header);
    await this._properties.locator('form select.e2e-column-type').selectOption(options.type);
    if (options.customSort) {
      await this._properties.locator('form input.e2e-column-custom-sort').check();
    }
    if (options.customFilter) {
      await this._properties.locator('form input.e2e-column-custom-filter').check();
    }
    if (options.filterValues !== undefined) {
      await this._properties.locator('form input.e2e-column-filter-values').fill(options.filterValues.join(','));
    }
    if (options.width !== undefined) {
      await this._properties.locator('form input.e2e-column-width').fill(options.width);
    }
    if (options.minWidth !== undefined) {
      await this._properties.locator('form input.e2e-column-min-width').fill(options.minWidth);
    }
    if (options.maxWidth !== undefined) {
      await this._properties.locator('form input.e2e-column-max-width').fill(options.maxWidth);
    }
    await this._properties.locator('form button.e2e-column-add').click();
  }

  public async setRowCount(rowCount: number): Promise<void> {
    await this._properties.locator('form input.e2e-row-count').fill(rowCount.toString());
  }

  public async setTableCount(tableCount: number): Promise<void> {
    await this._properties.locator('form input.e2e-table-count').fill(tableCount.toString());
  }
}
