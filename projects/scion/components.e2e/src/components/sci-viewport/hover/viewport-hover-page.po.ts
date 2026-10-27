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

const PATH = '/#/components/sci-viewport/hover';

export class ViewportHoverPagePO {

  private readonly _locator: Locator;

  public readonly viewport: Locator;
  public readonly verticalScrollbar: Locator;
  public readonly horizontalScrollbar: Locator;
  public readonly verticalScrollThumb: Locator;
  public readonly horizontalScrollThumb: Locator;

  constructor(private _page: Page) {
    this._locator = _page.locator('app-viewport-hover-page');
    this.viewport = this._locator.locator('sci-viewport');
    this.verticalScrollbar = this.viewport.locator('sci-scrollbar[direction="vscroll"]');
    this.horizontalScrollbar = this.viewport.locator('sci-scrollbar[direction="hscroll"]');
    this.verticalScrollThumb = this.verticalScrollbar.locator('div.e2e-thumb');
    this.horizontalScrollThumb = this.horizontalScrollbar.locator('div.e2e-thumb');
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }

  public async setVerticalOverflow(overflow: boolean): Promise<void> {
    await this._locator.locator('fieldset input.e2e-vertical-overflow').setChecked(overflow);
  }

  public async setHorizontalOverflow(overflow: boolean): Promise<void> {
    await this._locator.locator('fieldset input.e2e-horizontal-overflow').setChecked(overflow);
  }
}
