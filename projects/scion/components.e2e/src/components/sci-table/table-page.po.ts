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

export class TablePagePO {

  public readonly locator: Locator;
  public readonly properties: Locator;
  public readonly tabbar: Locator;

  public readonly table: Locator;
  public readonly selectedItems: Locator;

  constructor(private _page: Page) {
    this.locator = this._page.locator('app-table-page');
    this.properties = this.locator.locator('aside.e2e-properties');
    this.tabbar = this.properties.locator('sci-tabbar');
    this.table = this.locator.locator('sci-table');
    this.selectedItems = this.properties.locator('dd.e2e-selected-items');
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }

  public async setSlowDataSource(checked: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-slow-datasource').setChecked(checked);
  }

  public async setFilterable(checked: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-filterable').setChecked(checked);
  }

  public async setSortable(checked: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-sortable').setChecked(checked);
  }

  public async setResizable(checked: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-resizable').setChecked(checked);
  }

  public async setSelectable(selectable: false | 'single' | 'multi'): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('select.e2e-selectable').selectOption(selectable === false ? 'false' : selectable);
  }

  public async showHeader(show: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-show-header').setChecked(show);
  }

  public async setHeight(height: number): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-height').fill(height.toString());
  }

  public async setWidth(width: number): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-width').fill(width.toString());
  }

  public async setRowSize(rowSize: number): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-row-size').fill(rowSize.toString());
  }

  public async setRowCount(rowCount: number): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('form input.e2e-row-count').fill(rowCount.toString());
  }

  public async setRowActions(checked: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-row-actions').setChecked(checked);
  }

  public async setTableCount(tableCount: number): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('form input.e2e-table-count').fill(tableCount.toString());
  }

  public async conditionallyStyleRow(): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('form input.e2e-conditional-style').check();
  }

  public async addColumn(options: ColumnOptions): Promise<void> {
    await this.tabbar.locator('button.e2e-columns').click();
    await this.properties.locator('form input.e2e-column-name').fill(options.name ?? '');
    await this.properties.locator('form input.e2e-column-header').fill(options.header ?? '');
    await this.properties.locator('form select.e2e-column-type').selectOption(options.type);
    if (options.customSort) {
      await this.properties.locator('form input.e2e-column-custom-sort').check();
    }
    if (options.customFilter) {
      await this.properties.locator('form input.e2e-column-custom-filter').check();
    }
    if (options.width !== undefined) {
      await this.properties.locator('form input.e2e-column-width').fill(options.width);
    }
    if (options.minWidth !== undefined) {
      await this.properties.locator('form input.e2e-column-min-width').fill(options.minWidth.toString());
    }
    if (options.maxWidth !== undefined) {
      await this.properties.locator('form input.e2e-column-max-width').fill(options.maxWidth.toString());
    }
    await this.properties.locator('form button.e2e-column-add').click();
  }
}

export interface ColumnOptions {
  name?: `column:${string}`;
  header?: string;
  type: 'string' | 'number' | 'boolean' | 'template' | 'component';
  customFilter?: boolean;
  customSort?: boolean;
  width?: string;
  minWidth?: number;
  maxWidth?: number;
}
