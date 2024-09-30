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

const PATH = '/#/toolkit/observable/bounding-client-rect';

export class BoundingClientRectPagePO {

  private readonly _locator: Locator;

  public readonly testeeBoundingBox: {
    x: Locator;
    y: Locator;
    width: Locator;
    height: Locator;
  };

  constructor(private _page: Page) {
    this._locator = _page.locator('e2e-bounding-client-rect-page');
    this.testeeBoundingBox = {
      x: this._locator.locator('section.e2e-testee-bounding-box span.e2e-x'),
      y: this._locator.locator('section.e2e-testee-bounding-box span.e2e-y'),
      width: this._locator.locator('section.e2e-testee-bounding-box span.e2e-width'),
      height: this._locator.locator('section.e2e-testee-bounding-box span.e2e-height'),
    };
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }

  public async enterProperties(properties: {x: string; y: string; width: string; height: string}): Promise<void> {
    await this._locator.locator('section.e2e-properties input.e2e-x').fill(properties.x);
    await this._locator.locator('section.e2e-properties input.e2e-y').fill(properties.y);
    await this._locator.locator('section.e2e-properties input.e2e-width').fill(properties.width);
    await this._locator.locator('section.e2e-properties input.e2e-height').fill(properties.height);
    await this._locator.locator('section.e2e-properties button.e2e-apply').click();
  }

  public async resizeWindow(viewportSize: {width?: number; height?: number}): Promise<void> {
    await this._page.setViewportSize({
      width: viewportSize.width ?? this._page.viewportSize()!.width,
      height: viewportSize.height ?? this._page.viewportSize()!.height,
    });
  }
}
