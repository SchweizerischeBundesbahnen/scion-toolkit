/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator} from '@playwright/test';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';
import {OneOf, RequireOne} from '@scion/toolkit/types';
import {HeaderPO} from './header.po';
import {NodePO} from './node.po';

export class TreePO {

  public readonly viewport: Locator;
  public readonly grid: Locator;
  public readonly header: HeaderPO;
  public readonly body: Locator;
  public readonly nodes: Locator;
  public readonly columnFilter: Locator;
  public readonly sortButton: Locator;
  public readonly verticalScrollbar: ScrollbarPO;
  public readonly horizontalScrollbar: ScrollbarPO;
  public readonly noRowsMessage: Locator;

  constructor(public readonly locator: Locator) {
    this.viewport = this.locator.locator('div.e2e-viewport');
    this.grid = this.locator.locator('sci-table-grid');
    this.header = new HeaderPO(this.locator.locator('sci-table-header'));
    this.body = this.locator.locator('sci-table-body');
    this.nodes = this.locator.locator('sci-table-row');
    this.columnFilter = this.locator.locator('sci-column-filter');
    this.sortButton = this.locator.locator('button.e2e-sort');
    this.verticalScrollbar = new ScrollbarPO(this.locator.locator('sci-scrollbar[direction="vscroll"]'));
    this.horizontalScrollbar = new ScrollbarPO(this.locator.locator('sci-scrollbar[direction="hscroll"]'));
    this.noRowsMessage = this.locator.locator('span.e2e-no-rows');
  }

  /**
   * Locates a node by its dataset index (`index`) or rendered DOM position (`nth`), both zero-based.
   */
  public node(locateBy: OneOf<{index: number; nth: number}>): NodePO {
    if (locateBy.index !== undefined) {
      return new NodePO(this.nodes.locator(`:scope[data-row-index="${locateBy.index}"]`));
    }
    else {
      return new NodePO(this.nodes.nth(locateBy.nth));
    }
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

  public async filter(value: string): Promise<void> {
    await this.columnFilter.locator('input').fill(value);
  }

  public async clearFilter(): Promise<void> {
    await this.columnFilter.locator('button.e2e-clear').click();
  }

  public async sort(options?: {modifiers?: Array<'Alt' | 'Control' | 'ControlOrMeta' | 'Meta' | 'Shift'>}): Promise<void> {
    await this.sortButton.click({modifiers: options?.modifiers});
  }

  public async sortDirection(): Promise<'asc' | 'desc' | null> {
    return (await this.sortButton.getAttribute('data-sort-direction')) as 'asc' | 'desc' | null;
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
