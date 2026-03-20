import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, signal} from '@angular/core';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {SciColumns} from '../table.model';
import {ColumnFilterComponent} from '../column-filter/column-filter.component';
import {ɵSciTable} from '../ɵtable.model';

@Component({
  selector: 'sci-column-header',
  imports: [
    SciSplitterComponent,
    ColumnFilterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './column-header.component.html',
  styleUrl: './column-header.component.scss',
})
export class ColumnHeaderComponent<T> {

  public readonly column = input.required<SciColumns<T>>();
  public readonly table = input.required<ɵSciTable<T>>();

  public readonly autoResize = output();
  public readonly widthChange = output<number>();

  private readonly _element = inject(ElementRef);

  private readonly _resizeContext = signal<{width: number; columnName: string} | undefined>(undefined);

  protected readonly columnSort = computed(() => this.table().sortCriteria().find(s => s.columnName === this.column().name)?.direction);

  public getWidth(): number {
    return (this._element.nativeElement as HTMLElement).clientWidth;
  }

  protected onResizeStart(): void {
    this._resizeContext.set({width: this.getWidth(), columnName: this.column().name});
  }

  protected onResize(event: SplitterMoveEvent): void {
    const context = this._resizeContext();
    if (!context) {
      return;
    }

    const column = this.column();
    const width = Math.max(0, context.width + event.distance);
    this._resizeContext.set({columnName: column.name, width});
    this.widthChange.emit(width);
  }

  protected onResizeEnd(): void {
    this._resizeContext.set(undefined);
  }

  protected onResizeAuto(): void {
    this.autoResize.emit();
  }

  protected onSort(event: PointerEvent): void {
    this.table().sort(this.column().name, event.ctrlKey || event.metaKey);
  }
}
