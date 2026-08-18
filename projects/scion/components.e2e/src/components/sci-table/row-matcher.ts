import {expect} from '@playwright/test';
import {RowPO} from './row.po';

export function expectRow(row: RowPO): RowMatcher {
  return {
    async toBeActive(): Promise<void> {
      await expect(row.locator).toContainClass('active');
    },
    async toBeAttached(): Promise<void> {
      await expect(row.locator).toBeAttached();
    },
    async toBeSelected(): Promise<void> {
      await expect(row.locator).toContainClass('selected');
    },
    not: {
      async toBeSelected(): Promise<void> {
        await expect(row.locator).not.toContainClass('selected');
      },
      async toBeActive(): Promise<void> {
        await expect(row.locator).not.toContainClass('active');
      },
    },
  };
}

export interface RowMatcher {
  toBeAttached(): Promise<void>;
  toBeSelected(): Promise<void>;
  toBeActive(): Promise<void>;

  not: {
    toBeSelected(): Promise<void>;
    toBeActive(): Promise<void>;
  };
}
