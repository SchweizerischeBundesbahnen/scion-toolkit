/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, Signal, signal} from '@angular/core';
import {SciMenuItem} from '../menu.model';

/**
 * Filters menu items based on the passed filter text.
 *
 * Filtering is hierarchical; submenus and groups inherit the filter of their parent menus.
 * A menu item matches only if matching its menu filter and all parent menu filters.
 *
 * Can be injected into {@link SciMenuComponent}.
 */
export class MenuFilter {

  private readonly _filterText = signal<string | null>(null);

  /**
   * Indicates whether filtering is active.
   */
  public readonly active = computed((): boolean => {
    return !!this._filterText() || !!this._parentMenuFilter?.active();
  });

  constructor(private _parentMenuFilter: MenuFilter | null) {
  }

  /**
   * Sets the filter for filtering menu items.
   */
  public setFilterText(filterText: string | null): void {
    this._filterText.set(filterText || null); // eslint-disable-line @typescript-eslint/prefer-nullish-coalescing
  }

  /**
   * Tests whether the given menu item matches the filter.
   */
  public matches(menuItem: SciMenuItem): Signal<boolean> {
    return computed(() => {
      const filterText = this._filterText();

      // Test if the menu item matches the filter using its filter function, if any.
      if (filterText && menuItem.matchesFilter && !menuItem.matchesFilter(filterText)) {
        return false;
      }

      // Test if the display text of the menu item matches the filter.
      if (filterText && !menuItem.matchesFilter && menuItem.labelText && !menuItem.labelText().toLowerCase().includes(filterText.toLowerCase())) {
        return false;
      }

      // Test if the menu item matches the parent filter, if any.
      if (this._parentMenuFilter && !this._parentMenuFilter.matches(menuItem)()) {
        return false;
      }

      return true;
    });
  }
}
