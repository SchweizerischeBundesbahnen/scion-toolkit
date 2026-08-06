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
import {DomRect, fromRect, waitUntilAngularStable, waitUntilStable} from '../../helper/testing.utils';

const PATH = '/#/components/sci-scrollbar';

export class ScrollbarPagePO {

  public readonly locator: Locator;
  public readonly shadowDomViewport: ViewportPO;
  public readonly lightDomViewport: ViewportPO;
  public readonly verticalOverflow: Locator;
  public readonly horizontalOverflow: Locator;

  constructor(private _page: Page) {
    this.locator = this._page.locator('app-scrollbar-page');
    this.shadowDomViewport = new ViewportPO(this.locator.locator('> app-shadow-dom-viewport'));
    this.lightDomViewport = new ViewportPO(this.locator.locator('> app-light-dom-viewport'));
    this.verticalOverflow = this.locator.locator('input[type="checkbox"].e2e-vertical-viewport-overflow');
    this.horizontalOverflow = this.locator.locator('input[type="checkbox"].e2e-horizontal-viewport-overflow');
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }

  public async setOverflow(overflow: {vertical?: boolean; horizontal?: boolean}): Promise<void> {
    await (overflow.vertical ? this.verticalOverflow.check() : this.verticalOverflow.uncheck());
    await (overflow.horizontal ? this.horizontalOverflow.check() : this.horizontalOverflow.uncheck());
    await waitUntilAngularStable(this._page);
  }
}

export class ViewportPO {

  public readonly verticalScrollbar: ScrollbarPO;
  public readonly horizontalScrollbar: ScrollbarPO;
  public readonly viewport: Locator;

  constructor(public readonly locator: Locator) {
    this.viewport = this.locator.locator('div.e2e-viewport');
    this.verticalScrollbar = new ScrollbarPO(this.locator.locator('> sci-scrollbar[direction="vscroll"]'));
    this.horizontalScrollbar = new ScrollbarPO(this.locator.locator('> sci-scrollbar[direction="hscroll"]'));
  }

  public async hover(): Promise<void> {
    await this.locator.hover();
  }

  public async moveMouseOutsideViewport(): Promise<void> {
    const viewportBounds = fromRect(await this.locator.boundingBox());
    await this.locator.page().mouse.move(viewportBounds.right + 10, viewportBounds.bottom + 10);
  }
}

export class ScrollbarPO {

  public readonly thumb: ThumbPO;

  constructor(public readonly locator: Locator) {
    this.thumb = new ThumbPO(locator.locator('div.e2e-thumb'));
  }
}

export class ThumbPO {

  constructor(public readonly locator: Locator) {
  }

  public async hover(): Promise<void> {
    await this.locator.hover();
  }

  public async boundingBox(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public async width(): Promise<number> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()).width);
  }
}
