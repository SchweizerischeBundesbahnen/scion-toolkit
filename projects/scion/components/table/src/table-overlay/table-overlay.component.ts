import {Component, computed, inject, input, output, Signal, signal} from '@angular/core';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {ɵSCI_TABLE, ɵSciTable} from '../ɵtable.model';
import {SciColumnLike} from '../table.model';

export const TABLE_OVERLAY_SELECTOR = 'sci-table-overlay';

@Component({
  selector: TABLE_OVERLAY_SELECTOR,
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

  protected table = inject(ɵSCI_TABLE) as Signal<ɵSciTable<T>>;

  protected readonly resizing = computed(() => this.resizingColumn() !== undefined);
  protected readonly resizingColumn = signal<SciColumnLike<T> | undefined>(undefined);

  protected onResizeStart(column: SciColumnLike<T>): void {
    this.resizeStart.emit(column);
    this.resizingColumn.set(column);
  }

  protected onResize(event: SplitterMoveEvent): void {
    const resizingColumn = this.resizingColumn();
    const columnIndex = this.table().columns().findIndex(c => c.name === resizingColumn?.name);
    if (columnIndex < 0 || !resizingColumn) {
      return;
    }

    // The min width is always set on columns and will be handled during grid creation.
    const width = this.columnWidths()[columnIndex]! + event.distance;
    this.resize.emit({width, column: resizingColumn});
  }

  protected onResizeEnd(): void {
    this.resizingColumn.set(undefined);
  }

  protected onResizeAuto(column: SciColumnLike<T>): void {
    this.autoResize.emit(column);
  }

  protected onMouseLeave(): void {
    // Reset hovered item on mouse leave, because hovering a splitter prevents the reset.
    // This makes sure the row actions disappear when leaving a splitter for another element than a row (i.e. the header)
    this.table().setHoveredItem(undefined);
  }
}
