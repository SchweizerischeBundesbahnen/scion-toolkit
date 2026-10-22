/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator} from '@playwright/test';

export class ColumnHeaderPO {

  public readonly sortButton: Locator;
  public readonly icon: Locator;

  constructor(public locator: Locator) {
    this.sortButton = this.locator.locator('button.e2e-sort');
    this.icon = this.locator.locator('sci-icon.e2e-icon');
  }

  public async hover(): Promise<void> {
    await this.locator.hover();
  }
}
