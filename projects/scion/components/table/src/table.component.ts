/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, effect, ElementRef, inject, Injector, input, output, Provider, Signal, untracked, viewChild, viewChildren, ViewEncapsulation} from '@angular/core';
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
import {contributeMenu, SciToolbarComponent} from '@scion/components/menu';
import {UUID} from '@scion/toolkit/uuid';
import {fromEvent} from 'rxjs';

/**
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
    SciToolbarComponent,
  ],
  providers: [
    provideSciTable(),
    SciTableSelectionService,
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
   * Emits when the user double-clicks a row or presses `Enter` on selected rows.
   */
  public readonly primaryAction = output<SciTableEvent<T>>();

  private readonly _viewport: Signal<ElementRef<HTMLElement>> = viewChild.required(SciTableViewportComponent, {read: ElementRef});
  private readonly _viewportClient = viewChild.required(SciTableGridComponent, {read: ElementRef});
  private readonly _tableHeader = viewChild(SciTableHeaderComponent, {read: ElementRef});
  private readonly _tableBody = viewChild.required(SciTableBodyComponent, {read: ElementRef});
  private readonly _itemSizeSyntheticElement = viewChild.required<ElementRef<HTMLElement>>('item_size_synthetic_element');
  private readonly _cellPaddingSyntheticElement = viewChild.required<ElementRef<HTMLElement>>('cell_padding_synthetic_element');
  private readonly _rowActionsToolbar = viewChild.required(SciToolbarComponent);
  private readonly _rowActionsToolbarElement: Signal<ElementRef<HTMLElement>> = viewChild.required('row_actions', {read: ElementRef<HTMLElement>});

  protected readonly rows = viewChildren(SciTableRowComponent);
  protected readonly rowActionsToolbarName = `toolbar:${UUID.randomUUID()}` as const;

  constructor() {
    this.connectToModel();
    this.scrollActiveRowIntoViewport();
    this.contributeRowActions();
  }

  protected onRowPrimaryAction(event: SciTableEvent<T>): void {
    this.primaryAction.emit(event);
  }

  protected onRetry(): void {
    this.table().reset();
  }

  protected onRowActionsToolbarClick(): void {
    const hoveredRow = this.table().hoveredRow();
    this.table().activeItem.set(hoveredRow!.item);
  }

  protected onRowActionToolbarWheel(event: WheelEvent): void {
    // Enable scrolling when hoving toolbar.
    this._viewport().nativeElement.scrollBy({top: event.deltaY});
    event.preventDefault();
  }

  private connectToModel(): void {
    const viewportDimension = dimension(this._viewport);
    const viewportClientDimension = dimension(this._viewportClient);
    const tableHeaderDimension = dimension(this._tableHeader);
    const tableBodyDimension = dimension(this._tableBody);
    const cellPadding = dimension(this._cellPaddingSyntheticElement);
    const itemSizeDimension = dimension(this._itemSizeSyntheticElement);
    const rowActionsDimension = dimension(this._rowActionsToolbarElement);

    effect(onCleanup => {
      const name = this.name();
      const table = this.table();
      const viewport = this._viewport().nativeElement;

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
          rowActionsHeight: computed(() => rowActionsDimension().offsetHeight),
          scrollToTop: () => viewport.scrollTo({top: 0}),
        });
        onCleanup(() => table.disconnect());
      });
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

  private contributeRowActions(): void {
    const injector = inject(Injector);

    // Contribute row actions and display toolbar popover.
    effect(onCleanup => {
      const rowActionsFactoryFn = this.table().rowActions;
      if (!rowActionsFactoryFn) {
        return;
      }

      const hoveredRow = this.table().hoveredRow();
      if (!hoveredRow || hoveredRow.loading) {
        return;
      }

      const toolbarElement = this._rowActionsToolbarElement().nativeElement;
      untracked(() => {
        // Contribute row actions for hovered row.
        const contribution = contributeMenu(this.rowActionsToolbarName, toolbar => {
          rowActionsFactoryFn(toolbar, hoveredRow.item!, hoveredRow.index);
        }, {injector});

        // Display row actions popover.
        toolbarElement.showPopover();

        // Dispose contribution when closing the popover (e.g., via light dismiss).
        const onCloseSubscription = fromEvent<ToggleEvent>(toolbarElement, 'toggle').subscribe(event => {
          if (event.newState === 'closed') {
            contribution.dispose();
          }
        });

        onCleanup(() => {
          toolbarElement.hidePopover();
          contribution.dispose();
          onCloseSubscription.unsubscribe();
        });
      });
    });

    // Track whether menu has been opened in row actions toolbar.
    effect(onCleanup => {
      if (this._rowActionsToolbar().menuOpen()) {
        this.table().rowActionsMenuOpen.set(true);
        onCleanup(() => this.table().rowActionsMenuOpen.set(false));
      }
    });
  }
}

function provideSciTable(): Provider {
  return {
    provide: ɵSCI_TABLE,
    useFactory: () => inject(SciTableComponent).table,
  };
}
