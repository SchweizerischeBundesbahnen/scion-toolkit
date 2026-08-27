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

  private _table = inject(ɵSCI_TABLE) as Signal<ɵSciTable<T>>;

  public async onRowClick(index: number, event: {ctrlKey: boolean; shiftKey: boolean; metaKey: boolean}): Promise<void> {
    const table = this._table();
    const rowsByIndex = table.rowsByIndex();
    const row = rowsByIndex.get(index);
    const item = rowsByIndex.get(index)?.item;
    const previousFocusedIndex = table.activeIndex();

    table.activeItem.set(item);

    if (item === undefined || !table.selectable()) {
      return;
    }

    if (table.selectable() === 'single') {
      this.toggleSelectedItem(item);
      return;
    }

    if (event.shiftKey && previousFocusedIndex >= 0) {
      const start = Math.min(previousFocusedIndex, index);
      const end = Math.max(previousFocusedIndex, index);
      await this.addItemsToSelection(start, end);
    }
    else if (event.ctrlKey || event.metaKey) {
      this.toggleSelectedItem(item);
    }
    else {
      // If no modifier is pressed set the selection to the clicked row.
      table.updateSelectedItems(() => new Map<unknown, T>().set(row!.id, item));
    }
  }

  public onArrowUp(event: Event): void {
    event.preventDefault();

    const table = this._table();
    const selectedItems = table._selectedItems();
    const activeIndex = table.activeIndex();

    if (activeIndex <= 0) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;
    const multi = table.selectable() === 'multi';

    const currentItem = table.rowsByIndex().get(activeIndex)!.item!;
    const previousItem = table.rowsByIndex().get(activeIndex - 1)?.item;

    if (!previousItem) {
      return;
    }

    const currentItemId = table.trackBy(currentItem);
    const previousItemId = table.trackBy(previousItem);

    if (shift && ctrlOrMeta && multi) {
      table.updateSelectedItems(items => new Map(items).set(currentItemId, currentItem).set(previousItemId, previousItem));
      table.activeItem.set(previousItem);
    }
    else if (shift && multi) {
      if (!selectedItems.has(currentItemId)) {
        table.updateSelectedItems(() => new Map<unknown, T>().set(currentItemId, currentItem).set(previousItemId, previousItem));
        table.activeItem.set(previousItem);
      }
      else {
        const nextItem = table.rowsByIndex().get(activeIndex + 1)?.item;
        const nextItemId = nextItem ? table.trackBy(nextItem) : undefined;

        const previousSelected = selectedItems.has(previousItemId);
        const nextSelected = selectedItems.has(nextItemId);

        // End of selection block
        if (previousSelected && !nextSelected) {
          const newSelection = new Map(selectedItems);
          newSelection.delete(currentItemId);
          table.updateSelectedItems(() => newSelection);
          table.activeItem.set(previousItem);
        }
        // Middle or start of selection block
        else {
          table.updateSelectedItems(items => new Map(items).set(previousItemId, previousItem));
          table.activeItem.set(previousItem);
        }
      }
    }
    else if (ctrlOrMeta) {
      table.activeItem.set(previousItem);
    }
    else {
      table.updateSelectedItems(() => new Map<unknown, T>().set(previousItemId, previousItem));
      table.activeItem.set(previousItem);
    }
  }

  public onArrowDown(event: Event): void {
    event.preventDefault();

    const table = this._table();
    const selectedItems = table._selectedItems();

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;
    const multi = table.selectable() === 'multi';

    const activeIndex = table.activeIndex();
    const lastIndex = this.rowCount(table) - 1;
    if (activeIndex >= lastIndex) {
      return;
    }

    const currentItem = table.rowsByIndex().get(activeIndex)!.item!;
    const nextItem = table.rowsByIndex().get(activeIndex + 1)?.item;

    if (!nextItem) {
      return;
    }

    const currentItemId = table.trackBy(currentItem);
    const nextItemId = table.trackBy(nextItem);

    if (shift && ctrlOrMeta && multi) {
      table.updateSelectedItems(items => new Map(items).set(currentItemId, currentItem).set(nextItemId, nextItem));
      table.activeItem.set(nextItem);
    }
    else if (shift && multi) {
      if (!selectedItems.has(currentItemId)) {
        table.updateSelectedItems(() => new Map<unknown, T>().set(currentItemId, currentItem).set(nextItemId, nextItem));
        table.activeItem.set(nextItem);
      }
      else {
        const previousItem = table.rowsByIndex().get(activeIndex - 1)?.item;
        const previousItemId = previousItem ? table.trackBy(previousItem) : undefined;

        const previousSelected = selectedItems.has(previousItemId);
        const nextSelected = selectedItems.has(nextItemId);

        // Start of selection block
        if (!previousSelected && nextSelected) {
          const newSelection = new Map(selectedItems);
          newSelection.delete(currentItemId);
          table.updateSelectedItems(() => newSelection);
          table.activeItem.set(nextItem);
        }
        // Middle or end of selection block
        else {
          table.updateSelectedItems(items => new Map(items).set(nextItemId, nextItem));
          table.activeItem.set(nextItem);
        }
        //
        // // Middle of selection block
        // if (previousSelected && nextSelected) {
        //   table.activeItem.set(nextItem);
        //   return;
        // }
        //
        // // End of selection block
        // if (previousSelected && !nextSelected) {
        //   table.updateSelectedItems(items => new Map(items).set(nextItemId, nextItem));
        //   table.activeItem.set(nextItem);
        //   return;
        // }
        //
        // // One item selected
        // if (!previousSelected && !nextSelected) {
        //
        //   return;
        // }
      }
    }
    else if (ctrlOrMeta) {
      table.activeItem.set(nextItem);
    }
    else {
      table.updateSelectedItems(() => new Map<unknown, T>().set(nextItemId, nextItem));
      table.activeItem.set(nextItem);
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
    const totalCount = table.totalCount();
    if (!table.selectable() || table.selectable() === 'single' || totalCount === undefined || totalCount <= 0) {
      return;
    }

    await this.addItemsToSelection(0, totalCount - 1);
  }

  public async onPageUp(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const selectedItems = table._selectedItems();
    const activeIndex = table.activeIndex();
    if (activeIndex <= 0) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;
    const multi = table.selectable() === 'multi';

    const visibleRowCount = table.viewportPageSize()!;
    const startIndex = Math.max(activeIndex - visibleRowCount + 1, 0);
    const endIndex = activeIndex;

    const currentItem = table.rowsByIndex().get(activeIndex)!.item!;
    const previousItem = table.rowsByIndex().get(activeIndex - 1)?.item;

    if (!previousItem) {
      return;
    }

    const currentItemId = table.trackBy(currentItem);
    const previousItemId = table.trackBy(previousItem);

    if (shift && ctrlOrMeta && multi) {
      await this.loadMissingItems(startIndex, endIndex + 1);
      const range = rangeInclusive(startIndex, endIndex);
      const newSelection = new Map(selectedItems);
      for (const index of range) {
        const item = table.rowsByIndex().get(index)?.item;
        if (item) {
          const itemId = item ? table.trackBy(item) : item;
          newSelection.set(itemId, item);
        }
      }

      table.updateSelectedItems(() => newSelection);
      const item = table.rowsByIndex().get(startIndex)?.item;
      if (item) {
        table.activeItem.set(item);
      }
    }
    else if (shift && multi) {
      if (!selectedItems.has(currentItemId)) {
        await this.selectItems(startIndex, endIndex);
        const item = table.rowsByIndex().get(startIndex)?.item;
        table.activeItem.set(item);
      }
      else {
        const nextItem = table.rowsByIndex().get(activeIndex + 1)?.item;
        const nextItemId = nextItem ? table.trackBy(nextItem) : undefined;

        const previousSelected = selectedItems.has(previousItemId);
        const nextSelected = selectedItems.has(nextItemId);

        // End of selection block
        if (previousSelected && !nextSelected) {
          await this.selectBlockEnd(startIndex, endIndex);
        }
        // Middle or start of selection block
        else {
          await this.addItemsToSelection(startIndex, endIndex);
          const item = table.rowsByIndex().get(startIndex)?.item;
          table.activeItem.set(item);
        }
      }

    }
    else if (ctrlOrMeta) {
      const item = table.rowsByIndex().get(startIndex)?.item;
      table.activeItem.set(item);
    }
    else {
      await this.loadMissingItems(startIndex, endIndex + 1);

      const item = table.rowsByIndex().get(startIndex)?.item;
      if (item) {
        const itemId = table.trackBy(item);
        table.updateSelectedItems(() => new Map().set(itemId, item));
        table.activeItem.set(item);
      }
    }
  }

  public async onPageDown(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const selectedItems = table._selectedItems();
    const activeIndex = table.activeIndex();
    const lastIndex = this.rowCount(table) - 1;
    if (activeIndex >= lastIndex) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;
    const multi = table.selectable() === 'multi';

    const visibleRowCount = table.viewportPageSize()!;
    const startIndex = activeIndex;
    const endIndex = Math.min(activeIndex + visibleRowCount - 1, table.totalCount()! - 1);

    const currentItem = table.rowsByIndex().get(activeIndex)!.item!;
    const nextItem = table.rowsByIndex().get(activeIndex + 1)?.item;

    if (!nextItem) {
      return;
    }

    const currentItemId = table.trackBy(currentItem);
    const nextItemId = table.trackBy(nextItem);

    if (shift && ctrlOrMeta && multi) {
      await this.loadMissingItems(startIndex, endIndex + 1);
      const range = rangeInclusive(startIndex, endIndex);
      const newSelection = new Map(selectedItems);
      for (const index of range) {
        const item = table.rowsByIndex().get(index)?.item;
        if (item) {
          const itemId = item ? table.trackBy(item) : item;
          newSelection.set(itemId, item);
        }
      }

      table.updateSelectedItems(() => newSelection);
      const item = table.rowsByIndex().get(endIndex)?.item;
      if (item) {
        table.activeItem.set(item);
      }
    }
    else if (shift && multi) {
      if (!selectedItems.has(currentItemId)) {
        await this.selectItems(startIndex, endIndex);
        const item = table.rowsByIndex().get(endIndex)?.item;
        table.activeItem.set(item);
      }
      else {
        const previousItem = table.rowsByIndex().get(activeIndex - 1)?.item;
        const previousItemId = previousItem ? table.trackBy(previousItem) : undefined;

        const previousSelected = selectedItems.has(previousItemId);
        const nextSelected = selectedItems.has(nextItemId);

        // Start of selection block
        if (!previousSelected && nextSelected) {
          await this.selectBlockStart(startIndex, endIndex);
        }
        // Middle or end of selection block
        else {
          await this.addItemsToSelection(startIndex, endIndex);
          const item = table.rowsByIndex().get(endIndex)?.item;
          table.activeItem.set(item);
        }
      }
    }
    else if (ctrlOrMeta) {
      const item = table.rowsByIndex().get(endIndex)?.item;
      table.activeItem.set(item);
    }
    else {
      await this.loadMissingItems(startIndex, endIndex + 1);

      const item = table.rowsByIndex().get(endIndex)?.item;
      if (item) {
        const itemId = table.trackBy(item);
        table.updateSelectedItems(() => new Map().set(itemId, item));
        table.activeItem.set(item);
      }
    }
  }

  public async onHome(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const selectedItems = table._selectedItems();
    const activeIndex = table.activeIndex();
    const startIndex = 0;
    const endIndex = activeIndex;
    if (activeIndex <= 0) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;
    const multi = table.selectable() === 'multi';

    const currentItem = table.rowsByIndex().get(activeIndex)!.item!;
    const previousItem = table.rowsByIndex().get(activeIndex - 1)?.item;

    if (!previousItem) {
      return;
    }

    const currentItemId = table.trackBy(currentItem);
    const previousItemId = table.trackBy(previousItem);

    if (shift && ctrlOrMeta && multi) {
      await this.addItemsToSelection(startIndex, endIndex);
      table.activeItem.set(table.rowsByIndex().get(startIndex)!.item);
    }
    else if (shift && multi) {
      if (!selectedItems.has(currentItemId)) {
        await this.selectItems(startIndex, endIndex);
        const item = table.rowsByIndex().get(startIndex)?.item;
        table.activeItem.set(item);
      }
      else {
        const nextItem = table.rowsByIndex().get(activeIndex + 1)?.item;
        const nextItemId = nextItem ? table.trackBy(nextItem) : undefined;

        const previousSelected = selectedItems.has(previousItemId);
        const nextSelected = selectedItems.has(nextItemId);

        // End of selection block
        if (previousSelected && !nextSelected) {
          await this.selectBlockEnd(startIndex, endIndex);
        }
        // Middle or start of selection block
        else {
          await this.addItemsToSelection(startIndex, endIndex);
          const item = table.rowsByIndex().get(startIndex)?.item;
          table.activeItem.set(item);
        }
      }
    }
    else if (ctrlOrMeta) {
      await this.loadMissingItems(startIndex, table.pageSize());
      const item = table.rowsByIndex().get(startIndex)?.item;
      table.activeItem.set(item);
    }
    else {
      await this.loadMissingItems(startIndex, table.pageSize());

      const item = table.rowsByIndex().get(startIndex)?.item;
      if (item) {
        const itemId = table.trackBy(item);
        table.updateSelectedItems(() => new Map().set(itemId, item));
        table.activeItem.set(item);
      }
    }
  }

  public async onEnd(event: Event): Promise<void> {
    event.preventDefault();

    const table = this._table();
    const selectedItems = table._selectedItems();
    const activeIndex = table.activeIndex();
    const startIndex = activeIndex;
    const endIndex = table.totalCount()! - 1;
    if (activeIndex === endIndex) {
      return;
    }

    const keyboardEvent = event as KeyboardEvent;
    const shift = keyboardEvent.shiftKey;
    const ctrlOrMeta = keyboardEvent.ctrlKey || keyboardEvent.metaKey;
    const multi = table.selectable() === 'multi';

    const currentItem = table.rowsByIndex().get(activeIndex)!.item!;
    const nextItem = table.rowsByIndex().get(activeIndex + 1)?.item;

    if (!nextItem) {
      return;
    }

    const currentItemId = table.trackBy(currentItem);
    const nextItemId = table.trackBy(nextItem);

    if (shift && ctrlOrMeta && multi) {
      await this.addItemsToSelection(startIndex, endIndex);
      table.activeItem.set(table.rowsByIndex().get(endIndex)!.item);
    }
    else if (shift && multi) {
      if (!selectedItems.has(currentItemId)) {
        await this.selectItems(startIndex, endIndex);
        const item = table.rowsByIndex().get(endIndex)?.item;
        table.activeItem.set(item);
      }
      else {
        const previousItem = table.rowsByIndex().get(activeIndex - 1)?.item;
        const previousItemId = previousItem ? table.trackBy(previousItem) : undefined;

        const previousSelected = selectedItems.has(previousItemId);
        const nextSelected = selectedItems.has(nextItemId);

        // Start of selection block
        if (!previousSelected && nextSelected) {
          await this.selectBlockStart(startIndex, endIndex);
        }
        // Middle or end of selection block
        else {
          await this.addItemsToSelection(startIndex, endIndex);
          const item = table.rowsByIndex().get(endIndex)?.item;
          table.activeItem.set(item);
        }
      }
    }
    else if (ctrlOrMeta) {
      await this.loadMissingItems(endIndex - table.pageSize(), endIndex);

      const item = table.rowsByIndex().get(endIndex)?.item;
      table.activeItem.set(item);
    }
    else {
      await this.loadMissingItems(endIndex - table.pageSize(), endIndex);

      const item = table.rowsByIndex().get(endIndex)?.item;
      if (item) {
        const itemId = table.trackBy(item);
        table.updateSelectedItems(() => new Map().set(itemId, item));
        table.activeItem.set(item);
      }
    }
  }

  private async loadMissingItems(startIndex: number, endIndex: number) {
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

  private async addItemsToSelection(startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();
    const indices = rangeInclusive(startIndex, endIndex);
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
      ...existing,
      ...rows
        .filter((row): row is Required<SciRow<T>> => row?.id !== undefined && row.item !== undefined)
        .map((row): [unknown, T] => [row.id, row.item]),
    ]));
  }

  private async selectItems(startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();
    const indices = rangeInclusive(startIndex, endIndex);
    let rows = indices.map(i => table.rowsByIndex().get(i));

    if (rows.some(row => row?.id === undefined)) {
      // If not all id's could be found load the missing items.
      await Promise.race([
        table.loadRange(startIndex, endIndex),
        firstValueFrom(timer(5_000)),
      ]);
      rows = indices.map(i => table.rowsByIndex().get(i));
    }

    table.updateSelectedItems(() => new Map<unknown, T>([
      ...rows
        .filter((row): row is Required<SciRow<T>> => row?.id !== undefined && row.item !== undefined)
        .map((row): [unknown, T] => [row.id, row.item]),
    ]));
  }

  private async selectBlockStart(startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();

    await this.loadMissingItems(startIndex, endIndex + 1);
    const range = rangeInclusive(startIndex, endIndex);

    table.updateSelectedItems(selection => {
      const newSelection = new Map(selection);
      for (let i = 0; i < range.length; i++) {
        const current = range[i]!;
        const next = range[i + 1]!;

        const item = table.rowsByIndex().get(current)?.item;
        if (item) {
          const itemId = table.trackBy(item);
          const nextItem = table.rowsByIndex().get(next)?.item;
          const nextItemId = nextItem ? table.trackBy(nextItem) : undefined;

          if (selection.has(nextItemId)) {
            newSelection.delete(itemId);
          }
          else {
            newSelection.set(itemId, item);
          }
        }
      }
      return newSelection;
    });

    const item = table.rowsByIndex().get(endIndex)?.item;
    if (item) {
      table.activeItem.set(item);
    }
  }

  private async selectBlockEnd(startIndex: number, endIndex: number): Promise<void> {
    const table = this._table();

    await this.loadMissingItems(startIndex, endIndex + 1);
    const range = rangeInclusive(startIndex, endIndex);

    table.updateSelectedItems(selection => {
      const newSelection = new Map(selection);
      for (let i = range.length; i >= 0; i--) {
        const current = range[i]!;
        const previous = range[i - 1]!;
        const item = table.rowsByIndex().get(current)?.item;
        if (item) {
          const itemId = table.trackBy(item);
          const previousItem = table.rowsByIndex().get(previous)?.item;
          const previousItemId = previousItem ? table.trackBy(previousItem) : undefined;

          if (selection.has(previousItemId)) {
            newSelection.delete(itemId);
          }
          else {
            newSelection.set(itemId, item);
          }
        }
      }
      return newSelection;
    });

    const item = table.rowsByIndex().get(startIndex)?.item;
    if (item) {
      table.activeItem.set(item);
    }
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

  private rowCount(table: ɵSciTable<T>): number {
    return table.totalCount() === undefined ? table.pageSize() : table.totalCount()!;
  }
}
