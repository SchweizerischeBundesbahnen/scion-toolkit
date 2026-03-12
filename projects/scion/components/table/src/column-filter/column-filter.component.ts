import {ChangeDetectionStrategy, Component, inject, input, output} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciColumns} from '@scion/components/table';
import {debounceTime} from 'rxjs';

@Component({
  selector: 'sci-column-filter',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './column-filter.component.html',
  styleUrl: './column-filter.component.scss',
})
export class ColumnFilterComponent<T> {

  public readonly column = input.required<SciColumns<T>>();
  public readonly filter = output<string | boolean | number | null>();

  protected readonly query = inject(FormBuilder).control<string | boolean | number>('');

  constructor() {
    this.query.valueChanges.pipe(
      takeUntilDestroyed(),
      debounceTime(200),
    ).subscribe(value => {
      const text = typeof value === 'string' ? value.trim() : value;
      switch (this.column().type) {
        case 'boolean':
          this.filter.emit(value === '' ? null : value === 'true');
          break;
        default:
          this.filter.emit(text !== null && text !== '' ? text : null);
          break;
      }
    });
  }

  protected reset(): void {
    this.query.reset('');
  }
}
