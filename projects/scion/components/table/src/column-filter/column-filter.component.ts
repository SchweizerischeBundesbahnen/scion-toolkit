import {ChangeDetectionStrategy, Component, effect, inject, input} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciColumns} from '../table.model';
import {combineLatestWith, debounceTime} from 'rxjs';
import {ɵSciTable} from '../ɵtable.model';

@Component({
  selector: 'sci-column-filter',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './column-filter.component.html',
  styleUrl: './column-filter.component.scss',
})
export class ColumnFilterComponent<T> {

  public readonly column = input.required<SciColumns<T>>();
  public readonly table = input.required<ɵSciTable<T>>();

  protected readonly query = inject(FormBuilder).control<string | boolean | number>('');

  constructor() {
    effect(() => {
      const filterCriterion = this.table().filterCriteria().find(fc => fc.columnName === this.column().name);
      this.query.setValue(filterCriterion?.text ?? '', {emitEvent: false});
    });

    this.query.valueChanges.pipe(
      combineLatestWith(toObservable(this.table), toObservable(this.column)),
      takeUntilDestroyed(),
      debounceTime(200),
    ).subscribe(([value, table, column]) => {
      const text = typeof value === 'string' ? value.trim() : value;

      if (text === '' || text === null) {
        table.filter(column.name, null);
        return;
      }

      switch (column.type) {
        case 'boolean':
          table.filter(column.name, text === 'true');
          break;
        default:
          table.filter(column.name, text);
          break;
      }
    });
  }

  protected reset(): void {
    this.query.reset('');
  }
}
