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
import {ColumnPO} from './column.po';
import {RowPO} from './row.po';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';

export class TablePO {

  public readonly locator: Locator;
  public readonly filters: Locator;
  public readonly sortButtons: Locator;
  public readonly splitters: Locator;
  public readonly header: Locator;
  public readonly headers: Locator;
  public readonly rows: Locator;
  public readonly viewport: Locator;
  public readonly body: Locator;
  public readonly verticalScrollbar: ScrollbarPO;
  public readonly horizontalScrollbar: ScrollbarPO;

  constructor(private _page: Page) {
    this.locator = this._page.locator('sci-table');
    this.filters = this.locator.locator('sci-column-filter');
    this.sortButtons = this.locator.locator('button.e2e-column-sort.sortable');
    this.splitters = this.locator.locator('.e2e-table-splitter');
    this.header = this.locator.locator('sci-table-header');
    this.headers = this.locator.locator('sci-column-header button.e2e-column-sort');
    this.rows = this.locator.locator('sci-table-row');
    this.viewport = this.locator.locator('div.e2e-viewport');
    this.body = this.locator.locator('sci-table-body');
    this.verticalScrollbar = new ScrollbarPO(this.locator.locator('sci-scrollbar[direction="vscroll"]'));
    this.horizontalScrollbar = new ScrollbarPO(this.locator.locator('sci-scrollbar[direction="hscroll"]'));
  }

  public locateColumnCells(columnIndex: number): Locator {
    return this.rows.locator(`sci-table-cell:nth-child(${columnIndex + 1})`);
  }

  public row(index: number): RowPO {
    return new RowPO(this.rows.nth(index));
  }

  public column(indexOrHeader: number | string): ColumnPO {
    return typeof indexOrHeader === 'number' ?
      new ColumnPO(this.locator.locator('sci-column-header').nth(indexOrHeader), this) :
      new ColumnPO(indexOrHeader, this);
  }

  public bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.viewport.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  // TODO [dwie] Move to column PO
  public columnSplitter(columnName: `column:${string}`): ColumnSplitterPO {
    return new ColumnSplitterPO(this.locator.locator(`sci-column-splitters sci-splitter[data-column="${columnName}"]`), this);
  }

  public async scrollTo(scrollTo: {x?: number | 'start' | 'end'; y?: number | 'start' | 'end'}): Promise<void> {
    await this.viewport.evaluate((viewport, scroll) => {
      viewport.scrollTo({
        left: scroll.x === 'start' ? 0 : scroll.x === 'end' ? viewport.scrollWidth : scroll.x,
        top: scroll.y === 'start' ? 0 : scroll.y === 'end' ? viewport.scrollHeight : scroll.y,
      });
    }, scrollTo);
  }

  public async scrollTop(): Promise<number> {
    return waitUntilStable(async () => this.viewport.evaluate(viewport => viewport.scrollTop));
  }

  public async scrollLeft(): Promise<number> {
    return waitUntilStable(async () => this.viewport.evaluate(viewport => viewport.scrollLeft));
  }
}

export class ColumnSplitterPO {

  constructor(public readonly locator: Locator, private _table: TablePO) {
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public async drag(distance: number): Promise<void> {
    const splitterBounds = await this.bounds();
    const headerBounds = fromRect(await this._table.header.boundingBox());

    // Drag at header vcenter, because last splitter and scrollbar overlap.
    await this.locator.page().mouse.move(splitterBounds.hcenter, headerBounds.vcenter + 10);
    await this.locator.page().mouse.down();
    await this.locator.page().mouse.move(splitterBounds.hcenter + distance, headerBounds.vcenter + 10, {steps: 20});
    await this.locator.page().mouse.up();
  }

  public async dblclick(): Promise<void> {
    await this.locator.dblclick();
  }
}

export class ScrollbarPO {

  public readonly thumb: ScrollbarThumbPO;

  constructor(public readonly locator: Locator) {
    this.thumb = new ScrollbarThumbPO(locator.locator('div.e2e-thumb'));
  }

  public async scroll(distance: number): Promise<void> {
    const thumbBounds = await this.thumb.bounds();
    await this.locator.page().mouse.move(thumbBounds.hcenter, thumbBounds.vcenter);
    await this.locator.page().mouse.down();
    await this.locator.page().mouse.move(thumbBounds.hcenter, thumbBounds.vcenter + distance, {steps: 20});
    await this.locator.page().mouse.up();
  }

  public async bounds(): Promise<DomRect> {
    return fromRect(await this.locator.evaluate(element => {
      const {x, y} = element.getBoundingClientRect();
      return new DOMRect(x + element.clientLeft, y + element.clientTop, element.clientWidth, element.clientHeight);
    }));
  }
}

export class ScrollbarThumbPO {

  constructor(public readonly locator: Locator) {
  }

  public async hover(): Promise<void> {
    await this.locator.hover();
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public async width(): Promise<number> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()).width);
  }

  public async height(): Promise<number> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()).height);
  }
}
