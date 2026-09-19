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

export class CustomButtonColumnPO {

  public readonly locator: Locator;
  public readonly button: Locator;

  constructor(public readonly cell: CellPO) {
    this.locator = cell.locator.locator('app-custom-button-column');
    this.button = this.locator.locator('button');
  }
}
