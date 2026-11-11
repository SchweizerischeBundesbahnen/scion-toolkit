/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, effect, ElementRef, inject, input, output, Provider, untracked, viewChild, viewChildren, ViewEncapsulation} from '@angular/core';
import {SciTable, SciTableEvent} from './table.model';
import {ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {SciScrollbarComponent} from '@scion/components/viewport';
import {dimension} from '@scion/components/dimension';
import {SciTableSelectionService} from './table-selection.service';
import {SciTableRowComponent} from './table-row/table-row.component';
import {SciTableKeyboardNavigatorDirective} from './table-keyboard-navigator.directive';
import {SciTableColumnsComponent} from './table-columns/table-columns.component';
import {SciTextPipe} from '@scion/components/text';
import {SciThrobberComponent} from '@scion/components/throbber';
import {SciTableViewportComponent} from './table-viewport.component';
import {SciTableGridComponent} from './table-grid.component';
import {SciTableBodyComponent} from './table-body.component';
import {SciTableHeaderComponent} from './table-header/table-header.component';
import {SciAttributesDirective} from '@scion/components/common';
import {SciIconComponent} from '@scion/components/icon';

/**
 * Provides a table to display tabular or hierarchical data.
 *
 * ### Usage
 *
 * Create a table using the `table()` function, passing a signal containing the items to display in the table and a factory function to define the columns.
 * Alternatively, pass a descriptor to display a tree structure, configure a custom datasource, or set additional options.
 *
 * ```ts
 * import {SciTableComponent, table} from '@scion/components/table';
 * import {httpResource} from '@angular/common/http';
 *
 * // Load data to display in the table.
 * const users = httpResource<User[]>(() => '/api/users', {defaultValue: []});
 *
 * // Create the table and pass data.
 * const userTable = table(users.value, table => table
 *   .addNumberColumn('ID', user => user.id)
 *   .addStringColumn('Name', user => user.name)
 *   .addBooleanColumn('Inactive', user => user.inactive)
 *   .addDateColumn('Expiration', user => user.expiration),
 * );
 * ```
 *
 * In the HTML, bind the created table instance to `<sci-table>` and assign it a name.
 * The name must start with the `table:` prefix and is used to store user settings.
 *
 * ```html
 * <sci-table name="table:users" [table]="userTable"/>
 * ```
 *
 * ### Fixed Row Height
 *
 * All rows in the table must have equal height, which is `2em` by default. The height can be changed per table using the CSS variable `--sci-table-row-height`.
 *
 * ```scss
 * sci-table {
 *   --sci-table-row-height: 30px;
 * }
 * ```
 *
 * ### Styling
 *
 * The appearance of the table can be customized using the following CSS variables, either globally in the `:root` or at the table level.
 *
 * - `--sci-table-gridline-color`
 * - `--sci-table-header-height`
 * - `--sci-table-header-cursor`
 * - `--sci-table-header-background-color`
 * - `--sci-table-header-background-color-hover`
 * - `--sci-table-header-font-family`
 * - `--sci-table-header-font-size`
 * - `--sci-table-header-font-weight`
 * - `--sci-table-header-text-color`
 * - `--sci-table-header-column-divider`
 * - `--sci-table-row-height`
 * - `--sci-table-row-indent`
 * - `--sci-table-row-background-color-hover`
 * - `--sci-table-row-background-color-selected`
 * - `--sci-table-row-border-radius`
 * - `--sci-table-row-outline-color`
 * - `--sci-table-row-outline-width`
 * - `--sci-table-row-outline-style`
 * - `--sci-table-row-action-background-color`
 * - `--sci-table-row-action-background-color-selected`
 * - `--sci-table-cell-padding-inline`
 *
 * @experimental since 22.3.0; API and behavior may change in any version without notice.
 */
@Component({
  selector: 'sci-table',
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
  encapsulation: ViewEncapsulation.ShadowDom,
  host: {
    '[attr.name]': 'name()', // Public API: Enables selecting the table by name in CSS (also if the table has a dynamic name input binding)
    '[style.--ɵsci-table-scrolling]': 'table().scrolling() ? `true` : null',
    '[style.--ɵsci-table-resizing]': 'table().resizing() ? `true` : null',
  },
  imports: [
    SciTableViewportComponent,
    SciTableHeaderComponent,
    SciTableGridComponent,
    SciTableBodyComponent,
    SciTableRowComponent,
    SciTableColumnsComponent,
    SciTableKeyboardNavigatorDirective,
    SciAttributesDirective,
    SciScrollbarComponent,
    SciTextPipe,
    SciThrobberComponent,
    SciIconComponent,
  ],
  providers: [
    provideSciTable(),
    SciTableSelectionService,
  ],
})
export class SciTableComponent<T = unknown, ID = T> {

  /**
   * Specifies a unique table identifier, used as the key for storing user preferences.
   */
  public readonly name = input.required<`table:${string}`>();

  /**
   * Specifies the table definition and datasource.
   */
  public readonly table = input.required({transform: (table: SciTable<ID>) => table as ɵSciTable<T, ID>});

  /**
   * Emits when the user double-clicks a row or presses `Enter` on selected rows.
   */
  public readonly primaryAction = output<SciTableEvent<ID>>();

  private readonly _viewport = viewChild.required(SciTableViewportComponent, {read: ElementRef});
  private readonly _viewportClient = viewChild.required(SciTableGridComponent, {read: ElementRef});
  private readonly _tableHeader = viewChild(SciTableHeaderComponent, {read: ElementRef});
  private readonly _tableBody = viewChild.required(SciTableBodyComponent, {read: ElementRef});
  private readonly _itemSizeSyntheticElement = viewChild.required<ElementRef<HTMLElement>>('item_size_synthetic_element');
  private readonly _cellPaddingSyntheticElement = viewChild.required<ElementRef<HTMLElement>>('cell_padding_synthetic_element');

  protected readonly rows = viewChildren(SciTableRowComponent);

  constructor() {
    this.connectToModel();
    this.scrollActiveRowIntoViewport();
  }

  protected onRowPrimaryAction(event: SciTableEvent<ID>): void {
    this.primaryAction.emit(event);
    event.items.forEach(item => this.table().toggleRow(item));
  }

  protected onRetry(): void {
    this.table().reloadFailed();
  }

  private connectToModel(): void {
    const viewportDimension = dimension(this._viewport);
    const viewportClientDimension = dimension(this._viewportClient);
    const tableHeaderDimension = dimension(this._tableHeader);
    const tableBodyDimension = dimension(this._tableBody);
    const cellPadding = dimension(this._cellPaddingSyntheticElement);
    const itemSizeDimension = dimension(this._itemSizeSyntheticElement);

    effect(onCleanup => {
      const name = this.name();
      const table = this.table();
      const viewport = this._viewport().nativeElement as HTMLElement;

      untracked(() => {
        table.connect(name, {
          viewport: viewport,
          viewportHeight: computed(() => viewportDimension().clientHeight - (tableHeaderDimension()?.offsetHeight ?? 0)),
          viewportWidth: computed(() => viewportDimension().clientWidth),
          viewportClientHeight: computed(() => viewportClientDimension().offsetHeight),
          viewportClientWidth: computed(() => tableBodyDimension().offsetWidth), // Use `table-body` instead of `table-grid` because `table-grid` has `min-width: 100%`, thus never shrinking below viewport width.
          cellPadding: computed(() => cellPadding().clientWidth),
          headerHeight: computed(() => tableHeaderDimension()?.offsetHeight ?? 0),
          itemHeight: computed(() => itemSizeDimension().offsetHeight),
          scrollToTop: () => viewport.scrollTo({top: 0}),
        });
        onCleanup(() => table.disconnect());
      });
    });
  }

  private scrollActiveRowIntoViewport(): void {
    effect(() => {
      const activeItem = this.table().activeItem();
      if (activeItem === undefined) {
        return;
      }

      untracked(() => {
        const viewport = this._viewport().nativeElement as HTMLElement;
        const viewportHeight = this.table().tableViewRef()?.viewportHeight() ?? 0;
        const itemHeight = this.table().tableViewRef()?.itemHeight() ?? 0;
        const activeIndex = this.table().rowIndexById().get(activeItem) ?? -1;

        const activeRowTop = activeIndex * itemHeight;
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
