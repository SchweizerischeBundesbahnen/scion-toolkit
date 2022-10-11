/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator, Page} from '@playwright/test';

const PATH = '/#/sci-viewport/overlap';

export class E2eOverlapPO {

  public readonly locator: Locator;

  constructor(private _page: Page) {
    this.locator = _page.locator('e2e-overlap');
  }

  public async open(): Promise<void> {
    await this._page.goto(PATH);
  }

  public clickAdjacentElement(): Promise<void> {
    return this.locator.locator('button').click({timeout: 1000});
  }
}
