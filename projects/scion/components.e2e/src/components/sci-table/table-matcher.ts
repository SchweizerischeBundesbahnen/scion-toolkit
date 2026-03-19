import {TablePo} from './table.po';
import {expect} from '@playwright/test';

export function expectTable(table: TablePo): TableMatcher {
  return {
    async allCellsToContainText(columnIndex: number, text: string): Promise<void> {
      await expect(async () => {
        for (const cell of await table.locateColumnCells(columnIndex).all()) {
          // Do not use web first assertion since we already opted out with `.all()`
          // This prevents waiting for the 5s timeout in the first try
          await expect(cell.textContent()).resolves.toContain(text);
        }
      }).toPass();
    },
  };
}

export interface TableMatcher {
  allCellsToContainText(columnIndex: number, text: string): Promise<void>;
}