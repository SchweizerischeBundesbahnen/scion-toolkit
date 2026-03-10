import {Injectable, signal} from '@angular/core';

/**
 * TODO: Load state from and save to local storage
 */
@Injectable()
export class TableStateService {
  private readonly _resizedColumnWidths = signal<Map<string, string>>(new Map());

  public readonly columnWidths = this._resizedColumnWidths.asReadonly();

  public setResizedColumn(columnName: string, size: string): void {
    this._resizedColumnWidths.update(columns => new Map(columns).set(columnName, size));
  }
}
