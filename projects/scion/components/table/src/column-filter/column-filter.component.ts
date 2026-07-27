/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, effect, inject, input} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {FormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciColumnLike} from '../table.model';
import {combineLatestWith, debounceTime, of} from 'rxjs';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {coerceObservable} from '../common';
import {AsyncPipe} from '@angular/common';
import {SciIconComponent} from '../../../icon/src/icon.component';

@Component({
  selector: 'sci-column-filter',
  imports: [ReactiveFormsModule, AsyncPipe, SciIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './column-filter.component.html',
  styleUrl: './column-filter.component.scss',
})
export class ColumnFilterComponent<T> {

  public readonly column = input.required<SciColumnLike<T>>();

  protected readonly query = inject(FormBuilder).control<string | boolean | number>('');
  private readonly _table = inject(ɵSCI_TABLE);

  protected readonly filterValues = computed(() => {
    const column = this.column();

    if (column.type === 'boolean' || !column.filterValues) {
      return of(undefined);
    }

    return coerceObservable(column.filterValues);
  });

  constructor() {
    effect(() => {
      const filterCriterion = this._table().filterCriteria().find(fc => fc.columnName === this.column().name);
      this.query.setValue(filterCriterion?.text ?? '', {emitEvent: false});
    });

    this.query.valueChanges.pipe(
      combineLatestWith(toObservable(this._table), toObservable(computed(() => this.column().name)), toObservable(computed(() => this.column().type))),
      takeUntilDestroyed(),
      debounceTime(200),
    ).subscribe(([value, table, columnName, type]) => {
      const text = typeof value === 'string' ? value.trim() : value;

      if (text === '' || text === null) {
        table.filter(null, {columnName});
        return;
      }

      switch (type) {
        case 'boolean':
          table.filter(text === 'true', {columnName});
          break;
        case 'number':
          table.filter(+text, {columnName});
          break;
        default:
          table.filter(text, {columnName});
          break;
      }
    });
  }

  protected reset(): void {
    this.query.reset('');
  }
}
