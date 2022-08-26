/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {PlaywrightTestConfig} from '@playwright/test';

const runInCI = !!process.env['CI'];
const runHeadless = !!process.env['HEADLESS'];

const config: PlaywrightTestConfig = {
  forbidOnly: runInCI,
  webServer: {
    command: runInCI ? 'npm run components-testing-app:serve' : 'npm run components-testing-app:ngserve',
    port: 4200,
    reuseExistingServer: !runInCI,
  },
  use: {
    browserName: 'chromium',
    headless: runHeadless,
    baseURL: 'http://localhost:4200',
  },
  maxFailures: runInCI ? 1 : undefined,
  testMatch: /.*\.e2e-spec\.ts/,
};
export default config;
