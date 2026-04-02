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
    const id = table.rows()[index]?.id;

    if (id === undefined) {
      return;
    }

    const activeIndex = table.rows().findIndex(r => r.id === table.activeItem());

    if (event.ctrlKey || event.metaKey) {
      table.setActiveItem(id);
      table.updateSelectedItems(selection => {
        const next = new Set(selection);
        if (next.has(id)) {
          next.delete(id);
        }
        else {
          next.add(id);
        }
        return next;
      });
    }
    else if (event.shiftKey && activeIndex >= 0) {
      const start = Math.min(activeIndex, index);
      const end = Math.max(activeIndex, index);
      const ids = rangeInclusive(start, end).map(i => table.rows()[i]?.id);

      if (ids.every(id => id !== undefined)) {
        table.updateSelectedItems(() => new Set(ids));
      }
      else {
        // if not all id's could be found (big range is selected) treat the selection as normal click
        table.setActiveItem(id);
        table.updateSelectedItems(() => new Set([id]));
      }
    }
    else {
      table.setActiveItem(id);
      table.updateSelectedItems(() => new Set([id]));
    }
  }

  /**
   * TODO [eg]: handle shift
   */
  public onArrowUp(event: Event): void {
    event.preventDefault();
    const table = this._table();
    const rows = table.rows();
    table.updateActiveItem(id => {
      const activeIndex = rows.findIndex(r => r.id === id);
      if (activeIndex < 0) {
        return undefined;
      }

      return activeIndex > 0 ? rows[activeIndex - 1]!.id : id;
    });
  }

  /**
   * TODO [eg]: handle shift
   */
  public onArrowDown(event: Event): void {
    event.preventDefault();
    const table = this._table();
    const rows = table.rows();
    table.updateActiveItem(id => {
      const activeIndex = rows.findIndex(r => r.id === id);
      if (activeIndex < 0) {
        return undefined;
      }

      return activeIndex < rows.length - 1 ? rows[activeIndex + 1]!.id : id;
    });
  }

  public onSpace(event: Event): void {
    event.preventDefault();

    const activeId = this._table().activeItem();
    if (!activeId) {
      return;
    }

    this._table().updateSelectedItems(ids => {
      const next = new Set(ids);
      if (next.has(activeId)) {
        next.delete(activeId);
      }
      else {
        next.add(activeId);
      }
      return next;
    });
  }
}
