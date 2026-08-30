/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator, Mouse} from '@playwright/test';
import {ColumnPO} from './column.po';
import {RowPO} from './row.po';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';
import {RequireOne} from '@scion/toolkit/types';
import {HeaderPO} from './header.po';

export class TablePO {

  public readonly viewport: Locator;
  public readonly grid: Locator;
  public readonly header: HeaderPO;
  public readonly headers: Locator;
  public readonly body: Locator;
  public readonly rows: Locator;
  public readonly filters: Locator;
  public readonly sortButtons: Locator;
  public readonly verticalScrollbar: ScrollbarPO;
  public readonly horizontalScrollbar: ScrollbarPO;
  public readonly splitters: Locator;

  constructor(public readonly locator: Locator) {
    this.viewport = this.locator.locator('div.e2e-viewport');
    this.grid = this.locator.locator('sci-table-grid');
    this.header = new HeaderPO(this.locator.locator('sci-table-header'));
    this.headers = this.locator.locator('sci-column-header button.e2e-column-sort');
    this.body = this.locator.locator('sci-table-body');
    this.rows = this.locator.locator('sci-table-row');
    this.filters = this.locator.locator('sci-column-filter');
    this.sortButtons = this.locator.locator('button.e2e-column-sort.sortable');
    this.verticalScrollbar = new ScrollbarPO(this.locator.locator('sci-scrollbar[direction="vscroll"]'));
    this.horizontalScrollbar = new ScrollbarPO(this.locator.locator('sci-scrollbar[direction="hscroll"]'));
    this.splitters = this.locator.locator('sci-column-splitters');
  }

  public row(index: number): RowPO {
    return new RowPO(this.rows.nth(index));
  }

  public column(locateBy: RequireOne<{name: `column:${string}`; index: number}>): ColumnPO {
    return new ColumnPO(this, locateBy);
  }

  /**
   * Returns the bounding box without borders (content-box).
   */
  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.evaluate(element => {
      const {x, y} = element.getBoundingClientRect();
      return new DOMRect(x + element.clientLeft, y + element.clientTop, element.clientWidth, element.clientHeight);
    })), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
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

  public async scrollHeight(): Promise<number> {
    return waitUntilStable(async () => this.viewport.evaluate(viewport => viewport.scrollHeight));
  }

  public async scrollWidth(): Promise<number> {
    return waitUntilStable(async () => this.viewport.evaluate(viewport => viewport.scrollWidth));
  }
}

export class ColumnSplitterPO {

  constructor(public readonly locator: Locator, private _table: TablePO) {
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  /**
   * Drags the splitter by the specified distance.
   *
   * Use `options` to control where to grab the splitter.
   */
  public async drag(distance: number, options?: {location: 'table-header' | 'table-body'}): Promise<void> {
    const dragHandle = await this.startDrag(options);
    await dragHandle.dragTo({deltaX: distance});
    await dragHandle.release();
  }

  /**
   * Starts dragging the splitter.
   *
   * Use `options` to control where to grab the splitter.
   *
   * Use the returned drag handle to continue the drag operation.
   */
  public async startDrag(options?: {location: 'table-header' | 'table-body'}): Promise<DrageHandlePO> {
    const splitterBounds = await this.bounds();
    const x = splitterBounds.left;
    const y = Math.floor(fromRect(await (options?.location === 'table-header' ? this._table.header.locator : this._table.viewport).boundingBox()).vcenter);
    const page = this.locator.page();

    await page.mouse.move(x, y, {steps: 1});
    await page.mouse.down();

    return new DrageHandlePO(page.mouse, {x, y});
  }

  public async dblclick(): Promise<void> {
    await this.locator.dblclick();
  }
}

export class DrageHandlePO {

  private _x = 0;
  private _y = 0;

  constructor(private _mouse: Mouse, mousePosition: {x: number; y: number}) {
    this._x = mousePosition.x;
    this._y = mousePosition.y;
  }

  /**
   * Drags this tab to the specified coordinate.
   *
   * The coordinate can be either absolute or relative to the current position.
   */
  public async dragTo(to: CoordinateOrDelta, options?: {steps?: number}): Promise<void> {
    if ('x' in to) {
      this._x = to.x!;
    }
    if ('y' in to) {
      this._y = to.y!;
    }
    if ('deltaX' in to) {
      this._x += to.deltaX!;
    }
    if ('deltaY' in to) {
      this._y += to.deltaY!;
    }

    await this._mouse.move(this._x, this._y, {steps: options?.steps ?? 20});
  }

  /**
   * Performs a drop, finishing the drag operation.
   */
  public async release(): Promise<void> {
    await this._mouse.up();
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

/**
 * Represents an absolute coordinate or a delta relative to the current position.
 */
export type CoordinateOrDelta = RequireOne<{x: number; y: number}> | RequireOne<{deltaX: number; deltaY: number}>;
