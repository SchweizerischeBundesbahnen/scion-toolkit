/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TablePO} from './table.po';
import {expect} from '@playwright/test';
import {RowPO} from './row.po';
import {RequireOne} from '@scion/toolkit/types';

export function expectTable(table: TablePO): TableMatcher {
  return {
    column(locateBy: RequireOne<{name: `column:${string}`; index: number}>): ColumnMatcher {
      return {
        async toBeSorted(direction: 'desc' | 'asc' = 'asc'): Promise<void> {
          await expect(async () => {
            const cells = await table.column(locateBy).cells.allTextContents()
              // Map boolean cells
              .then(contents => contents.map(v => v === 'checkmark' ? 1 : v === 'clear' ? 0 : v))
              .then(contents => contents.map(v => isNaN(+v) ? v : +v));

            if (direction === 'asc') {
              expect(cells.every((cell, i) => i === 0 || cells.at(i - 1)! <= cell)).toBe(true);
            }
            else {
              expect(cells.every((cell, i) => i === 0 || cells.at(i - 1)! >= cell)).toBe(true);
            }
          }).toPass();
        },
        cells: {
          async toContainText(text: string): Promise<void> {
            await expect(async () => {
              for (const row of await table.rows.all()) {
                // Do not use web first assertion since we already opted out with `.all()`
                // This prevents waiting for the 5s timeout in the first try
                await expect(new RowPO(row).cell(locateBy).textContent()).resolves.toContain(text);
              }
            }).toPass();
          },
        },
      }
    },
    async toHaveVerticalScroll(): Promise<void> {
      await expect.poll(() => table.scrollTop()).toBeGreaterThan(0);
    },
    async toHaveHorizontalOverflow(): Promise<void> {
      await expect(table.locator.locator('sci-scrollbar.horizontal.overflow')).toBeAttached();
    },
    async toHaveColumnCount(count: number): Promise<void> {
      await expect(table.locator.locator('sci-column-header')).toHaveCount(count);
    },

    not: {
      async toHaveVerticalScroll(): Promise<void> {
        await expect.poll(() => table.scrollTop()).toBe(0);
      },
    },
  };
}

export interface ColumnMatcher {

  toBeSorted(direction?: 'desc' | 'asc'): Promise<void>;

  cells: {
    toContainText(text: string): Promise<void>;
  }
}

export interface TableMatcher {

  column(locateBy: RequireOne<{name: `column:${string}`; index: number}>): ColumnMatcher;

  toHaveHorizontalOverflow(): Promise<void>;

  toHaveColumnCount(count: number): Promise<void>;

  toHaveVerticalScroll(): Promise<void>;

  not: {
    toHaveVerticalScroll(): Promise<void>;
  };
}
