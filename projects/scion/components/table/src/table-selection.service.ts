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
import {SciTreeTableRow} from './table-tree.model';

@Injectable()
export class SciTableSelectionService<T, ID> {

  private readonly _table = inject<Signal<ɵSciTable<T, ID>>>(ɵSCI_TABLE);

  public async onRowClick(row: SciTreeTableRow<T, ID>, event: {ctrlKey: boolean; shiftKey: boolean; metaKey: boolean}): Promise<void> {
    const table = this._table();
    const previousActiveRowIndex = table.activeRow()?.index();

    table.setActiveItem(row.id);

    if (row.id === undefined || !table.selectable()) {
      return;
    }

    if (table.selectable() === 'single') {
      table.updateSelectedItems(() => new Set<ID>().add(row.id));
      return;
    }

    if (event.shiftKey && previousActiveRowIndex !== undefined) {
      const start = Math.min(previousActiveRowIndex, row.index());
      const end = Math.max(previousActiveRowIndex, row.index());
      await this.selectItems(start, end, {add: true});
    }
    else if (event.ctrlKey || event.metaKey) {
      this.toggleSelectedItem(row.id);
    }
    else {
      // If no modifier is pressed set the selection to the clicked row.
      table.updateSelectedItems(() => new Set<ID>().add(row.id));
    }
  }

  public async onArrowUp(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeRowIndex = table.activeRow()?.index() ?? -1;
    const targetIndex = Math.max(activeRowIndex - 1, 0);

    await this.selectOnKeyboardNavigation(targetIndex, event as KeyboardEvent);
  }

  public async onArrowDown(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeRowIndex = table.activeRow()?.index() ?? -1;
    const targetIndex = Math.min(activeRowIndex + 1, table.rowCount() - 1);

    await this.selectOnKeyboardNavigation(targetIndex, event as KeyboardEvent);
  }

  // TODO [marc] Mix zwischen rows und nodes
  public async onArrowLeft(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeRow = table.activeRow();

    if (!activeRow || activeRow.loading()) {
      return;
    }

    if (activeRow.children.length && activeRow.expanded()) {
      table.collapse(activeRow.id);
    }
    else if (activeRow.parent) {
      await this.selectOnKeyboardNavigation(activeRow.parent.index(), {shiftKey: false, ctrlKey: false, metaKey: false});
    }
    // Root case
    else {
      const rows = table.rows();
      const row = findPreviousExpandedRow(activeRow.index() - 1);

      if (row !== undefined) {
        await this.selectOnKeyboardNavigation(row.index(), {shiftKey: false, ctrlKey: false, metaKey: false});
      }

      // TODO [dwie] über parent
      function findPreviousExpandedRow(index: number): SciTreeTableRow<T, ID> | undefined {
        while (index > 0) {
          const row = rows[index];
          // Get the row expansion state whether the row is already loaded or not.
          if (row?.expanded()) {
            return row;
          }
          index--;
        }

        // Return the first row if no previous row is expanded.
        return rows[index];
      }
    }
  }

  public async onArrowRight(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeRow = table.activeRow();
    const activeRowIndex = table.activeRow()?.index() ?? -1;
    const endIndex = Math.min(activeRowIndex + 1, table.rowCount() - 1);

    if (activeRow?.children.length && !activeRow.expanded()) {
      table.expand(activeRow.id);
      return;
    }

    await this.selectOnKeyboardNavigation(endIndex, {shiftKey: false, ctrlKey: false, metaKey: false});
  }

  public async onPageUp(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeRowIndex = table.activeRow()?.index() ?? -1;
    const targetIndex = Math.max(activeRowIndex - table.viewportPageSize() + 1, 0);

    await this.selectOnKeyboardNavigation(targetIndex, event as KeyboardEvent);
  }

  public async onPageDown(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeRowIndex = table.activeRow()?.index() ?? -1;
    const targetIndex = Math.min(activeRowIndex + table.viewportPageSize() - 1, table.rowCount() - 1);

    await this.selectOnKeyboardNavigation(targetIndex, event as KeyboardEvent);
  }

  public async onHome(event: Event): Promise<void> {
    event.preventDefault();

    await this.selectOnKeyboardNavigation(0, event as KeyboardEvent);
  }

  public async onEnd(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const targetIndex = table.rowCount() - 1;

    await this.selectOnKeyboardNavigation(targetIndex, event as KeyboardEvent);
  }

  public onSpace(event: Event): void {
    event.preventDefault();

    const table = this._table();
    if (!table.selectable()) {
      return;
    }

    const activeItemId = table.activeItem();
    if (activeItemId === undefined) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;

    if (ctrlOrMeta) {
      this.toggleSelectedItem(activeItemId);
    }
    else {
      table.updateSelectedItems(() => new Set<ID>().add(activeItemId));
    }
  }

  public async onControlA(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const totalCount = table.rowCount();

    if (table.selectable() === 'multi' && totalCount >= 0) {
      await this.selectItems(0, totalCount - 1);
    }
  }

