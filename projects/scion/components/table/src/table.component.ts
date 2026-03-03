/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, input, output, Signal, signal, untracked, viewChildren} from '@angular/core';
import {SciColumn, SciRow, SciTable, ValueType} from './table.model';
import {ɵSciTable} from './ɵtable.model';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {SciScrollableDirective, SciScrollbarComponent} from '@scion/components/viewport';
import {TableRowComponent} from './table-row/table-row.component';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';

export function table<T>(data: Signal<T[]>, factory: (table: SciTable<T>) => SciTable<T>): SciTable<T> {
  return factory(new ɵSciTable<T>(data));
}

function clamp(min: string | null, preferred: string, max: string | null): string {
  const maxDef = max === null ? preferred : `min(${preferred}, ${max})`;
  return `minmax(${min ?? 0}, ${maxDef})`;
}

export interface RowSelection<T> {
  index: number;
  row: T;
}

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--ɵsci-table-columns]': 'columnWidths()',
  },
  imports: [
    SciScrollableDirective,
    SciScrollbarComponent,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    TableRowComponent,
    SciSplitterComponent,
  ],
})
export class SciTableComponent<T> {

  public readonly table = input.required<SciTable<T>>();

  public readonly activateRow = output<RowSelection<T> | undefined>();
  public readonly selectRows = output<RowSelection<T>[]>();

  protected readonly rows = viewChildren<TableRowComponent<T>>(TableRowComponent);

  protected readonly activeRow = signal<RowSelection<T> | undefined>(undefined);
  protected readonly selectedRows = signal<RowSelection<T>[]>([]);
  protected readonly sort = signal<[string, 'asc' | 'desc'] | undefined>(undefined);

  private readonly _resizeContext = signal<{width: number; columnId: string} | undefined>(undefined);
  private readonly _resizedColumnWidths = signal<Map<string, string>>(new Map());

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T>);
  protected readonly selectedRowIndices = computed(() => this.selectedRows().map(selection => selection.index));
  protected readonly columnWidths = computed(() => {
    const columns = this.sciTable().columns();
    const overrides = this._resizedColumnWidths();
    return columns
      .map(c => clamp(c.minWidth(), overrides.get(c.id) ?? c.width(), c.maxWidth()))
      .join(' ');
  });

  protected readonly data = computed<SciRow<T>[]>(() => {
    const table = this.sciTable();
    const [id, dir] = this.sort() ?? [];
    const columns = table.columns();
    const data = table.data().map(row => ({
      data: row,
      cells: columns.map(col => ({
        label: col.label(row),
        type: col.type,
        columnId: col.id,
      })),
    }));

    const sortCol = columns.find(c => c.id === id);
    if (!id || !table.isSortable() || !sortCol?.sortable()) {
      return data;
    }

    return untracked(() => {
      const sortColIdx = columns.indexOf(sortCol);
      const sortDir = dir === 'asc' ? 1 : -1;
      return data.sort((a, b) => sortCol.sort(a.cells[sortColIdx]!.label, b.cells[sortColIdx]!.label) * sortDir);
    });
  });

  constructor() {
    effect(() => {
      this.activateRow.emit(this.activeRow());
    });

    effect(() => {
      this.selectRows.emit(this.selectedRows());
    });
  }

  protected trackBy(i: number, row: SciRow<T>): any {
    return this.sciTable().trackByFn(i, row.data);
  }

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

  protected onSelectRow(row: T, index: number, {ctrlKey}: {ctrlKey: boolean}): void {
    this.selectRow(row, index, !ctrlKey);
  }

  protected onActivateRow(row: T, index: number): void {
    this.selectRow(row, index, true);
  }

  private selectRow(row: T, index: number, replace: boolean): void {
    const rowSelection = {row, index};
    this.activeRow.set(rowSelection);

    if (!this.sciTable().isSelectable()) {
      return;
    }

    this.selectedRows.update(selection => {
      const existing = selection.find(s => s.index === index);
      if (existing) {
        // Deselect row, if it was already selected
        return selection.filter(s => s !== existing);
      }

      if (replace) {
        return [rowSelection];
      }

      return [...selection, rowSelection];
    });
  }

  protected onResizeStart(column: SciColumn<T, ValueType>, header: HTMLDivElement): void {
    this._resizeContext.set({width: header.offsetWidth, columnId: column.id});
  }

  protected onResize(column: SciColumn<T, ValueType>, event: SplitterMoveEvent): void {
    const context = this._resizeContext();
    if (!context) {
      return;
    }

    const width = Math.max(20, context.width + event.distance);
    this._resizeContext.set({columnId: column.id, width: width});
    this._resizedColumnWidths.update(widths => new Map(widths).set(column.id, `${width}px`));
  }

  protected onResizeEnd(): void {
    this._resizeContext.set(undefined);
  }

  protected onResizeAuto(column: SciColumn<T, ValueType>): void {
    const cellWidths = this.rows().map(row => row.getCellWidth(column.id));
    const maxWidth = Math.max(...cellWidths, 0) + 20; // TODO [eg]: configurable buffer?
    this._resizedColumnWidths.update(overrides => new Map(overrides).set(column.id, `${maxWidth}px`));
  }
}
