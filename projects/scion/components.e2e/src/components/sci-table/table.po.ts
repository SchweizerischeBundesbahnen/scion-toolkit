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
import {OneOf, RequireOne} from '@scion/toolkit/types';
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
  public readonly activeRowOutline: Locator;
  public readonly noRowsMessage: Locator;

  constructor(public readonly locator: Locator) {
    this.viewport = this.locator.locator('sci-table-viewport');
    this.grid = this.locator.locator('sci-table-grid');
    this.header = new HeaderPO(this.locator.locator('sci-table-header'));
    this.headers = this.locator.locator('sci-column-header button.e2e-sort');
    this.body = this.locator.locator('sci-table-body');
    this.rows = this.locator.locator('sci-table-row');
    this.filters = this.locator.locator('sci-column-filter');
    this.sortButtons = this.locator.locator('button.e2e-sort');
    this.verticalScrollbar = new ScrollbarPO(this.locator.locator('sci-scrollbar[direction="vscroll"]'));
    this.horizontalScrollbar = new ScrollbarPO(this.locator.locator('sci-scrollbar[direction="hscroll"]'));
    this.splitters = this.locator.locator('sci-column-splitters');
    this.activeRowOutline = this.locator.locator('div.e2e-active-row-outline');
    this.noRowsMessage = this.locator.locator('span.e2e-no-rows');
  }

  /**
   * Locates a row by its dataset index (`index`) or rendered DOM position (`nth`), both zero-based.
   */
  public row(locateBy: OneOf<{index: number; nth: number; active: true}>): RowPO {
    if (locateBy.index !== undefined) {
      return new RowPO(this, this.rows.locator(`:scope[data-row-index="${locateBy.index}"]`));
    }
    if (locateBy.nth !== undefined) {
      return new RowPO(this, this.rows.nth(locateBy.nth));
    }
    else {
      return new RowPO(this, this.rows.locator(`:scope[data-active]`));
    }
  }

  public column(locateBy: RequireOne<{name: `column:${string}`; index: number}>): ColumnPO {
    return new ColumnPO(this, locateBy);
  }

  /**
   * Returns the bounding box without borders (content-box).
   */
  public async bounds(options?: {box?: 'content' | 'border'}): Promise<DomRect> {
    if (options?.box === 'border') {
      return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
    }
    return waitUntilStable(async () => fromRect(await this.locator.evaluate(element => {
      const {x, y} = element.getBoundingClientRect();
      const computedStyle = getComputedStyle(element);
      const paddingTop = Number.parseFloat(computedStyle.paddingTop);
      const paddingRight = Number.parseFloat(computedStyle.paddingRight);
      const paddingBottom = Number.parseFloat(computedStyle.paddingBottom);
      const paddingLeft = Number.parseFloat(computedStyle.paddingLeft);

      return new DOMRect(
        x + element.clientLeft + paddingLeft,
        y + element.clientTop + paddingTop,
        element.clientWidth - paddingLeft - paddingRight,
        element.clientHeight - paddingTop - paddingBottom,
      );
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

  public readonly handle: Locator;

  constructor(public readonly locator: Locator, private _table: TablePO) {
    this.handle = locator.locator('div.e2e-handle');
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public async handleBounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.handle.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  /**
   * Drags the splitter by the specified distance.
   *
   * Use `options` to control where to grab the splitter.
   */
  public async drag(distance: CoordinateOrDelta, options?: {location: 'table-header' | 'table-body'}): Promise<void> {
    const dragHandle = await this.startDrag(options);
    await dragHandle.dragTo(distance);
    await dragHandle.release();
  }

  /**
   * Hovers the splitter.
   *
   * Use `options` to control where to hover the splitter. Defaults to `table-body`.
   */
  public async hover(options?: {location?: 'table-header' | 'table-body'}): Promise<{x: number; y: number}> {
    const splitterBounds = await this.bounds();
    const x = splitterBounds.left;
    const y = Math.floor(fromRect(await (options?.location === 'table-header' ? this._table.header.locator : this._table.viewport).boundingBox()).vcenter);
    await this.locator.page().mouse.move(x, y, {steps: 1});
    return {x, y};
  }

  /**
   * Starts dragging the splitter.
   *
   * Use `options` to control where to grab the splitter. Defaults to `table-body`.
   *
   * Use the returned drag handle to continue the drag operation.
   */
  public async startDrag(options?: {location?: 'table-header' | 'table-body'}): Promise<DrageHandlePO> {
    const {x, y} = await this.hover({location: options?.location});

    const page = this.locator.page();
    await page.mouse.down();

    return new DrageHandlePO(page.mouse, {x, y});
  }

  public async dblclick(): Promise<void> {
    await this.locator.dblclick();
  }

  /**
   * Determines the current display mode of the splitter.
   *
   * @returns `column-header-divider` if rendered as a column header divider while spanning the full table viewport height for resizing the column.
   * @returns `column-splitter` if rendered as a column splitter spanning the full table viewport height.
   * @returns `hidden` if the splitter is not visible.
   */
  public async getDisplayMode(): Promise<'column-header-divider' | 'column-splitter' | 'hidden'> {
    if (!await this.handle.isVisible()) {
      return 'hidden';
    }

    // Ensure splitter spans the full table viewport height.
    const splitterBounds = await this.bounds();
    const tableViewportBounds = fromRect(await this._table.viewport.boundingBox());
    if (tableViewportBounds.height !== splitterBounds.height) {
      throw Error('[PageObjectError] Splitter expected to span full table viewport height.');
    }

    // Check if rendered as column header divider.
    const tableHeaderBounds = await this._table.header.locator.isVisible() ? await this._table.header.bounds() : null;
    const splitterHandleBounds = await this.handleBounds();
    if (tableHeaderBounds && splitterHandleBounds.top > tableHeaderBounds.top && splitterHandleBounds.bottom < tableHeaderBounds.bottom) {
      return 'column-header-divider';
    }

    // Check if rendered as full column splitter.
    if (splitterHandleBounds.height >= tableViewportBounds.height - (tableHeaderBounds?.height ?? 0)) {
      return 'column-splitter';
    }

    throw Error('[PageObjectError] Cannot determine column splitter display mode.');
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
