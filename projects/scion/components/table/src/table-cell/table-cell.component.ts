/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, inject, input, Signal, TemplateRef} from '@angular/core';
import {SciCellLike, SciRow} from '../table.model';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {coerceSignal, SciComponentOutletDirective} from '@scion/components/common';
import {Arrays, Objects} from '@scion/toolkit/util';
import {SciIconComponent} from '@scion/components/icon';
import {ɵSCI_TABLE} from '../ɵtable.model';

@Component({
  selector: 'sci-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrl: './table-cell.component.scss',
  host: {
    '[attr.data-type]': 'cell().type',
    '[attr.data-column]': 'cell().column.name',
    '[attr.data-padding]': '!cell().padding ? false : null',
    '[attr.part]': 'isSelected() ? null : partAttribute()', // prevent styling selected rows
    '[attr.data-level]': 'index() === 0 ? row().level : 0',
  },
  imports: [
    NgTemplateOutlet,
    SciIconComponent,
    SciComponentOutletDirective,
    AsyncPipe,
  ],
})
export class TableCellComponent<T> {

  public readonly cell = input.required<SciCellLike>();
  public readonly row = input.required<SciRow<T>>();
  public readonly isSelected = input<boolean>();
  public readonly index = input<number>();

  private readonly _table = inject(ɵSCI_TABLE);

  protected readonly template = this.computeTemplate();
  protected readonly templateContext = this.computeTemplateContext();
  protected readonly partAttribute = this.computePartAttribute();
  protected readonly isExpanded = computed(() => this.row().expanded());

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
        ...Objects.entries(cell.template.context ?? {}).reduce((context, [key, value]) => ({
          ...context,
          [key]: coerceSignal(value)?.(), // eslint-disable-line @typescript-eslint/no-unnecessary-condition
        }), {}),
      };
    });
  }

  private computePartAttribute(): Signal<string> {
    return computed(() => {
      return [
        ...Arrays.coerce(this.row().bindings?.part()),
        this.cell().column.name,
      ].join(' ');
    });
  }

  protected toggleChildren(): void {
    this.row().expanded.update(expanded => !expanded);
  }
}
