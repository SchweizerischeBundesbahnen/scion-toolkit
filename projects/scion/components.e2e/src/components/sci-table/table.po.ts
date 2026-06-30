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
import {ColumnPo} from './column.po';
import {RowPo} from './row.po';

export class TablePo {

  public readonly locator: Locator;
  public readonly filters: Locator;
  public readonly sortButtons: Locator;
  public readonly splitters: Locator;
  public readonly headers: Locator;
  public readonly rows: Locator;
  public readonly viewport: Locator;

  constructor(private _page: Page) {
    this.locator = this._page.locator('sci-table');
    this.filters = this.locator.locator('sci-column-filter');
    this.sortButtons = this.locator.locator('button.e2e-column-sort.sortable');
    this.splitters = this.locator.locator('sci-column-header sci-splitter');
    this.headers = this.locator.locator('sci-column-header');
    this.rows = this.locator.locator('sci-table-row');
    this.viewport = this.locator.locator('div.e2e-viewport');
  }

  public locateColumnCells(columnIndex: number): Locator {
    return this.rows.locator(`sci-table-cell:nth-child(${columnIndex + 1})`);
  }

  public row(index: number): RowPo {
    return new RowPo(this.rows.nth(index));
  }

  public async firstVisibleRow(): Promise<RowPo> {
    const rows = await this.rows.all();
    for (let i = 0; i < rows.length; i++) {
      if (await rows[i]!.isVisible()) {
        return new RowPo(this.rows.nth(i));
      }
    }

    throw new Error('No visible row found');
  }

  public column(indexOrHeader: number | string): ColumnPo {
    return typeof indexOrHeader === 'number' ?
      new ColumnPo(this.headers.nth(indexOrHeader), this) :
      new ColumnPo(indexOrHeader, this);
  }

  public async scrollViewPort(scroll: 'right' | {x: number; y: number}): Promise<void> {
    await this.locator.locator('div.e2e-viewport').evaluate((element, {scroll}) => {
      const {x, y} = scroll === 'right' ? {x: element.clientWidth, y: 0} : scroll;
      element.scrollTo(x, y);
    }, {scroll});
  }
}
