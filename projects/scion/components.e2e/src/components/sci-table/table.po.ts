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
import {DomRect, fromRect} from '../../helper/testing.utils';

export class TablePo {

  public readonly locator: Locator;
  public readonly filters: Locator;
  public readonly sortButtons: Locator;
  public readonly splitters: Locator;
  public readonly headers: Locator;
  public readonly rows: Locator;
  public readonly viewport: Locator;
  public readonly verticalViewport: Locator;
  public readonly rowActions: Locator;

  constructor(private _page: Page) {
    this.locator = this._page.locator('sci-table');
    this.filters = this.locator.locator('sci-column-filter');
    this.sortButtons = this.locator.locator('button.e2e-column-sort.sortable');
    this.splitters = this.locator.locator('sci-table-overlay sci-splitter');
    this.rowActions = this.locator.locator('sci-toolbar');
    this.headers = this.locator.locator('sci-column-header button.e2e-column-sort');
    this.rows = this.locator.locator('sci-table-row');
    this.viewport = this.locator.locator('div.e2e-horizontal-viewport');
    this.verticalViewport = this.locator.locator('div.e2e-vertical-viewport');
  }

  public locateColumnCells(columnIndex: number): Locator {
    return this.rows.locator(`sci-table-cell:nth-child(${columnIndex + 1})`);
  }

  public row(index: number): RowPo {
    return new RowPo(this.rows.nth(index));
  }

  public column(indexOrHeader: number | string): ColumnPo {
    return typeof indexOrHeader === 'number' ?
      new ColumnPo(this.locator.locator('sci-column-header').nth(indexOrHeader), this) :
      new ColumnPo(indexOrHeader, this);
  }

  public async splitterBounds(columnName: `column:${string}`): Promise<DomRect> {
    return fromRect(await this.locator.locator(`sci-splitter[data-column="${columnName}"]`).boundingBox());
  }

  public async dragSplitter(columnName: `column:${string}`, distance: number): Promise<void> {
    const splitterBounds = await this.splitterBounds(columnName);
    await this.locator.page().mouse.move(splitterBounds.hcenter, splitterBounds.top);
    await this.locator.page().mouse.down();
    await this.locator.page().mouse.move(splitterBounds.hcenter + distance, splitterBounds.top, {steps: 20});
    await this.locator.page().mouse.up();
  }

  public async dblclickSplitter(columnName: `column:${string}`): Promise<void> {
    await this.locator.locator(`sci-splitter[data-column="${columnName}"]`).dblclick();
  }

  public async verticalScrollThumbBounds(): Promise<DomRect> {
    return fromRect(await this.locator.locator('sci-scrollbar .thumb.vertical').boundingBox());
  }

  public async scrollVerticalWithScrollbar(distance: number): Promise<void> {
    const thumb = await this.verticalScrollThumbBounds();
    await this.locator.page().mouse.move(thumb.hcenter, thumb.vcenter);
    await this.locator.page().mouse.down();
    await this.locator.page().mouse.move(thumb.hcenter, thumb.vcenter + distance, {steps: 20});
    await this.locator.page().mouse.up();
  }

  public async scrollViewPort(scroll: 'right' | {x: number; y: number}): Promise<void> {
    await this.locator.locator('div.e2e-horizontal-viewport').evaluate((element, {scroll}) => {
      const x = scroll === 'right' ? element.scrollWidth : scroll.x;
      element.scrollTo(x, 0);
    }, {scroll});

    if (typeof scroll !== 'object') {
      return;
    }

    await this.locator.locator('div.e2e-vertical-viewport').evaluate((element, {scroll}) => {
      element.scrollTo(0, scroll.y);
    }, {scroll});
  }
}
