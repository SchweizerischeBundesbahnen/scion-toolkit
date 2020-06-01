/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import { AppPO } from './app.po';

describe('@scion/toolkit', () => {
  const pagePO = new AppPO();

  beforeEach(async () => {
    await pagePO.navigateTo();
  });

  // single spec is required because karma fails if no spec is found
  it('should be truthy', async () => {
    await pagePO.navigateTo();
    await expect(true).toEqual(true);
  });
});
