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
import {ExpectedSciMenu, ExpectedSciMenuGroup, ExpectedSciMenuItem, ExpectedSciMenuItemLike} from './to-equal-menu.matcher';
import {retryOnError} from '../../../../../common/src/testing/testing.util';
import {ToolbarGroupPO, ToolbarButtonPO, ToolbarPO, ToolbarSplitButtonPO} from '../../../toolbar/toolbar.po';

/**
 * Provides the implementation of {@link CustomAsyncMatchers#toEqualToolbar}.
 */
export const toEqualToolbarCustomMatcher: jasmine.CustomAsyncMatcherFactories = {
  toEqualToolbar: (): CustomAsyncMatcher => {
    return {
      async compare(actual: ToolbarPO, expected: ExpectedSciMenuItemLike[], failOutput: string | undefined): Promise<CustomMatcherResult> {
        try {
          await retryOnError(() => {
            assertToolbar(expected, actual);
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
};

export function assertToolbar(expected: ExpectedSciMenuItemLike[], toolbar: ToolbarPO): void {
  expectToolbarItems(expected, toolbar.items);
}

export function expectToolbarItems(expected: ExpectedSciMenuItemLike[] | undefined, items: Array<ToolbarButtonPO | ToolbarSplitButtonPO | ToolbarGroupPO>): void {
  if (expected === undefined) {
    return;
  }

  if (items.length !== expected.length) {
    throw Error(`[DOMAssertError] Toolbar item count does not match expected [expected=${expected.length}, actual=${items.length}]`);
  }

  expected.forEach((item, index) => {
    const actual = items[index]!;
    switch (item.type) {
      case 'menu-item':
        assertMenuItem(item, actual as ToolbarButtonPO | ToolbarSplitButtonPO);
        return;
      case 'menu':
        assertMenu(item, actual as ToolbarButtonPO);
        return;
      case 'group':
        assertToolbarGroup(item, actual as ToolbarGroupPO);
        return;
    }
  });
}

function assertMenuItem(item: ExpectedSciMenuItem, actual: ToolbarButtonPO | ToolbarSplitButtonPO): void {
  actual = actual instanceof ToolbarSplitButtonPO ? actual.primaryButton : actual;
  const debugElement = actual.debugElement;
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
      throw Error(`[DOMAssertError] Tooltip of toolbar item does not match [expected=${item.tooltip}, actual=${nativeElement.title}]`);
    }
  }

  if (item.disabled !== undefined) {
    if (nativeElement.disabled !== item.disabled) {
      throw Error(`[DOMAssertError] Disabled state of toolbar item does not match [expected=${item.disabled}, actual=${nativeElement.disabled}]`);
    }
  }

  if (item.checked !== undefined) {
    if (actual.checked !== item.checked) {
      throw Error(`[DOMAssertError] Checked state of toolbar item does not match [expected=${item.checked}, actual=${actual.checked}]`);
    }
  }

  if (item.cssClass !== undefined) {
    item.cssClass.forEach(cssClass => {
      if (!nativeElement.classList.contains(cssClass)) {
        throw Error(`[DOMAssertError] Css classes of toolbar item do not not match [expected=${item.cssClass}, actual=${nativeElement.classList}]`);
      }
    });
  }

  if (item.attributes !== undefined) {
    Object.entries(item.attributes).forEach(([key, value]) => {
      if (debugElement.attributes[key] !== value) {
        throw Error(`[DOMAssertError] Attributes of toolbar item do not not match [expected={key=${key}, value=${value}}, actual=${[Object.entries(debugElement.attributes).map((key, value) => `${key}="${value}"`).join(' ')]}]`);
      }
    });
  }
}

function assertMenu(item: ExpectedSciMenu, actual: ToolbarButtonPO): void {
  const debugElement = actual.debugElement;
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
      throw Error(`[DOMAssertError] Tooltip of toolbar item does not match [expected=${item.tooltip}, actual=${nativeElement.title}]`);
    }
  }

  if (item.disabled !== undefined) {
    if (nativeElement.disabled !== item.disabled) {
      throw Error(`[DOMAssertError] Disabled state of toolbar item does not match [expected=${item.disabled}, actual=${nativeElement.disabled}]`);
    }
  }

  if (item.visualMenuHint !== undefined) {
    if (actual.visualMenuHint !== item.visualMenuHint) {
      throw Error(`[DOMAssertError] Visual menu hint of toolbar item does not match. [expected=${item.visualMenuHint}, actual=${actual.visualMenuHint}]`);
    }
  }

  if (item.cssClass !== undefined) {
    item.cssClass.forEach(cssClass => {
      if (!nativeElement.classList.contains(cssClass)) {
        throw Error(`[DOMAssertError] Css classes of toolbar item do not not match [expected=${item.cssClass}, actual=${nativeElement.classList}]`);
      }
    });
  }

  if (item.attributes !== undefined) {
    Object.entries(item.attributes).forEach(([key, value]) => {
      if (debugElement.attributes[key] !== value) {
        throw Error(`[DOMAssertError] Attributes of toolbar item do not not match [expected={key=${key}, value=${value}}, actual=${[Object.entries(debugElement.attributes).map((key, value) => `${key}="${value}"`).join(' ')]}]`);
      }
    });
  }
}

function assertToolbarGroup(item: ExpectedSciMenuGroup, actual: ToolbarGroupPO): void {
  if (item.cssClass !== undefined) {
    item.cssClass.forEach(cssClass => {
      if (!actual.nativeElement.classList.contains(cssClass)) {
        throw Error(`[DOMAssertError] Css classes of toolbar item do not not match [expected=${item.cssClass}, actual=${actual.nativeElement.classList}]`);
      }
    });
  }

  expectToolbarItems(item.children, actual.items);
}
