/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, input, Signal, signal} from '@angular/core';
import {SciColumn, SciTable, ValueType} from './table.model';
import {ɵSciTable} from './ɵtable.model';

export function table<T>(data: Signal<T[]>, factory: (table: SciTable<T>) => SciTable<T>): SciTable<T> {
  return factory(new ɵSciTable<T>(data));
}

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SciTableComponent<T> {

  public readonly table = input.required<SciTable<T>>();

  protected readonly sort = signal<[string, 'asc' | 'desc'] | undefined>(undefined);
  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T>);

  protected readonly data = computed(() => {
    const table = this.sciTable();
    const [id, dir] = this.sort() ?? [];
    const columns = table.columns();
    const data = table.data().map(row => ({
      ...row,
      cells: columns.map(col => ({
        value: col.value(row),
        text: col.text(row),
      })),
    }));

    const sortCol = columns.find(c => c.id === id);
    if (!id || !table.isSortable() || !sortCol?.sortable()) {
      return data;
    }

    const sortColIdx = columns.indexOf(sortCol);
    return data.sort(dir === 'asc' ?
      (a, b) => sortCol.sort(a.cells[sortColIdx]!.value, b.cells[sortColIdx]!.value) :
      (a, b) => sortCol.sort(b.cells[sortColIdx]!.value, a.cells[sortColIdx]!.value),
    );
  });

  protected onSort(col: SciColumn<T, ValueType>): void {
    if (!this.sciTable().isSortable() || !col.sortable()) {
      return;
    }

    this.sort.update(sort => {
      if (col.id !== sort?.[0]) {
        return [col.id, 'asc'];
      }

      return [col.id, sort[1] === 'asc' ? 'desc' : 'asc'];
    });
  }

  protected onMouseDown(col: SciColumn<T, ValueType>, event: MouseEvent): void {

  }

}
