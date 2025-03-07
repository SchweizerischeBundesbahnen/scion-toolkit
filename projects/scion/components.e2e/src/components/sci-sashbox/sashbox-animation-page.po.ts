/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator, Page} from '@playwright/test';

const PATH = '/#/components/sci-sashbox/animation';

export class SashboxAnimationPagePO {

  private readonly _locator: Locator;

  constructor(private _page: Page) {
    this._locator = this._page.locator('app-sashbox-animation-page');
  }

  public async navigate(options?: Options): Promise<void> {
    // Append options as matrix params to the path.
    const path = Object.entries(options ?? {}).reduce((path, [key, value]) => `${path};${key}=${value}`, PATH);
    await this._page.goto(path);
  }

  public async setVisible(sash: 'sash-1' | 'sash-2' | 'sash-3' | 'sash-4' | 'sash-5', visible: boolean): Promise<void> {
    const locator = this._locator.locator(`fieldset.e2e-visibility input[type="checkbox"][data-sash="${sash}"]`);
    await (visible ? locator.check() : locator.uncheck());
  }

  public async enableAnimation(sash: 'sash-1' | 'sash-2' | 'sash-3' | 'sash-4' | 'sash-5', enabled: boolean): Promise<void> {
    const locator = this._locator.locator(`fieldset.e2e-animation input[type="checkbox"][data-sash="${sash}"]`);
    await (enabled ? locator.check() : locator.uncheck());
  }

  public async animateContent(): Promise<void> {
    await this._locator.locator('app-animation > button.e2e-animate-content').click();
  }
}

export interface Options {
  sash1Visible?: boolean;
  sash2Visible?: boolean;
  sash3Visible?: boolean;
  sash4Visible?: boolean;
  sash5Visible?: boolean;
  sash1Animated?: boolean;
  sash2Animated?: boolean;
  sash3Animated?: boolean;
  sash4Animated?: boolean;
  sash5Animated?: boolean;
}
