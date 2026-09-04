/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, debounced, inject, input, signal} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {FormsModule} from '@angular/forms';
import {SciColumnLike} from '../table.model';
import {combineLatestWith, debounceTime} from 'rxjs';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciIconComponent} from '@scion/components/icon';

@Component({
  selector: 'sci-column-filter',
  imports: [SciIconComponent, FormsModule],
  templateUrl: './column-filter.component.html',
  styleUrl: './column-filter.component.scss',
})
export class ColumnFilterComponent<T> {

  public readonly column = input.required<SciColumnLike<T>>();

  protected readonly filter = signal<string | boolean | number | null>(null);
  private readonly _table = inject(ɵSCI_TABLE);

  constructor() {
    toObservable(debounced(this.filter, 200).value).pipe(
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
    this.filter.set(null);
  }
}
