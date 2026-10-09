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
import {SciTableRow} from './table.model';
import {SciTableTreeNode} from '@scion/components/table';

@Injectable()
export class SciTableSelectionService<T, ID> {

  private readonly _table = inject<Signal<ɵSciTable<T, ID>>>(ɵSCI_TABLE);

  public async onRowClick(index: number, event: {ctrlKey: boolean; shiftKey: boolean; metaKey: boolean}): Promise<void> {
    const table = this._table();
    const rowId = table.visibleRows()?.[index]?.item;

    table.activeItem.set(rowId);

    if (rowId === undefined || !table.selectable()) {
      return;
    }

    if (table.selectable() === 'single') {
      table.updateSelectedItems(() => new Set<ID>().add(rowId));
      return;
    }

    const previousActiveItem = table.activeItem();
    const previousActiveIndex = previousActiveItem ? (table.rowIndexById().get(previousActiveItem) ?? -1) : -1;

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
    const activeItem = table.activeItem();
    const activeIndex = activeItem ? (table.rowIndexById().get(activeItem) ?? -1) : -1;

    if (activeIndex <= 0) {
      return;
    }

    // Set active item.
    const startIndex = activeIndex - 1;
    const startItem = table.visibleRows()?.[startIndex]?.item;
    table.activeItem.set(startItem);

    if (!table.selectable()) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;

    if (shift && ctrlOrMeta) {
      await this.ctrlShiftUp({startIndex, activeIndex});
    }
    else if (shift) {
      await this.shiftUp({startIndex, activeIndex});
    }
    else if (ctrlOrMeta) {
      // Selection remains unchanged.
    }
    else {
      await this.selectItems(startIndex, startIndex);
    }
  }

  public async onArrowDown(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeItem = table.activeItem();
    const activeIndex = activeItem ? (table.rowIndexById().get(activeItem) ?? -1) : -1;
    const endIndex = Math.min(activeIndex + 1, table.visibleRowCount()! - 1);

    if (endIndex === activeIndex) {
      return;
    }

    // Set active item.
    const endItem = table.visibleRows()?.[endIndex]?.item;
    table.activeItem.set(endItem);

    if (!table.selectable()) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;

    if (shift && ctrlOrMeta) {
      await this.ctrlShiftDown({endIndex, activeIndex});
    }
    else if (shift) {
      await this.shiftDown({endIndex, activeIndex});
    }
    else if (ctrlOrMeta) {
      // Selection remains unchanged.
    }
    else {
      await this.selectItems(endIndex, endIndex);
    }
  }

  public async onArrowLeft(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeRow = table.activeRow();

    if (activeRow?.item === undefined || activeRow.id === undefined) {
      return;
    }

    if (activeRow.hasChildren() && activeRow.expanded()) {
      table.collapse(activeRow.id);
    }
    else if (activeRow.parentId) {
      const parentIndex = table.rowIndexById().get(activeRow.parentId) ?? -1;

      // Set active item.
      const item = table.visibleRows()?.[parentIndex]?.item;
      table.activeItem.set(item);

      if (table.selectable()) {
        await this.selectItems(parentIndex, parentIndex);
      }
    }
    // Root case
    else {
      const row = findPreviousExpandedRow(activeRow.index - 1);

      if (row?.id !== undefined) {
        const index = table.rowIndexById().get(row.id) ?? -1;
        table.activeItem.set(row.id);

        if (table.selectable()) {
          await this.selectItems(index, index);
        }
      }

      function findPreviousExpandedRow(index: number): SciTableRow<T, ID> | undefined {
        if (index < 0) {
          return undefined;
        }

        let i = index;
        while (i >= 0) {
          const row = table.rowsByIndex().get(i);
          if (row?.expanded()) {
            return row;
          }
          i--;
        }

        return table.rowsByIndex().get(i);
      }
    }
  }

  public async onArrowRight(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeRow = table.activeRow();

    if (activeRow?.id === undefined) {
      return;
    }

    if (activeRow.hasChildren() && !activeRow.expanded()) {
      table.expand(activeRow.id);
      return;
    }

    const activeIndex = table.rowIndexById().get(activeRow.id) ?? -1;
    const endIndex = Math.min(activeIndex + 1, table.visibleRowCount()! - 1);

    if (endIndex === activeIndex) {
      return;
    }

    // Set active item.
    const endItem = table.visibleRows()?.[endIndex]?.item;
    table.activeItem.set(endItem);

    if (!table.selectable()) {
      return;
    }

    await this.selectItems(endIndex, endIndex);
  }

