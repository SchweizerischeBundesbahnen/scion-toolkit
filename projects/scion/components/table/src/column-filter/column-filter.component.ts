/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, debounced, effect, inject, input, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {SciColumnLike} from '../table.model';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciIconComponent} from '@scion/components/icon';
import {firstValueFrom, timer} from 'rxjs';

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
    this.bindToModel();
  }

  private bindToModel(): void {
    const filterDebounced = debounced(this.filter, async value => {
      // Debounce only if not empty.
      if (value !== null && value !== '') {
        await firstValueFrom(timer(200));
      }
    });

    effect(() => {
      const text = trim(filterDebounced.value());
      const table = this._table();
      const column = this.column();

      if (text === '' || text === null) {
        table.filter(null, {columnName: column.name});
      }
      else if (column.type === 'boolean') {
        table.filter(text === 'true', {columnName: column.name});
      }
      else {
        table.filter(text, {columnName: column.name});
      }
    });
  }

  protected reset(): void {
    this.filter.set(null);
  }
}

function trim(value: string | number | boolean | null): string | number | boolean | null {
  return typeof value === 'string' ? value.trim() : value;
}
