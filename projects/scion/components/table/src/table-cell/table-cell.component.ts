/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input, viewChild} from '@angular/core';
import {SciCellLike} from '../table.model';
import {NgTemplateOutlet} from '@angular/common';
import {SciIconComponent} from '../../../icon/src/icon.component';
import {coerceSignal, SciComponentOutletDirective} from '@scion/components/common';
import {ɵSCI_TABLE} from '../ɵtable.model';

@Component({
  selector: 'sci-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrl: './table-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-type]': 'cell().type',
    '[attr.data-column]': 'cell().columnName',
    '[attr.part]': 'isSelected() ? null : name()', // prevent styling selected rows
  },
  imports: [
    NgTemplateOutlet,
    SciIconComponent,
    SciComponentOutletDirective,
  ],
})
export class TableCellComponent<T> {

  public readonly cell = input.required<SciCellLike>();
  public readonly item = input.required<T>();
  public readonly isSelected = input<boolean>();

  protected readonly table = inject(ɵSCI_TABLE);
  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;

  protected readonly name = computed(() => this.cell().name.join(' '));

  protected readonly template = computed(() => {
    const cell = this.cell();

    if (cell.type !== 'template') {
      return null;
    }

    return coerceSignal(cell.template.template)();
  });

  protected readonly templateContext = computed(() => {
    const cell = this.cell();
    const item = this.item();

    if (cell.type !== 'template') {
      return null;
    }

    return {
      $implicit: item,
      ...Object.entries(cell.template.context ?? {}).reduce((obj, [key, value]) => ({...obj, [key]: coerceSignal(value)()}), {}),
    };
  });

  private readonly _cellElement = viewChild.required<ElementRef<HTMLDivElement>>('cellElement');

  // TODO [Etienne] Padding is included in offset width and client width! Revisit!
  public getWidth(): number {
    const paddingStr = getComputedStyle(this._host).paddingRight;
    // The actual column width has to include the cell padding, so the content gets enough space.
    const padding =  Number.parseFloat(paddingStr); // cut unit
    const width = Math.ceil(this._cellElement().nativeElement.offsetWidth);
    return isNaN(padding) ? width : padding * 2 + width;
  }
}
