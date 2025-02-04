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
import {fromRect} from '../../helper/testing.utils';

const PATH = '/#/components/sci-splitter';

export class SplitterPagePO {

  private readonly _locator: Locator;
  private readonly _settings: Locator;

  constructor(private _page: Page) {
    this._locator = this._page.locator('app-splitter-page');
    this._settings = this._locator.locator('aside.e2e-settings');
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }

  public async enterOrientation(orientation: 'vertical' | 'horizontal'): Promise<void> {
    await this._settings.locator('select.e2e-orientation').selectOption(orientation);
  }

  public async getOrientation(): Promise<'vertical' | 'horizontal'> {
    return (await this._settings.locator('select.e2e-orientation').inputValue()) as 'vertical' | 'horizontal';
  }

  public async moveSplitter(distance: number, options?: {steps?: number}): Promise<void> {
    const steps = options?.steps ?? 100;
    const mouse = this._locator.page().mouse;
    const splitterBoundingBox = fromRect(await this._locator.locator('sci-splitter').boundingBox());
    const orientation = await this.getOrientation();

    // Start moving.
    await mouse.move(splitterBoundingBox.hcenter, splitterBoundingBox.vcenter);
    await mouse.down();

    // Move splitter.
    const x = orientation === 'vertical' ? splitterBoundingBox.hcenter + distance : splitterBoundingBox.hcenter;
    const y = orientation === 'vertical' ? splitterBoundingBox.vcenter : splitterBoundingBox.vcenter + distance;

    // Send mouse events in parallel to simulate 'mousemove' events in quick succession.
    // Increasing the step count does not effectively send the multiple mouse events at once.
    const mouseMoveCommands = new Array<Promise<void>>();
    for (let i = 0; i < steps; i++) {
      mouseMoveCommands.push(mouse.move(x, y, {steps: 1}));
    }
    await Promise.all(mouseMoveCommands);

    // End moving.
    await mouse.up();
  }
}
