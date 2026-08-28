/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, ElementRef, inject, input, Signal, TemplateRef, viewChild} from '@angular/core';
import {SciCellLike, SciRow} from '../table.model';
import {NgTemplateOutlet} from '@angular/common';
import {SciIconComponent} from '../../../icon/src/icon.component';
import {coerceSignal, SciComponentOutletDirective} from '@scion/components/common';
import {Arrays} from '@scion/toolkit/util';

@Component({
  selector: 'sci-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrl: './table-cell.component.scss',
  host: {
    '[attr.data-type]': 'cell().type',
    '[attr.data-column]': 'cell().columnName',
    '[attr.part]': 'isSelected() ? null : partAttribute()', // prevent styling selected rows
  },
  imports: [
    NgTemplateOutlet,
    SciIconComponent,
    SciComponentOutletDirective,
  ],
})
export class TableCellComponent<T> {

  public readonly cell = input.required<SciCellLike>();
  public readonly row = input.required<SciRow<T>>();
  public readonly isSelected = input<boolean>();

  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly _cellElement = viewChild.required<ElementRef<HTMLDivElement>>('cellElement');

  protected readonly template = this.computeTemplate();
  protected readonly templateContext = this.computeTemplateContext();
  protected readonly partAttribute = this.computePartAttribute();

  // TODO [Etienne] Padding is included in offset width and client width! Revisit!
  public getWidth(): number {
    const paddingStr = getComputedStyle(this._host).paddingRight;
    // The actual column width has to include the cell padding, so the content gets enough space.
    const padding = Number.parseFloat(paddingStr); // cut unit
    const width = Math.ceil(this._cellElement().nativeElement.offsetWidth);
    return isNaN(padding) ? width : padding * 2 + width;
  }

  private computeTemplate(): Signal<TemplateRef<unknown> | null> {
    return computed(() => {
      const cell = this.cell();

      if (cell.type !== 'template') {
        return null;
      }

      return coerceSignal(cell.template.template)();
    });
  }

  private computeTemplateContext(): Signal<{$implicit: NonNullable<T>} | null> {
    return computed(() => {
      const cell = this.cell();
      const item = this.row().item!;

      if (cell.type !== 'template') {
        return null;
      }

      return {
        $implicit: item,
        ...Object.entries(cell.template.context ?? {}).reduce((obj, [key, value]) => ({...obj, [key]: coerceSignal(value)()}), {}),
      };
    });
  }

  private computePartAttribute(): Signal<string> {
    return computed(() => {
      return [
        ...Arrays.coerce(this.row().bindings?.part()),
        this.cell().columnName,
      ].join(' ');
    });
  }
}
