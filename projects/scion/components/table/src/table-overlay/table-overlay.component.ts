import {Component, computed, inject, input, output, Signal} from '@angular/core';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {ɵSCI_TABLE, ɵSciTable} from '../ɵtable.model';
import {SciColumnLike} from '../table.model';

export const TABLE_OVERLAY_SELECTOR = 'sci-table-overlay';

@Component({
  selector: TABLE_OVERLAY_SELECTOR,
  imports: [
    SciSplitterComponent,
  ],
  host: {
    '(wheel)': 'onMouseWheel($event)',
  },
  templateUrl: './table-overlay.component.html',
  styleUrl: './table-overlay.component.scss',
})
export class TableOverlayComponent<T> {

  public columnWidths = input.required<Map<`column:${string}`, number>>();

  public readonly autoResize = output<SciColumnLike<T>>();
  public readonly widthChange = output<void>();
  public readonly scrollBy = output<number>();

  protected table = inject(ɵSCI_TABLE) as Signal<ɵSciTable<T>>;

  protected readonly resizing = computed(() => this.table().resizingState() !== undefined);

  protected onResizeStart(column: SciColumnLike<T>): void {
    this.table().resizingState.set({
      column,
      initialFractionColumns: new Set(this.table().columns().filter(c => !c.absoluteWidth && c.isFraction && c !== column).map(column => column.name)),
      temporaryColumnWidths: this.calculateTemporaryColumns(column),
    });
  }

  protected onResize(column: SciColumnLike<T>, event: SplitterMoveEvent): void {
    const columnIndex = this.table().columns().findIndex(c => c.name === column.name);
    if (columnIndex < 0) {
      return;
    }

    this.table().resizingState.update(state => {
      if (!state) {
        return state;
      }
      const width = this.fromPx(state.temporaryColumnWidths.get(column.name)!) + event.distance;
      return ({
        ...state,
        temporaryColumnWidths: new Map(state.temporaryColumnWidths).set(column.name, `${Math.max(column.minWidth, Math.min(column.maxWidth ?? width, width))}px`),
      });
    });
    this.widthChange.emit();
  }

  protected onResizeEnd(): void {
    const {column, temporaryColumnWidths, initialFractionColumns} = this.table().resizingState()!;
    // Recalculate fraction ratios based on the remaining flexible space.
    const fractionRatios = this.calculateFractionRatios(initialFractionColumns);
    this.table().columns.update(columns => {
      return columns.map(c => {
        if (c.name === column.name) {
          c.absoluteWidth = temporaryColumnWidths.get(c.name)!;
        }

        if (fractionRatios.has(c.name)) {
          c.width = fractionRatios.get(c.name)!;
        }

        return c;
      });
    });

    this.table().resizingState.set(undefined);
  }

  protected onResizeAuto(column: SciColumnLike<T>): void {
    this.autoResize.emit(column);
  }

  protected onMouseLeave(): void {
    // Reset hovered item on mouse leave, because hovering a splitter prevents the reset.
    // This makes sure the row actions disappear when leaving a splitter for another element than a row (i.e. the header)
    this.table().setHoveredId(undefined);
  }

  protected onMouseWheel(event: WheelEvent): void {
    event.preventDefault();
    this.scrollBy.emit(event.deltaY);
  }

  private calculateFractionRatios(factionColumns: Set<`column:${string}`>): Map<`column:${string}`, string> {
    const columnWidths = this.columnWidths();
    const totalFlexWidth = [...columnWidths.entries()].reduce((sum, [name, width]) => factionColumns.has(name) ? sum + width : sum, 0);
    return this.table().columns().reduce((map, column) => {
      if (!factionColumns.has(column.name)) {
        return map;
      }
      return map.set(column.name, `${(columnWidths.get(column.name) ?? 0) / totalFlexWidth}fr`);
    }, new Map<`column:${string}`, string>());
  }

  private calculateTemporaryColumns(resizingColumn: SciColumnLike<T>): Map<`column:${string}`, string> {
    const columnIndex = this.table().columns().indexOf(resizingColumn);
    const columnWidths = this.columnWidths();
    // Only allow columns to the right of the resized column to flex.
    const fractionColumns = new Set(this.table().columns()
      .filter((column, i) => i > columnIndex && column.isFraction && !column.absoluteWidth)
      .map(column => column.name));
    const fractionRatios = this.calculateFractionRatios(fractionColumns);

    return this.table().columns().reduce((map, column) => {
      // 1. Check if column was already resized and use this value.
      // 2. Check if column is a fraction, use the fraction ratio.
      // 3. Use the computed column width in px.
      return map.set(column.name, column.absoluteWidth ?? fractionRatios.get(column.name) ?? `${columnWidths.get(column.name)}px`);
    }, new Map<`column:${string}`, string>());
  }

  private fromPx(value: string): number {
    return +value.substring(0, value.length - 2);
  }
}
