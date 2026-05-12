/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import CustomMatcherResult = jasmine.CustomMatcherResult;
import CustomAsyncMatcher = jasmine.CustomAsyncMatcher;
import {retryOnError} from '../../../../../common/src/testing/testing.util';
import {MenuGroupPO, MenuItemPO, MenuPO} from '../../../menu/menu.po';
import {SciMenuContributionPositionLike} from '../../../menu-contribution.model';
import {Translatable} from '@scion/components/text';
import {expectToolbarItems} from './to-equal-toolbar.matcher';

/**
 * Provides the implementation of {@link CustomAsyncMatchers#toEqualMenu}.
 */
export const toEqualMenuCustomMatcher: jasmine.CustomAsyncMatcherFactories = {
  toEqualMenu: (): CustomAsyncMatcher => {
    return {
      async compare(actual: MenuPO, expected: ExpectedSciMenuItemLike[] | ExpectedSciMenuObject, failOutput: string | undefined): Promise<CustomMatcherResult> {
        try {
          await retryOnError(() => {
            assertMenu(expected, actual);
          });

          return pass();
        }
        catch (error) {
          console.log('>>> error', error);
          return fail(error instanceof Error ? error.message : `${error}`);
        }

        function pass(): CustomMatcherResult {
          return {pass: true};
        }

        function fail(message: string): CustomMatcherResult {
          return {pass: false, message: message.concat(failOutput ? ` (${failOutput})` : '')};
        }
      },
    };
  },
  toBeAttached: (): CustomAsyncMatcher => {
    return {
      async compare(actual: MenuPO, failOutput: string | undefined): Promise<CustomMatcherResult> {
        try {
          await retryOnError(() => {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (!actual.debugElement) {
              throw Error('[DOMAssertError Expected menu to be attached, but was not.');
            }
          });

          return pass();
        }
        catch (error) {
          return fail(error instanceof Error ? error.message : `${error}`);
        }

        function pass(): CustomMatcherResult {
          return {pass: true};
        }

        function fail(message: string): CustomMatcherResult {
          return {pass: false, message: message.concat(failOutput ? ` (${failOutput})` : '')};
        }
      },
    };
  },
};

function assertMenu(expected: ExpectedSciMenuItemLike[] | ExpectedSciMenuObject, actual: MenuPO): void {
  if (!Array.isArray(expected)) {
    if (expected.notFoundText !== undefined) {
      if (actual.noItemsFoundText !== expected.notFoundText) {
        throw Error(`[DOMAssertError] Expected not found text to be '${expected.notFoundText}' but was ${actual.noItemsFoundText}`);
      }
    }

    if (expected.filter !== undefined) {
      if (expected.filter === true) {
        if (!actual.filterInputElement) {
          throw Error(`[DOMAssertError] Expected menu filter to be present in the DOM, but is not.`);
        }
      }
      else if (expected.filter === false) {
        if (actual.filterInputElement) {
          throw Error(`[DOMAssertError] Expected menu filter not to be present in the DOM, but is.`);
        }
      }

      if (typeof expected.filter === 'object') {
        if (expected.filter.placeholder !== undefined) {
          if (actual.filterInputElement?.placeholder !== expected.filter.placeholder) {
            throw Error(`[DOMAssertError] Expected menu filter placeholder to be '${expected.filter.placeholder}' but was ${actual.filterInputElement?.placeholder}`);
          }
        }
      }
    }

    if (expected.width !== undefined) {
      const menuWidth = actual.nativeElement.getBoundingClientRect().width;
      if (menuWidth !== expected.width) {
        throw Error(`[DOMAssertError] Menu width expected to be '${expected.width}' but was '${menuWidth}'`);
      }
    }

    if (expected.height !== undefined) {
      const menuHeight = actual.nativeElement.getBoundingClientRect().height;
      const viewportHeight = actual.viewport.getBoundingClientRect().height;
      if (viewportHeight !== expected.height) {
        throw Error(`[DOMAssertError] Menu viewport height expected to be '${expected.height}' but was '${viewportHeight}'`);
      }
      if (menuHeight < viewportHeight) {
        throw Error(`[DOMAssertError] Menu height expected to be greater than or equal to viewport height '${viewportHeight}' but was '${menuHeight}'`);
      }
    }
    return;
  }

  expectChildren(expected, actual.children);
}

