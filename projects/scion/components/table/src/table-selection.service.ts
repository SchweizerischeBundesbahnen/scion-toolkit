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
import {firstValueFrom, timer} from 'rxjs';
import {SciRow} from './table.model';

@Injectable()
export class TableSelectionService<T> {

  private readonly _table = inject<Signal<ɵSciTable<T>>>(ɵSCI_TABLE);

  public async onRowClick(index: number, event: {ctrlKey: boolean; shiftKey: boolean; metaKey: boolean}): Promise<void> {
    const table = this._table();
    const rowsByIndex = table.rowsByIndex();
    const row = rowsByIndex.get(index);
    const item = rowsByIndex.get(index)?.item;
    const previousFocusedIndex = table.activeRow()?.index ?? -1;

    table.activeItem.set(item);

    if (item === undefined || !table.selectable()) {
      return;
    }

    if (table.selectable() === 'single') {
      table.updateSelectedItems(() => new Map<unknown, T>().set(row!.id, item));
      return;
    }

    if (event.shiftKey && previousFocusedIndex >= 0) {
      const start = Math.min(previousFocusedIndex, index);
      const end = Math.max(previousFocusedIndex, index);
      await this.selectItems(start, end, {add: true});
    }
    else if (event.ctrlKey || event.metaKey) {
      this.toggleSelectedItem(item);
    }
    else {
      // If no modifier is pressed set the selection to the clicked row.
      table.updateSelectedItems(() => new Map<unknown, T>().set(row!.id, item));
    }
  }

