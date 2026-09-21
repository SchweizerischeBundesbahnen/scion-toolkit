/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, ElementRef, inject} from '@angular/core';
import {ɵSCI_TABLE} from './ɵtable.model';

/**
 * Represents a semantic element for the table viewport provided as slotted content.
 */
@Component({
  selector: 'sci-table-viewport',
  template: '<ng-content/>',
  host: {
    '[style.--ɵsci-table-viewport-width]': '`${table().tableViewRef()?.viewportWidth() ?? 0}px`',
    '[style.--ɵsci-table-viewport-height]': '`${viewportHeight() ?? 0}px`',
    '[style.--ɵsci-table-viewport-client-width]': '`${table().tableViewRef()?.viewportClientWidth() ?? 0}px`',
    '[style.--ɵsci-table-viewport-client-height]': '`${table().tableViewRef()?.viewportClientHeight() ?? 0}px`',
    '[style.--ɵsci-table-header-height]': '`${table().tableViewRef()?.headerHeight() ?? 0}px`',
    '[style.--ɵsci-table-cell-padding-inline]': '`${table().tableViewRef()?.cellPadding() ?? 0}px`',
    '[style.--ɵsci-table-row-height]': '`${table().tableViewRef()?.itemHeight() ?? 0}px`',
  },
})
export class SciTableViewportComponent {

  public readonly host = inject(ElementRef).nativeElement as HTMLElement;

  protected readonly table = inject(ɵSCI_TABLE);
  protected readonly viewportHeight = computed(() => {
    const viewportHeight = this.table().tableViewRef()?.viewportHeight() ?? 0;
    const headerHeight = this.table().tableViewRef()?.headerHeight() ?? 0;
    return viewportHeight + headerHeight;
  });
}
