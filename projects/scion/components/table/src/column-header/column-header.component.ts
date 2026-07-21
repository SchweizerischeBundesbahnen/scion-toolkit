/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, output, signal} from '@angular/core';
import {SciColumnLike} from '../table.model';
import {ColumnFilterComponent} from '../column-filter/column-filter.component';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciIconComponent} from '../../../icon/src/icon.component';
import {boundingClientRect} from '@scion/components/dimension';
import {SciTextPipe} from '@scion/components/text';

@Component({
  selector: 'sci-column-header',
  imports: [
    ColumnFilterComponent,
    SciIconComponent,
    SciTextPipe,
  ],
  host: {
    '[class.resizing]': 'resizing()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './column-header.component.html',
  styleUrl: './column-header.component.scss',
})
export class ColumnHeaderComponent<T> {

  public readonly column = input.required<SciColumnLike<T>>();

  public readonly resizeStart = output();
  public readonly resize = output<number>();
  public readonly autoResize = output();

  protected readonly table = inject(ɵSCI_TABLE);
  private readonly _element = inject(ElementRef);

  private readonly _lastWidth = signal<number | undefined>(undefined);

  protected readonly columnSort = computed(() => this.table().sortCriteria().find(s => s.columnName === this.column().name)?.direction);
  protected readonly resizing = computed(() => this._lastWidth() !== undefined);

  public readonly boundingClientRect = boundingClientRect(this._element.nativeElement as HTMLElement);

  protected onSort(event: PointerEvent): void {
    this.table().sort(this.column().name, event.ctrlKey || event.metaKey);
  }
}
