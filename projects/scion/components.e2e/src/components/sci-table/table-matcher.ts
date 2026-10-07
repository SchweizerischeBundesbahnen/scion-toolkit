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
import {RequireOne} from '@scion/toolkit/types';

export function expectTable(table: TablePO): TableMatcher {
  return {
    column(locateBy: RequireOne<{name: `column:${string}`; index: number}>): ColumnMatcher {
      return {
        async toHaveSortDirection(expected: 'desc' | 'asc' | null): Promise<void> {
          const column = table.column(locateBy);
          await expect.poll(() => column.sortDirection()).toEqual(expected);
        },
      };
    },
    async toHaveContent(expected: string[][]): Promise<void> {
      await expect(async () => {
        const actualColumnCount = await table.grid.locator('sci-table-column').count();
        const actualRowCount = await table.grid.locator('sci-table-row').count();
        const actualCells = (await table.rows.locator('sci-table-cell').allTextContents()).map(content => content.trim());

        const actual = Array.from({length: actualRowCount}, (_, row) => {
          return actualCells.slice(row * actualColumnCount, row * actualColumnCount + actualColumnCount);
        });

        expect(actual).toStrictEqual(expected);
      }).toPass();
    },
    async toHaveVerticalOverflow(): Promise<void> {
      await expect(table.locator.locator('sci-scrollbar[direction="vscroll"].overflow')).toBeAttached();
    },
    async toHaveHorizontalOverflow(): Promise<void> {
      await expect(table.locator.locator('sci-scrollbar[direction="hscroll"].overflow')).toBeAttached();
    },
    async toHaveColumnCount(count: number): Promise<void> {
      await expect(table.locator.locator('sci-table-column')).toHaveCount(count);
    },
    not: {
      async toHaveVerticalOverflow(): Promise<void> {
        await expect(table.locator.locator('sci-scrollbar[direction="vscroll"].overflow')).not.toBeAttached();
      },
      async toHaveHorizontalOverflow(): Promise<void> {
        await expect(table.locator.locator('sci-scrollbar[direction="hscroll"].overflow')).not.toBeAttached();
      },
    },
  };
}

export interface ColumnMatcher {
  toHaveSortDirection(expected: 'desc' | 'asc' | null): Promise<void>;
}

export interface TableMatcher {

  column(locateBy: RequireOne<{name: `column:${string}`; index: number}>): ColumnMatcher;

  toHaveVerticalOverflow(): Promise<void>;

  toHaveHorizontalOverflow(): Promise<void>;

  toHaveColumnCount(count: number): Promise<void>;

  toHaveContent(expected: string[][]): Promise<void>;

  not: {
    toHaveVerticalOverflow(): Promise<void>;

    toHaveHorizontalOverflow(): Promise<void>;
  };
}
