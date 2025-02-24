/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test} from '../../fixtures';
import {SplitterPagePO} from './splitter-page.po';
import {expect} from '@playwright/test';

test.describe('sci-splitter', () => {

  test('should emit a single move event per animation frame', async ({page, consoleLogs}) => {
    const splitterPage = new SplitterPagePO(page);
    await splitterPage.navigate();

    // Move the splitter.
    await splitterPage.moveSplitter(500, {steps: 100});

    // Wait until logged the events to the console.
    const logFilter = /\[SciSplitterPageComponent] eventsPerAnimationFrame="(?<count>\d+)"/;
    await expect.poll(() => consoleLogs.contains({message: logFilter})).toBe(true);

    // Expect a single event per animation frame at maximum.
    const logs = consoleLogs.get({message: logFilter});
    for (const log of logs) {
      const count = +logFilter.exec(log)!.groups!.count;
      expect(count).toBe(1);
    }
  });
});
