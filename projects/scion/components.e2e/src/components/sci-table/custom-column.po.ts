/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {CellPO} from './cell.po';
import {Locator} from '@playwright/test';
import {DomRect, fromRect, waitUntilStable} from '../../helper/testing.utils';

export class CustomColumnPO {

  public locator: Locator;

  constructor(public readonly cell: CellPO) {
    this.locator = cell.locator.locator('app-custom-column');
  }

  public async bounds(): Promise<DomRect> {
    return waitUntilStable(async () => fromRect(await this.locator.boundingBox()), {isStable: (a, b) => a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height});
  }

  public async setPositionAbsolute(position: {top: number; right: number; bottom: number; left: number}): Promise<void> {
    await this.locator.evaluate((component, position) => {
      component.style.position = 'absolute';
      component.style.top = `${position.top}px`;
      component.style.right = `${position.right}px`;
      component.style.bottom = `${position.bottom}px`;
      component.style.left = `${position.left}px`;
    }, position);
  }

  public async setWidth(width: number): Promise<void> {
    await this.locator.evaluate((component, width) => {
      component.style.width = `${width}px`;
    }, width);
  }
}
