import {Component, computed, ElementRef, input, output, viewChildren} from '@angular/core';
import {SciRow} from '../table.model';

@Component({
  selector: 'sci-table-row',
  imports: [],
  templateUrl: './table-row.component.html',
  styleUrl: './table-row.component.scss',
  host: {
    '[class.active]': 'isActive()',
    '[class.selected]': 'isSelected()',
    '(click)': 'onRowClick($event)',
    '(keydown.enter)': 'onRowEnter()',
  },
})
export class TableRowComponent<T> {

  public readonly row = input.required<SciRow<T>>();
  public readonly index = input.required<number>();

  // TODO [eg]: Move row selection to service
  public readonly selectedRows = input.required<number[]>();
  public readonly activeRow = input<number>();
  public readonly activateRow = output();
  public readonly selectRow = output<{ctrlKey: boolean}>();

  protected readonly cells = viewChildren<ElementRef<HTMLDivElement>>('cell');

  protected readonly isActive = computed(() => this.index() === this.activeRow());
  protected readonly isSelected = computed(() => this.selectedRows().includes(this.index()));

  // TODO [eg]: Should we access this differently?
  public getCellWidth(columnId: string): number {
    return this.cells().find(cell => cell.nativeElement.dataset['column'] === columnId)?.nativeElement.offsetWidth ?? 0;
  }

  protected onRowEnter(): void {
    this.activateRow.emit();
  }

  protected onRowClick(event: PointerEvent): void {
    this.selectRow.emit({ctrlKey: event.ctrlKey || event.metaKey});
  }
}
