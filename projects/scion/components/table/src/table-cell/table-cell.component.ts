/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, ElementRef, input, viewChild} from '@angular/core';
import {SciCells} from '../table.model';
import {NgTemplateOutlet} from '@angular/common';
import {SciIconComponent} from '../../../icon/src/icon.component';
import {SciComponentOutletDirective} from '@scion/components/common';

@Component({
  selector: 'sci-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrl: './table-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-type]': 'cell().type',
    '[attr.part]': 'cell().part',
  },
  imports: [
    NgTemplateOutlet,
    SciIconComponent,
    SciComponentOutletDirective,
  ],
})
export class TableCellComponent<T> {

  public readonly cell = input.required<SciCells>();
  public readonly item = input.required<T>();

  protected readonly templateContext = computed(() => {
    const cell = this.cell();
    const item = this.item();

    if (cell.type !== 'template') {
      return null;
    }

    return {
      $implicit: item,
      ...cell.template().context,
    };
  });

  private readonly _cellElement = viewChild.required<ElementRef<HTMLDivElement>>('cellElement');

  public getWidth(): number {
    return this._cellElement().nativeElement.offsetWidth;
  }
}
