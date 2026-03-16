import {effect, Injectable, signal, untracked} from '@angular/core';
import {SciColumns} from '@scion/components/table';

/**
 * TODO: Load state from and save to local storage
 */
@Injectable()
export class TableStateService {
  private readonly _resizedColumnWidths = signal<Map<string, number>>(new Map());
  private readonly _tableName = signal<string | undefined>(undefined);

  public readonly columnWidths = this._resizedColumnWidths.asReadonly();

  constructor() {
    effect(() => {
      const columnWidths = this.columnWidths();
      const tableName = this._tableName();

      if (!tableName || columnWidths.size === 0) {
        return;
      }

      untracked(() => {
        localStorage.setItem(`sci-table-${tableName}`, JSON.stringify(Object.fromEntries(columnWidths)));
      });
    });
  }

  public init<T>(tableName: string | undefined, columns: {column: SciColumns<T>; width: number}[]): void {
    this._tableName.set(tableName);
    this.initializeColumnSizes(columns);
  }

  public setResizedColumn(columnName: string, size: number): void {
    this._resizedColumnWidths.update(columns => new Map(columns).set(columnName, size));
  }

  /**
   * Initially set all columns widths of auto columns to fixed px values.
   * This ensures, that resizing with horizontal overflow is possible.
   */
  private initializeColumnSizes<T>(columns: {column: SciColumns<T>; width: number}[]): void {
    const overrides = columns
      .map(({column, width}) => ({columnWidth: column.width(), columnName: column.name, overrideWidth: width}))
      .filter(column => column.columnWidth === 'auto');

    this._resizedColumnWidths.update(columns => {
      const newColumns = new Map(columns);
      for (const override of overrides) {
        if (!newColumns.has(override.columnName)) {
          newColumns.set(override.columnName, override.overrideWidth);
        }
      }
      return newColumns;
    });
  }
}
