import {Component, computed, ElementRef, inject, input, output, signal} from '@angular/core';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {SciColumns} from '@scion/components/table';
import {TableStateService} from '../table-state.service';

@Component({
  selector: 'sci-column-header',
  imports: [
    SciSplitterComponent,
  ],
  templateUrl: './column-header.component.html',
  styleUrl: './column-header.component.scss',
})
export class ColumnHeaderComponent<T> {

  public readonly column = input.required<SciColumns<T>>();
  public readonly sorts = input.required<{columnName: string; direction: 'asc' | 'desc'}[]>();
  public readonly isResizable = input.required<boolean>();
  public readonly isSortable = input.required<boolean>();

  public readonly autoResize = output();
  public readonly sort = output<MouseEvent>();

  private readonly _tableStateService = inject(TableStateService);
  private readonly _element = inject(ElementRef);

  private readonly _resizeContext = signal<{width: number; columnId: string} | undefined>(undefined);

  protected readonly columnSort = computed(() => this.sorts().find(s => s.columnName === this.column().name)?.direction);

  protected onResizeStart(): void {
    this._resizeContext.set({width: (this._element.nativeElement as HTMLElement).offsetWidth, columnId: this.column().name});
  }

  protected onResize(event: SplitterMoveEvent): void {
    const context = this._resizeContext();
    if (!context) {
      return;
    }

    const column = this.column();
    const width = Math.max(20, context.width + event.distance);
    this._resizeContext.set({columnId: column.name, width: width});
    this._tableStateService.setResizedColumn(column.name, `${width}px`);
  }

  protected onResizeEnd(): void {
    this._resizeContext.set(undefined);
  }

  protected onResizeAuto(): void {
    this.autoResize.emit();
  }

  protected onSort($event: PointerEvent): void {
    this.sort.emit($event);
  }
}
