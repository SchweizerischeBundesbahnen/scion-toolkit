/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator, Page} from '@playwright/test';
import {DomRect, fromRect} from '../../helper/testing.utils';

const PATH = '/#/components/sci-sashbox';

export class SashboxPagePO {

  private readonly _locator: Locator;
  private readonly _properties: Locator;
  private readonly _tabbar: Locator;

  constructor(private _page: Page) {
    this._locator = this._page.locator('app-sashbox-page');
    this._properties = this._locator.locator('aside.e2e-properties');
    this._tabbar = this._properties.locator('sci-tabbar');
  }

  public async navigate(): Promise<void> {
    await this._page.goto(PATH);
  }

  public async getDirection(): Promise<'row' | 'column'> {
    await this._tabbar.locator('button.e2e-settings').click();
    return (await this._locator.locator('select.e2e-direction').inputValue()) as 'row' | 'column';
  }

  public async enterDirection(direction: 'row' | 'column'): Promise<void> {
    await this._tabbar.locator('button.e2e-settings').click();
    await this._properties.locator('select.e2e-direction').selectOption(direction);
  }

  public async enterSashProperties(sash: 'sash-1' | 'sash-2' | 'sash-3', properties: {size?: string; minSize?: string}): Promise<void> {
    const index = parseSashIndex(sash);
    await this._tabbar.locator(`button.e2e-sash-${index}`).click();

    if (properties.size !== undefined) {
      await this._properties.locator('input.e2e-size').fill(properties.size);
    }
    if (properties.minSize !== undefined) {
      await this._properties.locator('input.e2e-min-size').fill(properties.minSize);
    }
  }

  public async moveSplitter(splitter: 'splitter-1' | 'splitter-2', options: {distance: number; steps?: number}): Promise<void> {
    const index = parseSplitterIndex(splitter);

    const {distance, steps} = options;
    const mouse = this._locator.page().mouse;

    const splitterBounds = fromRect(await this._locator.locator('sci-splitter').nth(index - 1).boundingBox());
    const direction = await this.getDirection();

    // Move mouse to splitter.
    await mouse.move(splitterBounds.hcenter, splitterBounds.vcenter);
    await mouse.down();

    // Move splitter.
    if (direction === 'row') {
      await mouse.move(splitterBounds.hcenter + distance, splitterBounds.vcenter, {steps: steps ?? 1});
    }
    else {
      await mouse.move(splitterBounds.hcenter, splitterBounds.vcenter + distance, {steps: steps ?? 1});
    }
    await mouse.up();
  }

  public async getSashBoundingBox(sash: 'sash-1' | 'sash-2' | 'sash-3'): Promise<DomRect> {
    const index = parseSashIndex(sash);
    return fromRect(await this._locator.locator(`sci-sashbox section.e2e-sash-${index}`).boundingBox());
  }
}

function parseSashIndex(sashIndex: `sash-${number}`): number {
  return +sashIndex.match(/sash-(?<index>\d+)/)!.groups!['index'];
}

function parseSplitterIndex(splitterIndex: `splitter-${number}`): number {
  return +splitterIndex.match(/splitter-(?<index>\d+)/)!.groups!['index'];
}
