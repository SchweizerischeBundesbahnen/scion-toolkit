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
import {fromRect} from '../../helper/testing.utils';

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

  public locateColumnHeader(header: string): Locator {
    return this.headers.locator('button.e2e-column-sort', {hasText: header});
  }

  public locateColumnFilter(columnIndex: number): Locator {
    return this.headers.nth(columnIndex).locator('sci-column-filter');
  }

  public locateColumnCells(columnIndex: number): Locator {
    return this.rows.locator('sci-table-cell').nth(columnIndex);
  }

  public locateColumnSplitter(columnIndex: number): Locator {
    return this.headers.nth(columnIndex).locator('sci-splitter');
  }

  public async clickColumnSort(columnIndex: number): Promise<void> {
    await this.headers.nth(columnIndex).locator('button.e2e-column-sort').click();
  }

  public async clearColumnFilter(columnIndex: number): Promise<void> {
    await this.locateColumnFilter(columnIndex).locator('button.e2e-clear').click();
  }

  public async enterColumnFilter(columnIndex: number, value: string): Promise<void> {
    const filter = this.locateColumnFilter(columnIndex);
    const input = filter.locator('input');
    const select = filter.locator('select');
    if (await input.isVisible()) {
      await input.fill(value);
    }
    else {
      await select.selectOption(value);
    }
  }

  public async getColumnHeaderWidth(columnIndex: number): Promise<number | undefined> {
    return this.headers.nth(columnIndex).boundingBox().then(b => b?.width);
  }

  public async dragColumnSplitter(columnIndex: number, distance: number): Promise<void> {
    const splitterBounds = fromRect(await this.locateColumnSplitter(columnIndex).boundingBox());

    await this._page.mouse.move(splitterBounds.hcenter, splitterBounds.vcenter);
    await this._page.mouse.down();
    await this._page.mouse.move(splitterBounds.hcenter + distance, splitterBounds.vcenter, {steps: 10});
    await this._page.mouse.up();
  }

  public async scrollViewPort(scroll: 'right' | {x: number; y: number}): Promise<void> {
    await this.locator.locator('div.e2e-viewport').evaluate((element, {scroll}) => {
      const {x, y} = scroll === 'right' ? {x: element.clientWidth, y: 0} : scroll;
      element.scrollTo(x, y);
    }, {scroll});
  }

  public async clickRow(rowIndex: number, modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>): Promise<void> {
    await this.rows.nth(rowIndex).click({modifiers});
  }
}
