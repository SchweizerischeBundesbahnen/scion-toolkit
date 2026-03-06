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
import {SciCell} from '../table.model';
import {NgComponentOutlet} from '@angular/common';

@Component({
  selector: 'sci-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrl: './table-cell.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-type]': 'cell().type',
  },
  imports: [
    NgComponentOutlet,
  ],
})
export class TableCellComponent {

  public readonly cell = input.required<SciCell>();

  private readonly _element = inject(ElementRef);

  protected readonly customCell = computed(() => {
    const cell = this.cell();
    return cell.type === 'custom' ? cell.component : undefined;
  });

  protected readonly label = computed(() => {
    const cell = this.cell();
    return cell.type !== 'custom' ? cell.label() : undefined;
  });

  public getWidth(): number {
    return ((this._element.nativeElement as HTMLElement).firstElementChild as HTMLElement | null)?.offsetWidth ?? 0;
  }
}
