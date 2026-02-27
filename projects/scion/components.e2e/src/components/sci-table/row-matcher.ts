import {expect} from '@playwright/test';
import {RowPo} from './row.po';

export function expectRow(row: RowPo): RowMatcher {
  return {
    async toBeAttached(): Promise<void> {
      await expect(row.locator).toBeAttached();
    },
    async toBeSelected(): Promise<void> {
      await expect(row.locator).toContainClass('selected');
    },
    async toHavePart(part?: string): Promise<void> {
      if (part) {
        await expect(row.locator).toHaveAttribute('part', part);
      }
      else {
        await expect(row.locator).toHaveAttribute('part');
      }
    },
    not: {
      async toBeSelected(): Promise<void> {
        await expect(row.locator).not.toContainClass('selected');
      },
      async toHavePart(part?: string): Promise<void> {
        if (part) {
          await expect(row.locator).not.toHaveAttribute('part', part);
        }
        else {
          await expect(row.locator).not.toHaveAttribute('part');
        }
      },
    },
  };
}

export interface RowMatcher {
  toBeAttached(): Promise<void>;
  toBeSelected(): Promise<void>;
  toHavePart(part?: string): Promise<void>;

  not: {
    toBeSelected(): Promise<void>;
    toHavePart(part?: string): Promise<void>;
  };
}