function expectChildren(expected: ExpectedSciMenuItemLike[], items: Array<MenuItemPO | MenuGroupPO>): void {
  if (items.length !== expected.length) {
    throw Error(`[DOMAssertError] Menu item count does not match expected [expected=${expected.length}, actual=${items.length}]`);
  }

  expected.forEach((item, index) => {
    const actual = items[index]!;
    switch (item.type) {
      case 'menu-item':
        assertMenuItem(item, actual as MenuItemPO);
        return;
      case 'menu':
        assertSubMenu(item, actual as MenuItemPO);
        return;
      case 'group':
        assertMenuGroup(item, actual as MenuGroupPO);
        return;
    }
  });
}

function assertMenuItem(item: ExpectedSciMenuItem, actual: MenuItemPO): void {
  const nativeElement = actual.nativeElement;

  if (item.iconLigature !== undefined) {
    if (actual.iconLigature !== item.iconLigature) {
      throw Error(`[DOMAssertError] Icon of menu item does not match [expected=${item.iconLigature}, actual=${actual.iconLigature}]`);
    }
  }

  if (item.iconComponent !== undefined) {
    if (!actual.iconComponent(item.iconComponent.selector)) {
      throw Error(`[DOMAssertError] Expected icon component to be present in the DOM, but is not. [selector=${item.iconComponent.selector}]`);
    }
  }

  if (item.labelText !== undefined) {
    if (actual.labelText !== item.labelText) {
      throw Error(`[DOMAssertError] Expected label text to match, but did not. [expected=${item.labelText}, actual=${(actual.labelText)}]`);
    }
  }

  if (item.labelComponent !== undefined) {
    if (!actual.labelComponent(item.labelComponent.selector)) {
      throw Error(`[DOMAssertError] Expected label component to be present in the DOM, but is not. [selector=${item.labelComponent.selector}]`);
    }
  }

  if (item.tooltip !== undefined) {
    if (nativeElement.title !== item.tooltip) {
      throw Error(`[DOMAssertError] Tooltip of menu item does not match [expected=${item.tooltip}, actual=${nativeElement.title}]`);
    }
  }

  if (item.disabled !== undefined) {
    if (nativeElement.disabled !== item.disabled) {
      throw Error(`[DOMAssertError] Disabled state of menu item does not match [expected=${item.disabled}, actual=${nativeElement.disabled}]`);
    }
  }

  if (item.checked !== undefined) {
    if (actual.checked !== item.checked) {
      throw Error(`[DOMAssertError] Checked state of menu item does not match [expected=${item.checked}, actual=${actual.checked}]`);
    }
  }

  if (item.active !== undefined) {
    if (actual.active !== item.active) {
      throw Error(`[DOMAssertError] Active state of menu item does not match [expected=${item.checked}, actual=${actual.active}]`);
    }
  }

  if (item.actions !== undefined) {
    expectToolbarItems(item.actions, actual.actions.items);
  }

  if (item.attributes !== undefined) {
    Object.entries(item.attributes).forEach(([key, value]) => {
      if (actual.debugElement.attributes[key] !== value) {
        throw Error(`[DOMAssertError] Attributes of menu item do not not match [expected={key=${key}, value=${value}}, actual=${[Object.entries(actual.debugElement.attributes).map((key, value) => `${key}="${value}"`).join(' ')]}]`);
      }
    });
  }

  if (item.cssClass !== undefined) {
    item.cssClass.forEach(cssClass => {
      if (!nativeElement.classList.contains(cssClass)) {
        throw Error(`[DOMAssertError] Css classes of menu item do not not match [expected=${item.cssClass}, actual=${nativeElement.classList}]`);
      }
    });
  }
}

