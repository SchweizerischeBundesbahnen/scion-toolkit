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
import {isActiveElement} from '../../../helper/testing.utils';

const PATH = '/#/components/sci-viewport/focus';

export class ViewportFocusPagePO {

  private readonly _locator: Locator;

  constructor(private _page: Page) {
    this._locator = _page.locator('e2e-viewport-focus-page');
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }

  public async focusInput(cssClass: string): Promise<void> {
    await this._locator.locator(`input.${cssClass}`).focus();
  }

  public async isInputActive(cssClass: string): Promise<boolean> {
    return isActiveElement(this._locator.locator(`input.${cssClass}`));
  }

  public async tab(): Promise<void> {
    await this._page.keyboard.press('Tab');
  }

  public async shiftTab(): Promise<void> {
    await this._page.keyboard.press('Shift+Tab');
  }
}
