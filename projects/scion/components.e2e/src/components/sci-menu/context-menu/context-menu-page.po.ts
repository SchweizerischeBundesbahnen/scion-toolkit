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

const PATH = '/#/components/sci-menu/context-menu';

export class ContextMenuPagePo {

  public readonly locator: Locator;
  public readonly menu: Locator;

  constructor(private _page: Page) {
    this.locator = this._page.locator('app-context-menu-page');
    this.menu = this._page.locator('sci-menu');
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }

  public async hover(): Promise<void> {
    await this._page.hover('app-context-menu-page');
  }
}
