import {expect} from '@playwright/test';
import {RowPO} from './row.po';

export function expectRow(row: RowPO): RowMatcher {
  return {
    async toBeActive(): Promise<void> {
      await expect(row.locator).toHaveAttribute('data-active');
    },
    async toBeAttached(): Promise<void> {
      await expect(row.locator).toBeAttached();
    },
    async toBeSelected(): Promise<void> {
      await expect(row.locator).toHaveAttribute('data-selected');
    },
    async toHaveState(state: 'expanded' | 'collapsed' | null): Promise<void> {
      if (state === null) {
        await expect(row.locator).not.toHaveAttribute('data-state');
      }
      else {
        await expect(row.locator).toHaveAttribute('data-state', state);
      }
    },
    async toBeFocused(): Promise<void> {
      await this.toBeActive();
      await this.toBeSelected();
      await expect(row.locator).toBeInViewport({ratio: 1});
    },
    not: {
      async toBeSelected(): Promise<void> {
        await expect(row.locator).not.toHaveAttribute('data-selected');
      },
      async toBeActive(): Promise<void> {
        await expect(row.locator).not.toHaveAttribute('data-active');
      },
    },
  };
}

export interface RowMatcher {
  toBeAttached(): Promise<void>;
  toBeSelected(): Promise<void>;

  /**
   * Expect row to be active, selected and in viewport.
   */
  toBeFocused(): Promise<void>;
  toBeActive(): Promise<void>;
  toHaveState(state: 'expanded' | 'collapsed' | null): Promise<void>;

  not: {
    toBeSelected(): Promise<void>;
    toBeActive(): Promise<void>;
  };
}