  public async onPageUp(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeItem = table.activeItem();
    const activeIndex = activeItem ? (table.rowIndexById().get(activeItem) ?? -1) : -1;

    if (activeIndex <= 0) {
      return;
    }

    // Set active item.
    const startIndex = Math.max(activeIndex - table.viewportPageSize() + 1, 0);
    const startItem = table.visibleRows()?.[startIndex]?.item;
    table.activeItem.set(startItem);

    if (!table.selectable()) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;

    if (shift && ctrlOrMeta) {
      await this.ctrlShiftUp({startIndex, activeIndex});
    }
    else if (shift) {
      await this.shiftUp({startIndex, activeIndex});
    }
    else if (ctrlOrMeta) {
      // Selection remains unchanged.
    }
    else {
      await this.selectItems(startIndex, startIndex);
    }
  }

  public async onPageDown(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeItem = table.activeItem();
    const activeIndex = activeItem ? (table.rowIndexById().get(activeItem) ?? -1) : -1;
    const endIndex = Math.min(activeIndex + table.viewportPageSize() - 1, table.visibleRowCount()! - 1);

    if (endIndex === activeIndex) {
      return;
    }

    // Set active item.
    const endItem = table.visibleRows()?.[endIndex]?.item;
    table.activeItem.set(endItem);

    if (!table.selectable()) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;

    if (shift && ctrlOrMeta) {
      await this.ctrlShiftDown({endIndex, activeIndex});
    }
    else if (shift) {
      await this.shiftDown({endIndex, activeIndex});
    }
    else if (ctrlOrMeta) {
      // Selection remains unchanged.
    }
    else {
      await this.selectItems(endIndex, endIndex);
    }
  }

  public async onHome(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeItem = table.activeItem();
    const activeIndex = activeItem ? (table.rowIndexById().get(activeItem) ?? -1) : -1;

    if (activeIndex <= 0) {
      return;
    }

    // Set active item.
    const startIndex = 0;
    const startItem = table.visibleRows()?.[startIndex]?.item;
    table.activeItem.set(startItem);

    if (!table.selectable()) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;

    if (shift && ctrlOrMeta) {
      await this.ctrlShiftUp({startIndex, activeIndex});
    }
    else if (shift) {
      await this.shiftUp({startIndex, activeIndex});
    }
    else if (ctrlOrMeta) {
      // Selection remains unchanged.
    }
    else {
      await this.selectItems(startIndex, startIndex);
    }
  }

  public async onEnd(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeItem = table.activeItem();
    const activeIndex = activeItem ? (table.rowIndexById().get(activeItem) ?? -1) : -1;

    const endIndex = table.visibleRowCount()! - 1;

    if (endIndex === activeIndex) {
      return;
    }

    // TODO [mmu] should active item be set before selection? this way, further methods cant rely on table.activeItem.
    // But otherwise, loading and setting the active item needs to be done for each case, or once at the end.

    // Set active item.
    const endItem = table.visibleRows()![endIndex]!.item;
    table.activeItem.set(endItem);

    if (!table.selectable()) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;

    if (shift && ctrlOrMeta) {
      await this.ctrlShiftDown({endIndex, activeIndex});
    }
    else if (shift) {
      await this.shiftDown({endIndex, activeIndex});
    }
    else if (ctrlOrMeta) {
      // Selection remains unchanged.
    }
    else {
      await this.selectItems(endIndex, endIndex);
    }
  }

