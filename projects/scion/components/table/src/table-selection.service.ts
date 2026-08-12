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

@Injectable()
export class TableSelectionService<T> {

  private _table = inject(ɵSCI_TABLE) as Signal<ɵSciTable<T>>;

  public async onRowClick(index: number, event: {ctrlKey: boolean; shiftKey: boolean; metaKey: boolean}): Promise<void> {
    const table = this._table();
    const rowsByIndex = table.rowsByIndex();
    const row = rowsByIndex.get(index);
    const item = rowsByIndex.get(index)?.item;
    const previousFocusedIndex = table.activeIndex();

    table.setActiveItem(item);

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

    const activeIndex = this._table().activeIndex();
    if (activeIndex <= 0) {
      return;
    }

    // Also add the current focused item on shift+arrowUp.
    this.addItemToSelection(this._table().rowsByIndex().get(activeIndex)?.item, event as KeyboardEvent);
    this.addItemToSelection(this._table().rowsByIndex().get(activeIndex - 1)?.item, event as KeyboardEvent);
  }

  public onArrowDown(event: Event): void {
    event.preventDefault();

    const activeIndex = this._table().activeIndex();
    const table = this._table();
    const lastIndex = this.rowCount(table) - 1;
    if (activeIndex >= lastIndex) {
      return;
    }

    // Also add the current focused item on shift+arrowDown.
    this.addItemToSelection(table.rowsByIndex().get(activeIndex)?.item, event as KeyboardEvent);
    // If the activeIndex was not found (-1) select the first item (0).
    this.addItemToSelection(table.rowsByIndex().get(activeIndex + 1)?.item, event as KeyboardEvent);
  }

  public onControlSpace(event: Event): void {
    event.preventDefault();
    if (!this._table().selectable()) {
      return;
    }

    const activeItem = this._table().activeItem();
    if (activeItem !== undefined) {
      this.toggleSelectedItem(activeItem);
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

  private rowCount(table: ɵSciTable<T>): number {
    return table.totalCount() === undefined ? table.pageSize() : table.totalCount()!;
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
        .filter((row): row is {id: unknown; item: T} => row?.id !== undefined && row.item !== undefined)
        .map(row => [row.id, row.item]) satisfies [unknown, T][],
    ]));
  }

  private addItemToSelection(item: T | undefined, event: KeyboardEvent): void {
    const table = this._table();

    if (item !== undefined) {
      table.setActiveItem(item);
    }

    if (!table.selectable() || item === undefined) {
      return;
    }

    const id = table.trackBy(item);

    if (event.shiftKey && table.selectable() === 'multi') {
      table.updateSelectedItems(items => new Map(items).set(id, item));
    }
    else if (!event.ctrlKey && !event.metaKey) { // Don't update selected items at all when control is pressed.
      table.updateSelectedItems(() => new Map<unknown, T>().set(id, item));
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
}
