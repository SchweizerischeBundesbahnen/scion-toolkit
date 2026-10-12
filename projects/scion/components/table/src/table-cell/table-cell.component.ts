/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, inject, input, Signal, TemplateRef} from '@angular/core';
import {SciTableCellLike, SciTableColumnType, SciTableRow} from '../table.model';
import {NgTemplateOutlet} from '@angular/common';
import {coerceSignal, SciComponentOutletDirective, SciTooltipOnOverflowDirective} from '@scion/components/common';
import {Arrays, Objects} from '@scion/toolkit/util';
import {SciIconComponent} from '@scion/components/icon';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciNumberPipe} from './number.pipe';

@Component({
  selector: 'sci-table-cell',
  templateUrl: './table-cell.component.html',
  styleUrl: './table-cell.component.scss',
  host: {
    '[attr.data-type]': 'cell().column.type',
    '[attr.data-reference-type]': 'referenceType()',
    '[attr.data-column]': 'cell().column.name',
    '[attr.data-value]': 'value()',
    '[attr.data-padding]': '!cell().column.padding ? false : null',
    '[attr.part]': 'partAttribute()',
    '[attr.data-level]': 'row().level',
  },
  imports: [
    NgTemplateOutlet,
    SciIconComponent,
    SciComponentOutletDirective,
    SciNumberPipe,
  ],
  hostDirectives: [
    SciTooltipOnOverflowDirective,
  ],
})
export class SciTableCellComponent<T, ID> {

  public readonly cell = input.required<SciTableCellLike>();
  public readonly row = input.required<SciTableRow<T, ID>>();

  private readonly _table = inject(ɵSCI_TABLE);

  protected readonly template = this.computeTemplate();
  protected readonly templateContext = this.computeTemplateContext();
  protected readonly partAttribute = this.computePartAttribute();
  protected readonly showExpansionControl = computed(() => this.cell().column.showExpansionControl);
  protected readonly value = this.computeValueAttribute();
  protected readonly referenceType = this.computeReferenceType();

  private computeTemplate(): Signal<TemplateRef<unknown> | null> {
    return computed(() => {
      const cell = this.cell();

      if (cell.type !== 'template') {
        return null;
      }

      return coerceSignal(cell.template.template)();
    });
  }

  private computeTemplateContext(): Signal<{$implicit: T} | null> {
    return computed(() => {
      const cell = this.cell();
      const item = this.row().item;

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
      const cell = this.cell();
      const isTree = this._table().isTreeDatasource();

      return Arrays.distinct([
        // Enable column styling based on column type. For enum columns, resolves to the reference type, if any, i.e., boolean or icon.
        `column:${this.referenceType() ?? cell.column.type}`,
        // Enable column styling based on column name.
        cell.column.name,
        // Enable row styling based on selection state.
        this.row().selected() ? `${isTree ? 'node' : 'row'}:selected` : `${isTree ? 'node' : 'row'}:not:selected`,
        // Enable row styling based on active state.
        this.row().active() ? `${isTree ? 'node' : 'row'}:active` : `${isTree ? 'node' : 'row'}:not:active`,
        // Enable row styling based on row bindings.
        ...Arrays.coerce(this.row().bindings.parts()),
      ]).join(' ');
    });
  }

  protected toggleChildren(event: PointerEvent): void {
    event.stopPropagation(); // Stop propagation to not select or activate row.
    this._table().toggleRow(this.row().id);
  }

  private computeReferenceType(): Signal<SciTableColumnType | undefined> {
    return computed(() => {
      const cell = this.cell();
      return cell.type === 'enum' ? cell.column.referenceType : undefined;
    });
  }

  private computeValueAttribute(): Signal<string | undefined> {
    return computed(() => {
      const cell = this.cell();
      const value = (() => {
        switch (cell.type) {
          case 'string':
          case 'number':
            return cell.value();
          case 'enum':
            return cell.value()?.value;
          case 'date':
            return cell.value()?.isoString;
          default:
            return undefined;
        }
      })();
      return value !== undefined ? `${value}` : undefined;
    });
  }
}
