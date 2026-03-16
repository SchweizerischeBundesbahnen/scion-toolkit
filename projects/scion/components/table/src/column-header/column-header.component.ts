import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, signal} from '@angular/core';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {SciColumns} from '@scion/components/table';
import {TableStateService} from '../table-state.service';
import {SciSortCriterion} from '../table-data-source';
import {ColumnFilterComponent} from '../column-filter/column-filter.component';

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
  public readonly sorts = input.required<SciSortCriterion[]>();

  public readonly autoResize = output();
  public readonly sort = output<MouseEvent>();
  public readonly filter = output<string | boolean | number | null>();

  private readonly _tableStateService = inject(TableStateService);
  private readonly _element = inject(ElementRef);

  private readonly _resizeContext = signal<{width: number; columnName: string} | undefined>(undefined);

  protected readonly columnSort = computed(() => this.sorts().find(s => s.columnName === this.column().name)?.direction);

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
    const width = Math.max(20, context.width + event.distance);
    this._resizeContext.set({columnName: column.name, width});
    this._tableStateService.setResizedColumn(column.name, width);
  }

  protected onResizeEnd(): void {
    this._resizeContext.set(undefined);
  }

  protected onResizeAuto(): void {
    this.autoResize.emit();
  }

  protected onSort(event: PointerEvent): void {
    this.sort.emit(event);
  }

  protected onFilter(text: string | number | null | boolean): void {
    this.filter.emit(text);
  }
}
