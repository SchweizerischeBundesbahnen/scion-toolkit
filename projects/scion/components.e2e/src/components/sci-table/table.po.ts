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
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';

export class TablePo {

  public readonly locator: Locator;
  public readonly filters: Locator;
  public readonly sortButtons: Locator;
  public readonly splitters: Locator;
  public readonly headers: Locator;
  public readonly rows: Locator;
  public readonly viewport: Locator;
  public readonly body: Locator;

  constructor(private _page: Page) {
    this.locator = this._page.locator('sci-table');
    this.filters = this.locator.locator('sci-column-filter');
    this.sortButtons = this.locator.locator('button.e2e-column-sort.sortable');
    this.splitters = this.locator.locator('.e2e-table-splitter');
    this.headers = this.locator.locator('sci-column-header button.e2e-column-sort');
    this.rows = this.locator.locator('sci-table-row');
    this.viewport = this.locator.locator('div.e2e-viewport');
    this.body = this.locator.locator('sci-table-body');
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

  public viewportBounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.viewport.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public splitterBounds(columnName: `column:${string}`): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.locator(`.e2e-table-splitter[data-column="${columnName}"]`).boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public async dragSplitter(columnName: `column:${string}`, distance: number): Promise<void> {
    const splitterBounds = await this.splitterBounds(columnName);
    // Drag at header vcenter, because last splitter and scrollbar overlap.
    const headerBounds = fromRect(await this.headers.first().boundingBox());
    await this.locator.page().mouse.move(splitterBounds.hcenter, headerBounds.vcenter);
    await this.locator.page().mouse.down();
    await this.locator.page().mouse.move(splitterBounds.hcenter + distance, headerBounds.vcenter, {steps: 20});
    await this.locator.page().mouse.up();
  }

  public async dblclickSplitter(columnName: `column:${string}`): Promise<void> {
    await this.locator.locator(`.e2e-table-splitter[data-column="${columnName}"]`).dblclick();
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
    await this.locator.locator('div.e2e-viewport').evaluate((element, {scroll}) => {
      const x = scroll === 'right' ? element.scrollWidth : scroll.x;
      const y = scroll === 'right' ? element.scrollTop : scroll.y;
      element.scrollTo(x, y);
    }, {scroll});
  }
}
