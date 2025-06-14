/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {defineConfig} from '@playwright/test';

const runInCI = !!process.env.CI;
const runHeadless = !!process.env.HEADLESS;

export default defineConfig({
  forbidOnly: runInCI,
  fullyParallel: true,
  webServer: {
    command: runInCI ? 'npm run components-testing-app:dist-serve' : 'npm run components-testing-app:serve',
    port: 4200,
    reuseExistingServer: !runInCI,
  },
  use: {
    browserName: 'chromium',
    headless: runHeadless,
    viewport: {width: 1920, height: 1200},
    baseURL: 'http://localhost:4200',
    launchOptions: {
      // By default, Playwright hides scrollbars in headless mode, causing problems with tests using `sci-scrollbar`, e.g., to check whether content overflows.
      // Therefore, we instruct Playwright to ignore this default. Refer to https://github.com/microsoft/playwright/issues/5778#issuecomment-796264504 for more details.
      ignoreDefaultArgs: ['--hide-scrollbars'],
    },
  },
  maxFailures: runInCI ? 1 : undefined,
  testMatch: /.*\.e2e-spec\.ts/,
});