  public onSpace(event: Event): void {
    event.preventDefault();

    const table = this._table();
    if (!table.selectable()) {
      return;
    }

    const activeItemId = table.activeItem();
    if (!activeItemId) {
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
    const totalCount = table.visibleRowCount() ?? 0;

    if (table.selectable() === 'multi' && totalCount >= 0) {
      await this.selectItems(0, totalCount - 1);
    }
  }

  // TODO [mmu] Should we add overloads for all variants for better readability, but same logic?
  // shiftArrowDown
  // shiftPageDown
  // ShiftEnd
  private async shiftDown(options: {endIndex: number; activeIndex: number}): Promise<void> {
    const table = this._table();
    const selectedIds = table.selectedIds();
    const activeIndex = options.activeIndex;

    const startIndex = activeIndex;
    const endIndex = options.endIndex;

    const activeItemId = table.visibleRows()![activeIndex]!.item;

    if (table.selectable() === 'single') {
      await this.selectItems(endIndex, endIndex);
      return;
    }

    if (!selectedIds.has(activeItemId)) {
      await this.selectItems(startIndex, endIndex);
      return;
    }

    if (this.isSelectionAtBlockStart(activeIndex)) {
      await this.selectFromBlockStart(startIndex, endIndex);
      return;
    }

    await this.selectItems(startIndex, endIndex, {add: true});
  }

  private async ctrlShiftDown(options: {endIndex: number; activeIndex: number}): Promise<void> {
    const table = this._table();

    const startIndex = options.activeIndex;
    const endIndex = options.endIndex;

    if (table.selectable() === 'single') {
      await this.selectItems(endIndex, endIndex);
    }
    else {
      await this.selectItems(startIndex, endIndex, {add: true});
    }
  }

  private async shiftUp(options: {startIndex: number; activeIndex: number}): Promise<void> {
    const table = this._table();
    const selectedIds = table.selectedIds();
    const activeIndex = options.activeIndex;

    const startIndex = options.startIndex;
    const endIndex = activeIndex;

    const activeItemId = table.visibleRows()![activeIndex]!.item;

    if (table.selectable() === 'single') {
      await this.selectItems(startIndex, startIndex);
      return;
    }

    if (!selectedIds.has(activeItemId)) {
      await this.selectItems(startIndex, endIndex);
      return;
    }

    if (this.isSelectionAtBlockEnd(activeIndex)) {
      await this.selectFromBlockEnd(startIndex, endIndex);
      return;
    }

    await this.selectItems(startIndex, endIndex, {add: true});
  }

  private async ctrlShiftUp(options: {startIndex: number; activeIndex: number}): Promise<void> {
    const table = this._table();

    const startIndex = options.startIndex;
    const endIndex = options.activeIndex;

    if (table.selectable() === 'single') {
      await this.selectItems(startIndex, startIndex);
    }
    else {
      await this.selectItems(startIndex, endIndex, {add: true});
    }
  }

  private isSelectionAtBlockStart(activeIndex: number): boolean {
    const table = this._table();
    const selectedIds = table.selectedIds();

    const previousItemId = table.visibleRows()?.[(activeIndex - 1)]?.item;
    const nextItemId = table.visibleRows()?.[(activeIndex + 1)]?.item;

    return (previousItemId === undefined || !selectedIds.has(previousItemId)) && nextItemId !== undefined && selectedIds.has(nextItemId);
  }

  private isSelectionAtBlockEnd(activeIndex: number): boolean {
    const table = this._table();
    const selectedIds = table.selectedIds();

    const previousItemId = table.visibleRows()?.[(activeIndex - 1)]?.item;
    const nextItemId = table.visibleRows()?.[(activeIndex + 1)]?.item;

    return previousItemId !== undefined && selectedIds.has(previousItemId) && (nextItemId === undefined || !selectedIds.has(nextItemId));
  }

  private async selectItems(startIndex: number, endIndex: number, options?: {add: boolean}): Promise<void> {
    const table = this._table();
    const indices = rangeInclusive(startIndex, endIndex);
    const add = options?.add ?? false;
    const rows = indices.map(i => table.visibleRows()?.[i]);

    table.updateSelectedItems(existing => new Set<ID>([
      ...(add ? existing : []),
      ...rows
        .filter((row): row is Required<SciTableTreeNode<ID>> => !!row)
        .map(row => row.item),
    ]));
  }

  private async selectFromBlockStart(startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();

    const indices = rangeInclusive(startIndex, endIndex);

    table.updateSelectedItems(selection => {
      const newSelection = new Set(selection);

      for (let i = 0; i < indices.length; i++) {
        const currentIndex = indices[i]!;
        const nextIndex = indices[i + 1]!;

        const itemId = table.visibleRows()?.[currentIndex]?.item;
        if (!itemId) {
          continue;
        }

        const nextItemId = table.visibleRows()?.[nextIndex]?.item;

        if (nextItemId && selection.has(nextItemId)) {
          newSelection.delete(itemId);
        }
        else {
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

      for (let i = indices.length - 1; i >= 0; i--) {
        const currentIndex = indices[i]!;
        const previousIndex = indices[i - 1]!;

        const itemId = table.visibleRows()?.[currentIndex]?.item;

        if (!itemId) {
          continue;
        }

        const previousItemId = table.visibleRows()?.[previousIndex]?.item;
        if (previousItemId && selection.has(previousItemId)) {
          newSelection.delete(itemId);
        }
        else {
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
