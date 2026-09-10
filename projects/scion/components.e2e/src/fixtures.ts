/**
 * Provides the environment for each test.
 *
 * @see https://playwright.dev/docs/test-fixtures
 */
import {ConsoleLogs} from './console-logs';
import {expect, test as playwrightTest} from '@playwright/test';
import {toBeBetween} from './helper/to-be-between.matcher';
import {toHaveEllipsis} from './helper/to-have-ellipsis.matcher';

export interface TestFixtures {
  /**
   * Provides messages logged to the browser console.
   */
  consoleLogs: ConsoleLogs;
}

/**
 * Extends the Playwright expect API with project specific custom matchers.
 */
declare global {
  namespace PlaywrightTest {
    interface Matchers<R> {
      /**
       * Tests the number to be between the expected numbers (inclusive).
       */
      toBeBetween(expectedFrom: number, expectedTo: number): R;

      /**
       * Tests whether text overflows displaying ellipsis.
       */
      toHaveEllipsis(): Promise<R>;
    }
  }
}

expect.extend({
  toBeBetween,
  toHaveEllipsis,
});

export const test = playwrightTest.extend<TestFixtures>({
  consoleLogs: async ({page}, use) => {
    await use(new ConsoleLogs(page));
  },
});