  private async selectOnKeyboardNavigation(targetIndex: number, event: {shiftKey: boolean; ctrlKey: boolean; metaKey: boolean}): Promise<void> {
    const table = this._table();
    const targetItem = table.rows()[targetIndex]?.id;
    const activeRowIndex = table.activeRow()?.index() ?? -1;
    const direction = activeRowIndex > targetIndex ? 'up' : 'down';
    const [startIndex, endIndex] = direction === 'up' ? [targetIndex, activeRowIndex] : [activeRowIndex, targetIndex];
    const shift = event.shiftKey;
    const ctrlOrMeta = event.ctrlKey || event.metaKey;

    if (table.selectable() !== 'multi') {
      // Don't modify selection when only ctrlOrMeta is pressed.
      if (table.selectable() === 'single' && (shift || !ctrlOrMeta)) {
        await this.selectItems(targetIndex, targetIndex);
      }

      table.setActiveItem(targetItem);
      return;
    }

    if (shift && ctrlOrMeta) {
      await this.selectItems(startIndex, endIndex, {add: true});
    }
    else if (shift) {
      await this.selectOnShiftNavigation(direction, startIndex, endIndex);
    }
    else if (ctrlOrMeta) {
      // Selection remains unchanged.
    }
    else {
      await this.selectItems(targetIndex, targetIndex);
    }

    table.setActiveItem(targetItem);
  }

  private selectOnShiftNavigation(direction: 'up' | 'down', startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();
    const activeRowIndex = table.activeRow()?.index() ?? -1;
    const selectedIds = table.selectedItems();

    // If the active item is outside the selection, start a new selection.
    if (!selectedIds.includes(table.activeItem()!)) {
      return this.selectItems(startIndex, endIndex);
    }

    // Moving down from the block start shrinks the selection until the block end, then extends it.
    if (direction === 'down' && this.isSelectionAtBlockStart(activeRowIndex)) {
      return this.selectFromBlockStart(startIndex, endIndex);
    }

    // Moving up from the block end shrinks the selection until the block start, then extends it.
    if (direction === 'up' && this.isSelectionAtBlockEnd(activeRowIndex)) {
      return this.selectFromBlockEnd(startIndex, endIndex);
    }

    // In other cases, e.g. going down at the end of a selection block, select all items in the range.
    return this.selectItems(startIndex, endIndex, {add: true});
  }

  private isSelectionAtBlockStart(activeIndex: number): boolean {
    const table = this._table();
    const selectedIds = table.selectedItems();

    const previousItemId = table.rows()[activeIndex - 1]?.id;
    const nextItemId = table.rows()[activeIndex + 1]?.id;

    return (previousItemId === undefined || !selectedIds.includes(previousItemId)) && nextItemId !== undefined && selectedIds.includes(nextItemId);
  }

  private isSelectionAtBlockEnd(activeIndex: number): boolean {
    const table = this._table();
    const selectedIds = table.selectedItems();

    const previousItemId = table.rows()[activeIndex - 1]?.id;
    const nextItemId = table.rows()[activeIndex + 1]?.id;

    return previousItemId !== undefined && selectedIds.includes(previousItemId) && (nextItemId === undefined || !selectedIds.includes(nextItemId));
  }

  private async selectItems(startIndex: number, endIndex: number, options?: {add: boolean}): Promise<void> {
    const table = this._table();
    if (!table.selectable()) {
      return;
    }

    const indices = rangeInclusive(startIndex, endIndex);
    const add = options?.add ?? false;
    const rows = indices.map(i => table.rows()[i]);

    table.updateSelectedItems(selection => new Set<ID>([
      ...(add ? selection : []),
      ...rows.flatMap(row => row?.id ?? []),
    ]));
  }

  private async selectFromBlockStart(startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();
    const indices = rangeInclusive(startIndex, endIndex);

    table.updateSelectedItems(selection => {
      const newSelection = new Set(selection);
      let shrinking = true;

      for (let i = 0; i < indices.length; i++) {
        const currentIndex = indices[i]!;
        const nextIndex = indices[i + 1]!;
        const itemId = table.rows()[currentIndex]?.id;

        if (itemId === undefined) {
          continue;
        }

        const nextItemId = table.rows()[nextIndex]?.id;
        if (shrinking && nextItemId !== undefined && selection.has(nextItemId)) {
          newSelection.delete(itemId);
        }
        else {
          // Once outside the active block, only add items, even when crossing another selected block.
          shrinking = false;
          newSelection.add(itemId);
        }
      }
      return newSelection;
    });
  }

  private async selectFromBlockEnd(startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();
    const indices = rangeInclusive(startIndex, endIndex);

    table.updateSelectedItems(selection => {
      const newSelection = new Set(selection);
      let shrinking = true;

      for (let i = indices.length - 1; i >= 0; i--) {
        const currentIndex = indices[i]!;
        const previousIndex = indices[i - 1]!;
        const itemId = table.rows()[currentIndex]?.id;

        if (itemId === undefined) {
          continue;
        }

        const previousItemId = table.rows()[previousIndex]?.id;
        if (shrinking && previousItemId !== undefined && selection.has(previousItemId)) {
          newSelection.delete(itemId);
        }
        else {
          // Once outside the active block, only add items, even when crossing another selected block.
          shrinking = false;
          newSelection.add(itemId);
        }
      }
      return newSelection;
    });
  }

  private toggleSelectedItem(id: ID): void {
    const table = this._table();

    table.updateSelectedItems(selection => {
      const next = new Set(selection);
      if (next.has(id)) {
        next.delete(id);
      }
      else {
        if (table.selectable() === 'single') {
          next.clear();
        }
        next.add(id);
      }
      return next;
    });
  }
}
