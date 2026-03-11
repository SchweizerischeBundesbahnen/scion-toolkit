/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, Signal} from '@angular/core';
import {SciDataSource, SciTableRequest, SciTableResponse} from './data-source.model';
import {SciCells, SciColumns, SciRow, SciTable} from './table.model';
import {ɵSciTableFactory} from './ɵtable.factory';
import {ɵSciArrayDataSource} from './ɵarray-data-source.model';
import {Observable, of} from 'rxjs';
import {coerceObservable, coerceSignal} from './common';
import {map} from 'rxjs/operators';

export class ɵSciTable<T> implements SciTable<T> {

  public readonly columns: SciColumns<T>[];
  public readonly dataSource: SciDataSource<T> | SciDataSource<SciRow<T>>;
  public readonly name?: string;
  public readonly sortable;
  public readonly filterable;
  public readonly resizable;
  public readonly selectable;
  public readonly trackBy: (item: T, index: number) => unknown;

  constructor(factory: ɵSciTableFactory<T>, dataOrSource: Signal<T[]> | SciDataSource<T>) {
    this.columns = factory.columns;
    this.name = factory.tableName;
    this.sortable = factory.isSortable;
    this.filterable = factory.isFilterable;
    this.resizable = factory.isResizable;
    this.selectable = factory.isSelectable;
    this.trackBy = factory.trackByFn;

    this.dataSource = typeof dataOrSource === 'function' ?
      new ɵSciArrayDataSource(computed(() => this.mapItemsToRow(dataOrSource())), factory.columns) :
      dataOrSource;
  }

  public getRows(request: SciTableRequest): Observable<SciTableResponse<SciRow<T>>> {
    if (this.dataSource instanceof ɵSciArrayDataSource) {
      return of(this.dataSource.getItems(request) as SciTableResponse<SciRow<T>>);
    }

    // TODO Figure out how to map items before sorting / filtering but still have one datasource type

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
      } as SciCells)),
    }));
  }

}
