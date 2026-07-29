/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {inject, Injectable, Signal} from '@angular/core';
import {ɵSCI_TABLE, ɵSciTable} from './ɵtable.model';
import {rangeInclusive} from './common';

@Injectable()
export class TableSelectionService<T, ID = T> {

  private _table = inject(ɵSCI_TABLE) as Signal<ɵSciTable<T, ID>>;

  public onRowClick(index: number, event: {ctrlKey: boolean; shiftKey: boolean; metaKey: boolean}): void {
    const table = this._table();
    const rowsByIndex = table.rowsByIndex();
    const id = rowsByIndex.get(index)?.id;
    const previousFocusedIndex = table.activeIndex();

    table.setActiveItem(id);

    if (id === undefined || table.selectionType() === 'disabled') {
      return;
    }

    if (table.selectionType() === 'single') {
      this.toggleSelectedItem(id);
      return;
    }

    if (event.shiftKey && previousFocusedIndex >= 0) {
      const start = Math.min(previousFocusedIndex, index);
      const end = Math.max(previousFocusedIndex, index);
      const ids = rangeInclusive(start, end).map(i => rowsByIndex.get(i)?.id);

      if (ids.every(id => id !== undefined)) {
        // Only add shift click selection if all items are loaded.
        table.updateSelectedItems(existing => new Set([...existing, ...(ids as Array<ID>)]));
      }
      else {
        // If not all id's could be found (big range is selected) treat the selection as normal click.
        table.updateSelectedItems(() => new Set([id]));
      }
    }
    else if (event.ctrlKey || event.metaKey) {
      this.toggleSelectedItem(id);
    }
    else {
      // If no modifier is pressed set the selection to the clicked row.
      table.updateSelectedItems(() => new Set([id]));
    }
  }

  public onArrowUp(event: Event): void {
    event.preventDefault();

    const focusedIndex = this._table().activeIndex();
    if (focusedIndex <= 0) {
      return;
    }

    // Also add the current focused item on shift+arrowUp.
    this.addItemsToSelection(this._table().rowsByIndex().get(focusedIndex)?.id, event as KeyboardEvent);
    this.addItemsToSelection(this._table().rowsByIndex().get(focusedIndex - 1)?.id, event as KeyboardEvent);
  }

  public onArrowDown(event: Event): void {
    event.preventDefault();

    const focusedIndex = this._table().activeIndex();
    const table = this._table();
    const lastIndex = this.rowCount(table) - 1;
    if (focusedIndex >= lastIndex) {
      return;
    }

    // Also add the current focused item on shift+arrowDown.
    this.addItemsToSelection(table.rowsByIndex().get(focusedIndex)?.id, event as KeyboardEvent);
    // If the focusedIndex was not found (-1) select the first item (0).
    this.addItemsToSelection(table.rowsByIndex().get(focusedIndex + 1)?.id, event as KeyboardEvent);
  }

  public onControlSpace(event: Event): void {
    event.preventDefault();
    if (this._table().selectionType() === 'disabled') {
      return;
    }

    const activeId = this._table().activeItem();
    if (activeId === undefined) {
      return;
    }

    this.toggleSelectedItem(activeId);
  }

  public onControlA(event: Event): void {
    event.preventDefault();

    const table = this._table();
    if (table.selectionType() === 'single') {
      return;
    }

    const rowsByIndex = table.rowsByIndex();
    const ids = [...rowsByIndex.values()].map(row => row.id).filter((id): id is ID => !!id);

    // If all rows are loaded, add all to selection, else toggle all selected flag.
    if (rowsByIndex.size === this.rowCount(table)) {
      table.updateSelectedItems(() => new Set(ids));
    }
    else {
      table.selectAll();
    }
  }

  private rowCount(table: ɵSciTable<T, ID>): number {
    return table.totalCount() === undefined ? table.visibleRowCount() : table.totalCount()!;
  }

  private addItemsToSelection(item: ID | undefined, event: KeyboardEvent): void {
    const table = this._table();

    if (item !== undefined) {
      table.setActiveItem(item);
    }

    if (table.selectionType() === 'disabled' || item === undefined) {
      return;
    }

    if (event.shiftKey && table.selectionType() === 'multi') {
      table.updateSelectedItems(ids => new Set(ids).add(item));
    }
    else if (!event.ctrlKey && !event.metaKey) { // Don't update selected items at all when control is pressed.
      table.updateSelectedItems(() => new Set([item]));
    }
  }

  private toggleSelectedItem(id: ID): void {
    this._table().updateSelectedItems(selection => {
      const next = new Set(selection);
      if (next.has(id)) {
        next.delete(id);
      }
      else {
        if (this._table().selectionType() === 'single') {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  }
}
