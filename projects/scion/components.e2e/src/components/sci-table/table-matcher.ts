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
import {expectRow} from './row-matcher';

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
    async toHaveContent(expected: (string | TableTreeNode)[][]): Promise<void> {
      const actualColumnCount = await table.grid.locator('sci-table-column').count();
      const actualRowCount = await table.grid.locator('sci-table-row').count();

      for (let y = 0; y < actualRowCount && y < expected.length; y++) {
        for (let x = 0; x < actualColumnCount && x < expected[y]!.length; x++) {
          const expectedCell = expected[y]![x]!;
          const row = table.row({index: y});
          const cell = row.cell({index: x});
          if (typeof expectedCell === 'object') {
            await expectRow(row).toHaveState(expectedCell.state);
          }

          const label = typeof expectedCell === 'object' ? expectedCell.label : expectedCell;
          await expect.poll(async () => ((await cell.textContent()) ?? '').trim() || ((await cell.value()) ?? '')).toEqual(label);
        }
      }
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

  toHaveContent(expected: (string | TableTreeNode)[][]): Promise<void>;

  not: {
    toHaveVerticalOverflow(): Promise<void>;

    toHaveHorizontalOverflow(): Promise<void>;
  };
}

interface TableTreeNode {
  label?: string;
  state: 'expanded' | 'collapsed' | null;
}
