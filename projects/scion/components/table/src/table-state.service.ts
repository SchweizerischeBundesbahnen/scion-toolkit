import {Injectable, signal} from '@angular/core';
import {SciColumns} from '@scion/components/table';

/**
 * TODO: Load state from and save to local storage
 */
@Injectable()
export class TableStateService {
  private readonly _resizedColumnWidths = signal<Map<string, string>>(new Map());

  public readonly columnWidths = this._resizedColumnWidths.asReadonly();

  public initializeColumnSizes<T>(columns: {column: SciColumns<T>; width: number}[]): void {
    for (const {column, width} of columns) {
      if (column.width() === 'auto') {
        this.setResizedColumn(column.name, `${width}px`, false);
      }
    }
  }

  public setResizedColumn(columnName: string, size: string, replace: boolean = true): void {
    this._resizedColumnWidths.update(columns => {
      if (!columns.has(columnName) || replace) {
        return new Map(columns).set(columnName, size);
      }
      return columns;
    });
  }
}
