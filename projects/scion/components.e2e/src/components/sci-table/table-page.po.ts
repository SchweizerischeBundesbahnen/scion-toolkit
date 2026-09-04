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
import {SciColumnType} from '@scion/components/table';

const PATH = '/#/components/sci-table';

export class TablePagePO {

  public readonly locator: Locator;
  public readonly properties: Locator;
  public readonly tableState: Locator;
  public readonly tabbar: Locator;

  public readonly table: Locator;
  public readonly selectionCount: Locator;

  constructor(public page: Page) {
    this.locator = this.page.locator('app-table-page');
    this.properties = this.locator.locator('aside.e2e-properties');
    this.tableState = this.properties.locator('section.e2e-table-state ');
    this.tabbar = this.properties.locator('sci-tabbar');
    this.table = this.locator.locator('sci-table');
    this.selectionCount = this.tableState.locator('output.e2e-selection-count');
  }

  public async navigate(options?: {tableStorage?: true}): Promise<void> {
    if (options?.tableStorage) {
      await this.page.goto(`?sci-table-storage${PATH.substring(1)}`);
    }
    else {
      await this.page.goto(PATH);
    }
  }

  public async reload(options?: {tableStorage?: true}): Promise<void> {
    // Do not use `Page.reload()` to preserve options.
    await this.page.goto('about:blank').then(() => this.navigate(options));
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

  public async showHeader(showHeader: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-show-header').setChecked(showHeader);
  }

  public async showGridlines(showGridlines: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-show-gridlines').setChecked(showGridlines);
  }

  public async setHeight(height: number): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-height').fill(height.toString());
  }

  public async setWidth(width: number): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-width').fill(width.toString());
  }

  public async setRowHeight(rowHeight: number): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-row-height').fill(rowHeight.toString());
  }

  public async setRowCount(rowCount: number): Promise<void> {
    await this.tabbar.locator('button.e2e-datasource').click();
    await this.properties.locator('input.e2e-row-count').fill(rowCount.toString());
  }

  public async setBufferSize(bufferSize: number): Promise<void> {
    await this.tabbar.locator('button.e2e-datasource').click();
    await this.properties.locator('input.e2e-buffer-size').fill(bufferSize.toString());
  }

  public async setPageSize(pageSize: number): Promise<void> {
    await this.tabbar.locator('button.e2e-datasource').click();
    await this.properties.locator('input.e2e-page-size').fill(pageSize.toString());
  }

  public async setDatasource(datasource: 'array' | 'array-http' | 'loader' | 'loader-delayed' | 'loader-http'): Promise<void> {
    await this.tabbar.locator('button.e2e-datasource').click();
    await this.properties.locator('select.e2e-datasource').selectOption(datasource);
  }

  public async showRowActions(checked: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-row-actions').setChecked(checked);
  }

  public async setTableCount(tableCount: number): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-table-count').fill(tableCount.toString());
  }

  public async setCustomRowStyling(customRowStyling: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-settings').click();
    await this.properties.locator('input.e2e-custom-row-styling').setChecked(customRowStyling);
  }

  public async setColumnVisible(column: `column:${string}`, visible: boolean): Promise<void> {
    await this.tabbar.locator('button.e2e-columns').click();
    await this.properties.locator(`input.e2e-column-visibility[data-column="${column}"]`).setChecked(visible);
  }

  public async addColumn(options: ColumnOptions): Promise<void> {
    await this.tabbar.locator('button.e2e-columns').click();
    await this.properties.locator('input.e2e-column-name').fill(options.name ?? '');
    await this.properties.locator('input.e2e-column-label').fill(options.label ?? options.name ?? '');
    await this.properties.locator('select.e2e-column-type').selectOption(options.type);
    await this.properties.locator('input.e2e-resizable').setChecked(options.resizable ?? true);
    await this.properties.locator('input.e2e-column-custom-sort').setChecked(!!options.customSort);
    await this.properties.locator('input.e2e-column-custom-filter').setChecked(!!options.customFilter);
    await this.properties.locator('input.e2e-column-width').fill(options.width ?? '');
    await this.properties.locator('input.e2e-column-min-width').fill(`${options.minWidth ?? ''}`);
    await this.properties.locator('button.e2e-column-add').click();
  }

  public async setCssVariable(name: `--${string}`, value: string): Promise<void> {
    await this.locator.evaluate((page, variable: {name: string; value: string}): void => {
      page.style.setProperty(variable.name, variable.value);
    }, {name, value});
  }
}

export interface ColumnOptions {
  name: `column:${string}`;
  label?: string;
  type: SciColumnType;
  resizable?: boolean;
  customFilter?: boolean;
  customSort?: boolean;
  width?: string;
  minWidth?: number;
}
