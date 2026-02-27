import {Component, computed, inject, input, output, Signal, signal} from '@angular/core';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {ɵSCI_TABLE, ɵSciTable} from '../ɵtable.model';
import {SciColumnLike} from '../table.model';

@Component({
  selector: 'sci-table-overlay',
  imports: [
    SciSplitterComponent,
  ],
  templateUrl: './table-overlay.component.html',
  styleUrl: './table-overlay.component.scss',
})
export class TableOverlayComponent<T> {

  public columnWidths = input.required<number[]>();

  public readonly resizeStart = output<SciColumnLike<T>>();
  public readonly resize = output<{width: number; column: SciColumnLike<T>}>();
  public readonly autoResize = output<SciColumnLike<T>>();

  private _table = inject(ɵSCI_TABLE) as Signal<ɵSciTable<T>>;

  protected readonly resizing = computed(() => this.resizingColumn() !== undefined);
  protected readonly columnWithWidths = computed(() => {
    const widths = this.columnWidths();
    let left = 0;

    return this._table().columns().map((column, i) => {
      const width = widths[i] ?? 0;
      left += width;
      return {column, left: `calc(${left}px - var(--sci-table-border-size))`, width};
    });
  });
  protected readonly resizingColumn = signal<SciColumnLike<T> | undefined>(undefined);

  protected onResizeStart(column: SciColumnLike<T>): void {
    this.resizeStart.emit(column);
    this.resizingColumn.set(column);
  }

  protected onResize(event: SplitterMoveEvent): void {
    const resizingColumn = this.resizingColumn();
    const column = this.columnWithWidths().find(c => c.column.name === resizingColumn?.name);
    if (column === undefined) {
      return;
    }

    // The min width is always set on columns and will be handled during grid creation.
    const width = column.width + event.distance;
    this.resize.emit({width, column: column.column});
  }

  protected onResizeEnd(): void {
    this.resizingColumn.set(undefined);
  }

  protected onResizeAuto(column: SciColumnLike<T>): void {
    this.autoResize.emit(column);
  }

}
