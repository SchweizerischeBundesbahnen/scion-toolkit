/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Signal} from '@angular/core';
import {SciDataSource, SciTableRequest, SciTableResponse} from './table-data-source';
import {SciCells, SciColumns, SciRow, SciTable} from './table.model';
import {ɵSciTableFactory} from './ɵtable.factory';
import {ɵSciArrayDataSource} from './ɵarray-data-source';
import {Observable} from 'rxjs';
import {coerceObservable, coerceSignal} from './common';
import {map} from 'rxjs/operators';

export class ɵSciTable<T> implements SciTable<T> {

  public readonly columns: SciColumns<T>[];
  public readonly dataSource: SciDataSource<T> | SciDataSource<SciRow<T>>;
  public readonly name?: string;
  public readonly sortable: Signal<boolean>;
  public readonly filterable: Signal<boolean>;
  public readonly resizable: Signal<boolean>;
  public readonly selectable: Signal<boolean>;
  public readonly itemSize: number;
  public readonly trackBy: (item: T, index: number) => unknown;
  public readonly rowPart?: (item: T) => string;

  constructor(factory: ɵSciTableFactory<T>, dataOrSource: Signal<T[]> | SciDataSource<T>) {
    this.columns = factory.columns;
    this.name = factory.tableName;
    this.sortable = factory.isSortable;
    this.filterable = factory.isFilterable;
    this.resizable = factory.isResizable;
    this.selectable = factory.isSelectable;
    this.itemSize = factory.rowItemSize;
    this.trackBy = factory.trackByFn;
    this.rowPart = factory.rowPartFn;

    this.dataSource = typeof dataOrSource === 'function' ?
      new ɵSciArrayDataSource(dataOrSource, factory.columns) :
      dataOrSource;
  }

  public getRows(request: SciTableRequest): Observable<SciTableResponse<SciRow<T>>> {
    return coerceObservable(this.dataSource.getItems(request)).pipe(
      map(res => ({totalCount: res.totalCount, items: this.mapItemsToRow(res.items as T[])})),
    );
  }

  private mapItemsToRow(items: T[]): SciRow<T>[] {
    return items.map(item => ({
      item: item,
      cells: this.columns.map(column => ({
        value: column.type !== 'component' && column.type !== 'template' ? coerceSignal(column.value(item)) : undefined,
        component: column.type === 'component' ? column.component(item) : undefined,
        template: column.type === 'template' ? coerceSignal(column.template(item)) : undefined,
        type: column.type,
        columnName: column.name,
        part: column.part?.(item),
      } as SciCells)),
    }));
  }
}
