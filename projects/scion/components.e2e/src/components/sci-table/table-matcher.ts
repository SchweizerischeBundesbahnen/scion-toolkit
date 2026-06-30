/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TablePo} from './table.po';
import {expect} from '@playwright/test';
import {RowPo} from './row.po';

export function expectTable(table: TablePo): TableMatcher {
  return {
    async toHaveColumnSorted(columnIndex: number, dir: 'desc' | 'asc' = 'asc'): Promise<void> {
      await expect(async () => {
        const cells = await table.locateColumnCells(columnIndex).allTextContents()
          // Map boolean cells
          .then(contents => contents.map(v => v === 'checkmark' ? 1 : v === 'clear' ? 0 : v))
          .then(contents => contents.map(v => isNaN(+v) ? v : +v));

        if (dir === 'asc') {
          expect(cells.every((v, i) => i === 0 || cells.at(i - 1)! <= v)).toBe(true);
        }
        else {
          expect(cells.every((v, i) => i === 0 || cells.at(i - 1)! >= v)).toBe(true);
        }
      }).toPass();
    },
    async allCellsToContainText(columnIndex: number, text: string): Promise<void> {
      await expect(async () => {
        for (const row of await table.rows.all()) {
          // Do not use web first assertion since we already opted out with `.all()`
          // This prevents waiting for the 5s timeout in the first try
          await expect(new RowPo(row).cells.nth(columnIndex).textContent()).resolves.toContain(text);
        }
      }).toPass();
    },
    async toHaveVerticalScroll(): Promise<void> {
      await expect.poll(() => table.viewport.evaluate(v => v.scrollTop)).toBeGreaterThan(0);
    },
    async toHaveHorizontalOverflow(): Promise<void> {
      await expect(table.locator.locator('sci-scrollbar.horizontal.overflow')).toBeAttached();
    },
    async toHaveColumnCount(count: number): Promise<void> {
      await expect(table.locator.locator('sci-column-header')).toHaveCount(count);
    },

    not: {
      async toHaveVerticalScroll(): Promise<void> {
        await expect.poll(() => table.viewport.evaluate(v => v.scrollTop)).toBe(0);
      },
    },
  };
}

export interface TableMatcher {
  toHaveColumnSorted(columnIndex: number, dir?: 'desc' | 'asc'): Promise<void>;
  allCellsToContainText(columnIndex: number, text: string): Promise<void>;
  toHaveHorizontalOverflow(): Promise<void>;
  toHaveColumnCount(count: number): Promise<void>;
  toHaveVerticalScroll(): Promise<void>;
  not: {
    toHaveVerticalScroll(): Promise<void>;
  };
}