  public async onArrowUp(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeIndex = this._table().activeRow()?.index ?? -1;

    if (activeIndex <= 0) {
      return;
    }

    // Set active item.
    const startIndex = activeIndex - 1;
    await this.loadMissingItems(startIndex, startIndex);
    const startItem = table.rowsByIndex().get(startIndex)?.item;
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
    const activeIndex = this._table().activeRow()?.index ?? -1;
    const endIndex = Math.min(activeIndex + 1, table.totalCount()! - 1);

    if (endIndex === activeIndex) {
      return;
    }

    // Set active item.
    await this.loadMissingItems(endIndex, endIndex);
    const endItem = table.rowsByIndex().get(endIndex)?.item;
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

  public async onPageUp(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const activeIndex = this._table().activeRow()?.index ?? -1;

    if (activeIndex === 0) {
      return;
    }

    // Set active item.
    const startIndex = Math.max(activeIndex - table.viewportPageSize() + 1, 0);
    await this.loadMissingItems(startIndex, startIndex);
    const startItem = table.rowsByIndex().get(startIndex)?.item;
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
    const activeIndex = this._table().activeRow()?.index ?? -1;
    const endIndex = Math.min(activeIndex + table.viewportPageSize() - 1, table.totalCount()! - 1);

    if (endIndex === activeIndex) {
      return;
    }

    // Set active item.
    await this.loadMissingItems(endIndex, endIndex);
    const endItem = table.rowsByIndex().get(endIndex)?.item;
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
    const activeIndex = this._table().activeRow()?.index ?? -1;

    if (activeIndex <= 0) {
      return;
    }

    // Set active item.
    const startIndex = 0;
    await this.loadMissingItems(startIndex, startIndex);
    const startItem = table.rowsByIndex().get(startIndex)?.item;
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
    const activeIndex = this._table().activeRow()?.index ?? -1;

    const endIndex = table.totalCount()! - 1;

    if (endIndex === activeIndex) {
      return;
    }

    // TODO [selection] should active item be set before selection? this way, further methods cant rely on table.activeItem.
    // But otherwise, loading and setting the active item needs to be done for each case, or once at the end.

    // Set active item.
    await this.loadMissingItems(endIndex, endIndex);
    const endItem = table.rowsByIndex().get(endIndex)?.item;
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

    const activeItem = table.activeItem();
    if (!activeItem) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;
    const activeItemId = table.trackBy(activeItem);

    if (ctrlOrMeta) {
      this.toggleSelectedItem(activeItem);
    }
    else {
      table.updateSelectedItems(() => new Map<unknown, T>().set(activeItemId, activeItem));
    }
  }

  public async onControlA(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const totalCount = table.totalCount() ?? 0;

    if (table.selectable() === 'multi' && totalCount >= 0) {
      await this.selectItems(0, totalCount - 1);
    }
  }

  // TODO [selection] Should we add overloads for all variants for better readability, but same logic?
  // shiftArrowDown
  // shiftPageDown
  // ShiftEnd
  private async shiftDown(options: {endIndex: number; activeIndex: number}): Promise<void> {
    const table = this._table();
    const selectedIds = table.selectedIds();
    const activeIndex = options.activeIndex;

    const startIndex = activeIndex;
    const endIndex = options.endIndex;

    const activeItem = table.rowsByIndex().get(activeIndex)!.item!;
    const activeItemId = table.trackBy(activeItem)!;

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

    const activeItem = table.rowsByIndex().get(activeIndex)!.item!;
    const activeItemId = table.trackBy(activeItem)!;

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

    const previousItem = table.rowsByIndex().get(activeIndex - 1)?.item;
    const previousItemId = previousItem ? table.trackBy(previousItem) : undefined;

    const nextItem = table.rowsByIndex().get(activeIndex + 1)?.item;
    const nextItemId = nextItem ? table.trackBy(nextItem) : undefined;

    return !selectedIds.has(previousItemId) && selectedIds.has(nextItemId);
  }

  private isSelectionAtBlockEnd(activeIndex: number): boolean {
    const table = this._table();
    const selectedIds = table.selectedIds();

    const previousItem = table.rowsByIndex().get(activeIndex - 1)?.item;
    const previousItemId = previousItem ? table.trackBy(previousItem) : undefined;

    const nextItem = table.rowsByIndex().get(activeIndex + 1)?.item;
    const nextItemId = nextItem ? table.trackBy(nextItem) : undefined;

    return selectedIds.has(previousItemId) && !selectedIds.has(nextItemId);
  }

  private async loadMissingItems(startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();
    const indices = rangeInclusive(startIndex, endIndex + 1);
    const rows = indices.map(i => table.rowsByIndex().get(i));
    if (rows.some(row => row?.id === undefined)) {
      await Promise.race([
        table.loadRange(startIndex, endIndex + 1),
        firstValueFrom(timer(5_000)),
      ]);
    }
  }

  private async selectItems(startIndex: number, endIndex: number, options?: {add: boolean}): Promise<void> {
    const table = this._table();
    const indices = rangeInclusive(startIndex, endIndex);
    const add = options?.add ?? false;
    let rows = indices.map(i => table.rowsByIndex().get(i));

    if (rows.some(row => row?.id === undefined)) {
      // If not all id's could be found load the missing items.
      await Promise.race([
        table.loadRange(startIndex, endIndex),
        firstValueFrom(timer(5_000)),
      ]);
      rows = indices.map(i => table.rowsByIndex().get(i));
    }

    table.updateSelectedItems(existing => new Map<unknown, T>([
      ...(add ? existing : []),
      ...rows
        .filter((row): row is Required<SciRow<T>> => row?.id !== undefined && row.item !== undefined)
        .map((row): [unknown, T] => [row.id, row.item]),
    ]));
  }

  private async selectFromBlockStart(startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();

    await this.loadMissingItems(startIndex, endIndex);
    const indices = rangeInclusive(startIndex, endIndex);

    table.updateSelectedItems(selection => {
      const newSelection = new Map(selection);

      for (let i = 0; i < indices.length; i++) {
        const currentIndex = indices[i]!;
        const nextIndex = indices[i + 1]!;

        const item = table.rowsByIndex().get(currentIndex)?.item;
        if (!item) {
          continue;
        }

        const itemId = table.trackBy(item);
        const nextItem = table.rowsByIndex().get(nextIndex)?.item;
        const nextItemId = nextItem ? table.trackBy(nextItem) : undefined;

        if (selection.has(nextItemId)) {
          newSelection.delete(itemId);
        }
        else {
          newSelection.set(itemId, item);
        }
      }
      return newSelection;
    });
  }

  private async selectFromBlockEnd(startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();

    await this.loadMissingItems(startIndex, endIndex);
    const indices = rangeInclusive(startIndex, endIndex);

    table.updateSelectedItems(selection => {
      const newSelection = new Map(selection);

      for (let i = indices.length - 1; i >= 0; i--) {
        const currentIndex = indices[i]!;
        const previousIndex = indices[i - 1]!;

        const item = table.rowsByIndex().get(currentIndex)?.item;
        if (!item) {
          continue;
        }

        const itemId = table.trackBy(item);
        const previousItem = table.rowsByIndex().get(previousIndex)?.item;
        const previousItemId = previousItem ? table.trackBy(previousItem) : undefined;

        if (selection.has(previousItemId)) {
          newSelection.delete(itemId);
        }
        else {
          newSelection.set(itemId, item);
        }
      }
      return newSelection;
    });
  }

  private toggleSelectedItem(item: T): void {
    const table = this._table();
    const id = table.trackBy(item);

    table.updateSelectedItems(selection => {
      const next = new Map(selection);
      if (next.has(id)) {
        next.delete(id);
      }
      else {
        if (table.selectable() === 'single') {
          next.clear();
        }
        next.set(id, item);
      }
      return next;
    });
  }
}