function assertSubMenu(item: ExpectedSciMenu, actual: MenuItemPO): void {
  if (item.iconLigature !== undefined) {
    if (actual.iconLigature !== item.iconLigature) {
      throw Error(`[DOMAssertError] Icon of menu item does not match [expected=${item.iconLigature}, actual=${actual.iconLigature}]`);
    }
  }

  if (item.iconComponent !== undefined) {
    if (!actual.iconComponent(item.iconComponent.selector)) {
      throw Error(`[DOMAssertError] Expected icon component to be present in the DOM, but is not. [selector=${item.iconComponent.selector}]`);
    }
  }

  if (item.labelText !== undefined) {
    if (actual.labelText !== item.labelText) {
      throw Error(`[DOMAssertError] Expected label text to match, but did not. [expected=${item.labelText}, actual=${(actual.labelText)}]`);
    }
  }

  if (item.labelComponent !== undefined) {
    if (!actual.labelComponent(item.labelComponent.selector)) {
      throw Error(`[DOMAssertError] Expected label component to be present in the DOM, but is not. [selector=${item.labelComponent.selector}]`);
    }
  }

  if (item.tooltip !== undefined) {
    if (actual.nativeElement.title !== item.tooltip) {
      throw Error(`[DOMAssertError] Tooltip of menu item does not match [expected=${item.tooltip}, actual=${actual.nativeElement.title}]`);
    }
  }

  if (item.disabled !== undefined) {
    if (actual.nativeElement.disabled !== item.disabled) {
      throw Error(`[DOMAssertError] Disabled state of menu item does not match [expected=${item.disabled}, actual=${actual.nativeElement.disabled}]`);
    }
  }

  if (item.cssClass !== undefined) {
    item.cssClass.forEach(cssClass => {
      if (!actual.nativeElement.classList.contains(cssClass)) {
        throw Error(`[DOMAssertError] Css classes of menu item do not not match [expected=${item.cssClass}, actual=${actual.nativeElement.classList}]`);
      }
    });
  }

  item.children && expectChildren(item.children, actual.subMenu.children);
}

function assertMenuGroup(item: ExpectedSciMenuGroup, actual: MenuGroupPO): void {
  if (item.label !== undefined) {
    if (actual.label !== item.label) {
      throw Error(`[DOMAssertError] Expected label text to match, but did not. [expected=${item.label}, actual=${(actual.label)}]`);
    }
  }

  if (item.collapsible !== undefined) {
    if (actual.collapsed !== item.collapsible.collapsed) {
      throw Error(`[DOMAssertError] Collapsed state of menu group does not match [expected=${item.collapsible.collapsed}, actual=${actual.collapsed}]`);
    }
  }

  if (item.actions !== undefined) {
    expectToolbarItems(item.actions, actual.actions.items);
  }

  if (item.cssClass !== undefined) {
    item.cssClass.forEach(cssClass => {
      if (!actual.nativeElement.classList.contains(cssClass)) {
        throw Error(`[DOMAssertError] Css classes of menu group do not not match [expected=${item.cssClass}, actual=${actual.nativeElement.classList}]`);
      }
    });
  }

  item.children && expectChildren(item.children, actual.children);
}

export interface ExpectedSciMenuItem {
  type: 'menu-item';
  name?: `menuitem:${string}`;
  labelText?: string;
  labelComponent?: ExpectedSciComponentDescriptor;
  iconLigature?: string;
  iconComponent?: ExpectedSciComponentDescriptor;
  control?: ExpectedSciComponentDescriptor; // only in toolbar, not menu
  tooltip?: string;
  accelerator?: string[];
  disabled?: boolean; // Consider renaming to enabled; https://www.electronjs.org/docs/latest/api/menu-item
  checked?: boolean;
  active?: boolean;
  actions?: ExpectedSciMenuItemLike[];
  matchesFilter?: (filter: string) => boolean;
  cssClass?: string[];
  attributes?: {[name: string]: string};
  position?: SciMenuContributionPositionLike;
  onSelect?: () => Promise<boolean>;
}

export interface ExpectedSciMenu {
  type: 'menu';
  name?: `menu:${string}`;
  labelText?: string;
  labelComponent?: ExpectedSciComponentDescriptor;
  iconLigature?: string;
  iconComponent?: ExpectedSciComponentDescriptor;
  tooltip?: string;
  disabled?: boolean; // Consider renaming to enabled; https://www.electronjs.org/docs/latest/api/menu-item
  visualMenuHint?: boolean;
  cssClass?: string[];
  attributes?: {[name: string]: string};
  children?: ExpectedSciMenuItemLike[];
}

export interface ExpectedSciMenuGroup {
  type: 'group';
  name?: `menu:${string}` | `toolbar:${string}`;
  label?: string;
  collapsible?: {collapsed: boolean};
  position?: SciMenuContributionPositionLike;
  actions?: ExpectedSciMenuItemLike[];
  children?: ExpectedSciMenuItemLike[];
  cssClass?: string[];
}

export type ExpectedSciMenuItemLike = ExpectedSciMenuItem | ExpectedSciMenu | ExpectedSciMenuGroup;

export interface ExpectedSciMenuObject {
  width?: number;
  height?: number;
  filter?: boolean | {placeholder?: Translatable};
  notFoundText?: Translatable;
}

export const NO_ITEMS_FOUND = 'No items found.';

interface ExpectedSciComponentDescriptor {
  selector: string;
}
