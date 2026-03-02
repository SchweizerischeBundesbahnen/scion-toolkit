/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, ElementRef, input, output, Signal, signal, untracked, viewChildren} from '@angular/core';
import {SciColumn, SciTable, ValueType} from './table.model';
import {ɵSciTable} from './ɵtable.model';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {SciScrollableDirective, SciScrollbarComponent} from '@scion/components/viewport';
import {fromEvent} from 'rxjs';

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
  ],
})
export class SciTableComponent<T> {

  public readonly table = input.required<SciTable<T>>();

  public readonly activateRow = output<RowSelection<T> | undefined>();
  public readonly selectRows = output<RowSelection<T>[]>();

  protected readonly cells = viewChildren<ElementRef<HTMLDivElement>>('cell');

  protected readonly activeRow = signal<RowSelection<T> | undefined>(undefined);
  protected readonly selectedRows = signal<RowSelection<T>[]>([]);
  protected readonly sort = signal<[string, 'asc' | 'desc'] | undefined>(undefined);
  protected readonly columnWidthOverrides = signal<Map<string, string>>(new Map());

  private readonly _resizeContext = signal<{originalX: number; originalWidth: number; column: SciColumn<T, ValueType>} | undefined>(undefined);

  protected readonly sciTable = computed(() => this.table() as ɵSciTable<T>);
  protected readonly selectedRowIndices = computed(() => this.selectedRows().map(selection => selection.index));
  protected readonly columnWidths = computed(() => {
    const columns = this.sciTable().columns();
    const overrides = this.columnWidthOverrides();
    return columns
      .map(c => clamp(c.minWidth(), overrides.get(c.id) ?? c.width(), c.maxWidth()))
      .join(' ');
  });

  protected readonly data = computed(() => {
    const table = this.sciTable();
    const [id, dir] = this.sort() ?? [];
    const columns = table.columns();
    const data = table.data().map(row => ({
      ...row,
      cells: columns.map(col => ({
        value: col.value(row),
        text: col.text(row),
        type: col.type,
        columnId: col.id,
      })),
    }));

    const sortCol = columns.find(c => c.id === id);
    if (!id || !table.isSortable() || !sortCol?.sortable()) {
      return data;
    }

    const sortColIdx = columns.indexOf(sortCol);
    const sortDir = dir === 'asc' ? 1 : -1;
    return data.sort((a, b) => sortCol.sort(a.cells[sortColIdx]!.value, b.cells[sortColIdx]!.value) * sortDir);
  });

  constructor() {
    effect(() => {
      this.activateRow.emit(this.activeRow());
    });

    effect(() => {
      this.selectRows.emit(this.selectedRows());
    });

    effect(cleanup => {
      const context = this._resizeContext();
      if (!context) {
        return;
      }

      const {originalX, column, originalWidth} = context;
      untracked(() => {
        const mouseMoveSub = fromEvent<MouseEvent>(document, 'mousemove').subscribe(event => {
          const width = Math.max(50, originalWidth + (event.x - originalX));
          this.columnWidthOverrides.update(overrides => new Map(overrides).set(column.id, `${width}px`));
        });

        const mouseUpSub = fromEvent(document, 'mouseup').subscribe(() => {
          this._resizeContext.set(undefined);
        });

        cleanup(() => {
          mouseMoveSub.unsubscribe();
          mouseUpSub.unsubscribe();
        });
      });
    });
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

  protected onResizeMouseDown(column: SciColumn<T, ValueType>, event: MouseEvent): void {
    const target = event.target as HTMLElement;
    this._resizeContext.set({originalX: event.x, originalWidth: target.parentElement!.clientWidth, column});
  }

  protected onResizeDblClick(column: SciColumn<T, ValueType>): void {
    const cellWidths = this.cells()
      .filter(c => c.nativeElement.dataset['column'] === column.id)
      .map(c => c.nativeElement.offsetWidth);
    const maxWidth = Math.max(...cellWidths) + 20;
    this.columnWidthOverrides.update(overrides => new Map(overrides).set(column.id, `${maxWidth}px`));
  }

  protected onRowClick(row: T, index: number, event: MouseEvent): void {
    this.selectRow(row, index, !event.ctrlKey && !event.metaKey);
  }

  protected onRowEnter(row: T, index: number): void {
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
        return selection.filter(s => s !== existing);
      }

      if (replace) {
        return [rowSelection];
      }

      return [...selection, rowSelection];
    });
  }
}
