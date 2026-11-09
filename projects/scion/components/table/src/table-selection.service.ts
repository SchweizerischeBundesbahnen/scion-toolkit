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
import {skeletonRowId} from './table.model';
import {ɵSciTreeNode} from './table-tree.model';

@Injectable()
export class SciTableSelectionService<T, ID> {

  private readonly _table = inject<Signal<ɵSciTable<T, ID>>>(ɵSCI_TABLE);

  public async onRowClick(index: number, event: {ctrlKey: boolean; shiftKey: boolean; metaKey: boolean}): Promise<void> {
    const table = this._table();
    const rowId = table.visibleRows()[index]?.id;
    const previousActiveIndex = table.activeIndex();

    table.setActiveItem(rowId);

    if (rowId === undefined || !table.selectable()) {
      return;
    }

    if (table.selectable() === 'single') {
      table.updateSelectedItems(() => new Set<ID>().add(rowId));
      return;
    }

    if (event.shiftKey && previousActiveIndex >= 0) {
      const start = Math.min(previousActiveIndex, index);
      const end = Math.max(previousActiveIndex, index);
      await this.selectItems(start, end, {add: true});
    }
    else if (event.ctrlKey || event.metaKey) {
      this.toggleSelectedItem(rowId);
    }
    else {
      // If no modifier is pressed set the selection to the clicked row.
      table.updateSelectedItems(() => new Set<ID>().add(rowId));
    }
  }

  public async onArrowUp(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeIndex = table.activeIndex();
    const targetIndex = Math.max(activeIndex - 1, 0);

    await this.selectOnKeyboardNavigation(targetIndex, event as KeyboardEvent);
  }

  public async onArrowDown(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeIndex = table.activeIndex();
    const targetIndex = Math.min(activeIndex + 1, table.visibleRowCount() - 1);

    await this.selectOnKeyboardNavigation(targetIndex, event as KeyboardEvent);
  }

  // TODO [marc] Mix zwischen rows und nodes
  public async onArrowLeft(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeRow = table.activeRow();

    if (activeRow?.item === undefined || activeRow.id === skeletonRowId) {
      return;
    }

    if (activeRow.hasChildren() && activeRow.expanded()) {
      table.collapse(activeRow.id);
    }
    else if (activeRow.parentId !== undefined) {
      const parentIndex = table.rowIndexById().get(activeRow.parentId) ?? -1;
      await this.selectOnKeyboardNavigation(parentIndex, {shiftKey: false, ctrlKey: false, metaKey: false});
    }
    // Root case
    else {
      const rows = table.visibleRows();
      const row = findPreviousExpandedRow(activeRow.index - 1);

      if (row !== undefined) {
        await this.selectOnKeyboardNavigation(row.index(), {shiftKey: false, ctrlKey: false, metaKey: false});
      }

      function findPreviousExpandedRow(index: number): ɵSciTreeNode<ID> | undefined {
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
    const activeIndex = table.activeIndex();
    const endIndex = Math.min(activeIndex + 1, table.visibleRowCount() - 1);

    if (activeRow?.id !== skeletonRowId && activeRow?.hasChildren() && !activeRow.expanded()) {
      table.expand(activeRow.id);
      return;
    }

    await this.selectOnKeyboardNavigation(endIndex, {shiftKey: false, ctrlKey: false, metaKey: false});
  }

  public async onPageUp(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeIndex = table.activeIndex();
    const targetIndex = Math.max(activeIndex - table.viewportPageSize() + 1, 0);

    await this.selectOnKeyboardNavigation(targetIndex, event as KeyboardEvent);
  }

  public async onPageDown(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeIndex = table.activeIndex();
    const targetIndex = Math.min(activeIndex + table.viewportPageSize() - 1, table.visibleRowCount() - 1);

    await this.selectOnKeyboardNavigation(targetIndex, event as KeyboardEvent);
  }

  public async onHome(event: Event): Promise<void> {
    event.preventDefault();

    await this.selectOnKeyboardNavigation(0, event as KeyboardEvent);
  }

  public async onEnd(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const targetIndex = table.visibleRowCount() - 1;

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
    const totalCount = table.visibleRowCount();

    if (table.selectable() === 'multi' && totalCount >= 0) {
      await this.selectItems(0, totalCount - 1);
    }
  }

  private async selectOnKeyboardNavigation(targetIndex: number, event: {shiftKey: boolean; ctrlKey: boolean; metaKey: boolean}): Promise<void> {
    const table = this._table();
    const targetItem = table.visibleRows()[targetIndex]?.id;
    const activeIndex = table.activeIndex();
    const direction = activeIndex > targetIndex ? 'up' : 'down';
    const [startIndex, endIndex] = direction === 'up' ? [targetIndex, activeIndex] : [activeIndex, targetIndex];
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
    const activeIndex = table.activeIndex();
    const selectedIds = table.selectedItems();

    // If the active item is outside the selection, start a new selection.
    if (!selectedIds.includes(table.activeItem()!)) {
      return this.selectItems(startIndex, endIndex);
    }

    // Moving down from the block start shrinks the selection until the block end, then extends it.
    if (direction === 'down' && this.isSelectionAtBlockStart(activeIndex)) {
      return this.selectFromBlockStart(startIndex, endIndex);
    }

    // Moving up from the block end shrinks the selection until the block start, then extends it.
    if (direction === 'up' && this.isSelectionAtBlockEnd(activeIndex)) {
      return this.selectFromBlockEnd(startIndex, endIndex);
    }

    // In other cases, e.g. going down at the end of a selection block, select all items in the range.
    return this.selectItems(startIndex, endIndex, {add: true});
  }

  private isSelectionAtBlockStart(activeIndex: number): boolean {
    const table = this._table();
    const selectedIds = table.selectedItems();

    const previousItemId = table.visibleRows()[activeIndex - 1]?.id;
    const nextItemId = table.visibleRows()[activeIndex + 1]?.id;

    return (previousItemId === undefined || !selectedIds.includes(previousItemId)) && nextItemId !== undefined && selectedIds.includes(nextItemId);
  }

  private isSelectionAtBlockEnd(activeIndex: number): boolean {
    const table = this._table();
    const selectedIds = table.selectedItems();

    const previousItemId = table.visibleRows()[activeIndex - 1]?.id;
    const nextItemId = table.visibleRows()[activeIndex + 1]?.id;

    return previousItemId !== undefined && selectedIds.includes(previousItemId) && (nextItemId === undefined || !selectedIds.includes(nextItemId));
  }

  private async selectItems(startIndex: number, endIndex: number, options?: {add: boolean}): Promise<void> {
    const table = this._table();
    if (!table.selectable()) {
      return;
    }

    const indices = rangeInclusive(startIndex, endIndex);
    const add = options?.add ?? false;
    const rows = indices.map(i => table.visibleRows()[i]);

    table.updateSelectedItems(existing => new Set<ID>([
      ...(add ? existing : []),
      ...rows
        .filter((row): row is Required<ɵSciTreeNode<ID>> => !!row)
        .map(row => row.id),
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
        const itemId = table.visibleRows()[currentIndex]?.id;

        if (itemId === undefined) {
          continue;
        }

        const nextItemId = table.visibleRows()[nextIndex]?.id;
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
        const itemId = table.visibleRows()[currentIndex]?.id;

        if (itemId === undefined) {
          continue;
        }

        const previousItemId = table.visibleRows()[previousIndex]?.id;
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
