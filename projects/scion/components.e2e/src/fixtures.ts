/**
 * Provides the environment for each test.
 *
 * @see https://playwright.dev/docs/test-fixtures
 */
import {ConsoleLogs} from './console-logs';
import {test as playwrightTest} from '@playwright/test';

export type TestFixtures = {
  /**
   * Provides messages logged to the browser console.
   */
  consoleLogs: ConsoleLogs;
};

export const test = playwrightTest.extend<TestFixtures>({
  consoleLogs: async ({page}, use) => {
    await use(new ConsoleLogs(page));
  },
});
