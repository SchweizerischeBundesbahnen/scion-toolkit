/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, ElementRef, inject, input, Provider, viewChild} from '@angular/core';
import {SciTableColumnLike} from '../table.model';
import {ɵSCI_TABLE} from '../ɵtable.model';
import {SciIconComponent} from '@scion/components/icon';
import {NgTemplateOutlet} from '@angular/common';
import {SciTooltipOnOverflowDirective, TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT, TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT} from '@scion/components/common';

@Component({
  selector: 'sci-column-header',
  imports: [
    SciIconComponent,
    NgTemplateOutlet,
  ],
  templateUrl: './column-header.component.html',
  styleUrl: './column-header.component.scss',
  host: {
    '[attr.data-column]': 'column().name',
  },
  hostDirectives: [
    SciTooltipOnOverflowDirective,
  ],
  providers: [
    configureTooltip(),
  ],
})
export class SciColumnHeaderComponent<T> {

  public readonly column = input.required<SciTableColumnLike<T>>();
  public readonly labelElement = viewChild<ElementRef<HTMLElement>>('label'); // public visibility required to be accessible in `configureTooltip` function

  protected readonly table = inject(ɵSCI_TABLE);
  protected readonly sortDirection = computed(() => this.table().sortCriteria().find(criteria => criteria.columnName === this.column().name)?.direction);

  protected onSort(event: PointerEvent): void {
    this.table().sort(this.column().name, event.ctrlKey || event.metaKey);
  }
}

function configureTooltip(): Provider[] {
  return [
    {
      provide: TOOLTIP_ON_OVERFLOW_DIRECTIVE_ADDITIONAL_TEXT,
      useFactory: () => {
        const host = inject(SciColumnHeaderComponent);
        return computed(() => host.column().header.tooltip?.());
      },
    },
    {
      provide: TOOLTIP_ON_OVERFLOW_DIRECTIVE_SOURCE_ELEMENT,
      useFactory: () => inject(SciColumnHeaderComponent).labelElement,
    },
  ];
}
