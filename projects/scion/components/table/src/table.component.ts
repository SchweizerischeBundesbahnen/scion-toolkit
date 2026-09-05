/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, effect, ElementRef, inject, input, output, Provider, untracked, viewChild, viewChildren, ViewEncapsulation} from '@angular/core';
import {SciTable} from './table.model';
import {ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {SciScrollbarComponent} from '@scion/components/viewport';
import {dimension} from '@scion/components/dimension';
import {TableSelectionService} from './table-selection.service';
import {ColumnHeaderComponent} from './column-header/column-header.component';
import {TableRowComponent} from './table-row/table-row.component';
import {TableKeyboardNavigatorDirective} from './keyboard-navigator.directive';
import {ColumnSplittersComponent} from './column-splitters/column-splitters.component';
import {SciTextPipe} from '@scion/components/text';
import {SciThrobberComponent} from '@scion/components/throbber';
import {SciTableGridComponent} from './table-grid.component';
import {SciTableBodyComponent} from './table-body.component';
import {SciTableHeaderComponent} from './table-header.component';
import {ColumnBoundsComponent} from './column-bounds/column-bounds.component';
import {SciTableViewportRefDirective} from './table-viewport-ref.directive';
import {SciAttributesDirective} from '@scion/components/common';

@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrls: ['./table.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[attr.name]': 'name()', // Public API: Enables selecting the table by name in CSS (also if the table has a dynamic name input binding)
    '[style.--ɵsci-table-scrolling]': 'table().scrolling() ? `true` : null',
    '[style.--ɵsci-table-resizing]': 'table().resizing() ? `true` : null',
  },
  imports: [
    SciScrollbarComponent,
    ColumnHeaderComponent,
    TableKeyboardNavigatorDirective,
    TableRowComponent,
    SciTextPipe,
    SciThrobberComponent,
    ColumnSplittersComponent, // TODO [egob] Should start with Sci?
    ColumnBoundsComponent, // TODO [egob] Should start with Sci?
    SciTableGridComponent,
    SciTableBodyComponent,
    SciTableHeaderComponent,
    SciTableViewportRefDirective,
    SciAttributesDirective,
  ],
  providers: [
    provideSciTable(),
    TableSelectionService,
  ],
})
export class SciTableComponent<T = unknown> {

  /**
   * Specifies a unique table identifier, used as the key for storing user preferences.
   */
  public readonly name = input.required<`table:${string}`>();

  /**
   * Specifies the table definition and datasource.
   */
  public readonly table = input.required({transform: (table: SciTable<T>) => table as ɵSciTable<T>});

  /**
   * Emits when the user performs a primary action on a row (double-clicking or pressing `Enter`).
   */
  public readonly primaryAction = output<T>();

  private readonly _viewport = viewChild.required<ElementRef<HTMLElement>>('viewport');
  private readonly _viewportClient = viewChild.required(SciTableGridComponent, {read: ElementRef});
  private readonly _header = viewChild(SciTableHeaderComponent, {read: ElementRef});
  private readonly _itemSizeElement = viewChild.required<ElementRef<HTMLElement>>('item_size_element');

  protected readonly rows = viewChildren(TableRowComponent);

  constructor() {
    this.connectToModel();
    this.scrollActiveRowIntoViewport();
    this.scrollTopOnCriteriaChange();
  }

  protected onRowPrimaryAction(item: T): void {
    this.primaryAction.emit(item);
  }

  private connectToModel(): void {
    const viewportDimension = dimension(this._viewport);
    const viewportClientDimension = dimension(this._viewportClient);
    const headerDimension = dimension(this._header);
    const itemSizeDimension = dimension(this._itemSizeElement);

    effect(onCleanup => {
      const name = this.name();
      const table = this.table();
      const viewport = this._viewport().nativeElement;

      untracked(() => {
        table.connect(name, {
          viewport: viewport,
          viewportHeight: computed(() => viewportDimension().clientHeight - (headerDimension()?.offsetHeight ?? 0)),
          viewportClientHeight: computed(() => viewportClientDimension().offsetHeight),
          headerHeight: computed(() => headerDimension()?.offsetHeight ?? 0),
          itemHeight: computed(() => itemSizeDimension().offsetHeight),
        });
        onCleanup(() => table.disconnect());
      });
    });
  }

  /**
   * Scrolls the viewport to the top on filter or sort criteria change.
   */
  private scrollTopOnCriteriaChange(): void {
    effect(() => {
      // Track filter and sort criteria.
      this.table().criteria();
      untracked(() => this._viewport().nativeElement.scrollTo({top: 0}));
    });
  }

  private scrollActiveRowIntoViewport(): void {
    effect(() => {
      const activeRow = this.table().activeRow();
      if (!activeRow) {
        return;
      }

      untracked(() => {
        const viewport = this._viewport().nativeElement;
        const viewportHeight = this.table().tableViewRef()?.viewportHeight() ?? 0;
        const itemHeight = this.table().tableViewRef()?.itemHeight() ?? 0;
        const activeRowTop = activeRow.index * itemHeight;
        const activeRowBottom = activeRowTop + itemHeight;
        const scrollTop = viewport.scrollTop;
        const scrollBottom = scrollTop + viewportHeight;

        if (activeRowTop < scrollTop) {
          viewport.scrollTop = activeRowTop;
        }
        else if (activeRowBottom > scrollBottom) {
          viewport.scrollTop = activeRowBottom - viewportHeight;
        }
      });
    });
  }
}

function provideSciTable(): Provider {
  return {
    provide: ɵSCI_TABLE,
    useFactory: () => inject(SciTableComponent).table,
  };
}
