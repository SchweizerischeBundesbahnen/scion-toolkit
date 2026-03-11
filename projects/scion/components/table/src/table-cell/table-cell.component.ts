/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, ElementRef, inject, input} from '@angular/core';
import {SciCells} from '../table.model';
import {NgComponentOutlet, NgTemplateOutlet} from '@angular/common';

@Component({
  selector: 'sci-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrl: './table-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-type]': 'cell().type',
    '[attr.part]': 'cell',
  },
  imports: [
    NgComponentOutlet,
    NgTemplateOutlet,
  ],
})
export class TableCellComponent<T> {

  public readonly cell = input.required<SciCells>();
  public readonly item = input.required<T>();

  protected readonly templateContext = computed(() => {
    const cell = this.cell();
    const item = this.item();

    return cell.type === 'template' ? {
      $implicit: item,
      ...cell.template().context,
    } : null;
  });

  private readonly _element = inject(ElementRef);

  public getWidth(): number {
    return ((this._element.nativeElement as HTMLElement).firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
  }
}
