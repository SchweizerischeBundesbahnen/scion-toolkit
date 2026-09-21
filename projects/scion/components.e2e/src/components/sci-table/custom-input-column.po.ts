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

export class CustomInputColumnPO {

  public readonly locator: Locator;
  public readonly input: Locator;

  constructor(public readonly cell: CellPO) {
    this.locator = cell.locator.locator('app-custom-input-column');
    this.input = this.locator.locator('input');
  }
}
