/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator, Page} from '@playwright/test';

const PATH = '/#/components/sci-viewport/hover';

export class ViewportHoverPagePO {

  private readonly _locator: Locator;
  private readonly _verticalViewportLocator: Locator;
  private readonly _horizontalViewportLocator: Locator;

  constructor(private _page: Page) {
    this._locator = _page.locator('app-viewport-hover-page');
    this._verticalViewportLocator = this._locator.locator('> sci-viewport.e2e-vertical-viewport');
    this._horizontalViewportLocator = this._locator.locator('> sci-viewport.e2e-horizontal-viewport');
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }

  public async moveMouseOverViewport(selector: {viewport: 'vertical' | 'horizontal'}): Promise<void> {
    const viewportBounds = (await this.locateViewport(selector.viewport).boundingBox())!;
    await this._page.mouse.move(viewportBounds.x + viewportBounds.width / 2, viewportBounds.y + viewportBounds.height / 2);
  }

  public async moveMouseOutsideViewport(selector: {viewport: 'vertical' | 'horizontal'}): Promise<void> {
    const viewportBounds = (await this.locateViewport(selector.viewport).boundingBox())!;
    await this._page.mouse.move(viewportBounds.x + viewportBounds.width + 10, viewportBounds.y + viewportBounds.height + 10);
  }

  private locateViewport(selector: 'vertical' | 'horizontal'): Locator {
    return selector === 'vertical' ? this._verticalViewportLocator : this._horizontalViewportLocator;
  }

  public locateScrollbar(selector: {viewport: 'vertical' | 'horizontal'; scrollbar: 'vertical' | 'horizontal'}): Locator {
    const viewport = this.locateViewport(selector.viewport);
    return viewport.locator(`> sci-scrollbar.e2e-${selector.scrollbar}`);
  }
}
