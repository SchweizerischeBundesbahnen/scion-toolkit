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

const PATH = '/#/components/sci-menu/viewport-hover';

export class ViewportHoverPagePO {

  public readonly menu: Locator;
  public readonly filter: Locator;
  public readonly viewport: Locator;
  public readonly scrollbar: Locator;
  public readonly scrollThumb: Locator;

  constructor(private _page: Page) {
    this.menu = this._page.locator('sci-menu');
    this.filter = this.menu.locator('sci-menu-filter');
    this.viewport = this.menu.locator('div.e2e-viewport');
    this.scrollbar = this.viewport.locator('+ sci-scrollbar[direction="vscroll"]');
    this.scrollThumb = this.scrollbar.locator('div.e2e-thumb');
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }
}
