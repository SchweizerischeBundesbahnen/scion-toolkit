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
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {SciColumns} from '../table.model';
import {ColumnFilterComponent} from '../column-filter/column-filter.component';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciIconComponent} from '../../../icon/src/icon.component';

@Component({
  selector: 'sci-column-header',
  imports: [
    SciSplitterComponent,
    ColumnFilterComponent,
    SciIconComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './column-header.component.html',
  styleUrl: './column-header.component.scss',
})
export class ColumnHeaderComponent<T> {

  public readonly column = input.required<SciColumns<T>>();

  public readonly autoResize = output();

  protected readonly table = inject(ɵSCI_TABLE);
  private readonly _element = inject(ElementRef);

  private readonly _lastWidth = signal<number | undefined>(undefined);

  protected readonly columnSort = computed(() => this.table().sortCriteria().find(s => s.columnName === this.column().name)?.direction);

  public getWidth(): number {
    return (this._element.nativeElement as HTMLElement).clientWidth;
  }

  protected onResizeStart(): void {
    this._lastWidth.set(this.getWidth());
  }

  protected onResize(event: SplitterMoveEvent): void {
    const lastWidth = this._lastWidth();
    if (!lastWidth) {
      return;
    }

    const width = Math.max(0, lastWidth + event.distance);
    this._lastWidth.set(width);
    this.table().setResizedColumn(this.column().name, width);
  }

  protected onResizeEnd(): void {
    this._lastWidth.set(undefined);
  }

  protected onResizeAuto(): void {
    this.autoResize.emit();
  }

  protected onSort(event: PointerEvent): void {
    this.table().sort(this.column().name, event.ctrlKey || event.metaKey);
  }
}
