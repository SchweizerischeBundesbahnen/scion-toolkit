/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertNotInReactiveContext, computed, DestroyRef, DOCUMENT, effect, ElementRef, inject, Injector, NgZone, runInInjectionContext, untracked} from '@angular/core';
import {SciMenuItem, SciMenuItemLike} from './menu.model';
import {Disposable, MaybeArray} from '@scion/toolkit/types';
import {fromEvent, merge, noop} from 'rxjs';
import {subscribeIn} from '@scion/toolkit/operators';
import {Arrays} from '@scion/toolkit/util';
import {ɵSciMenuService} from './ɵmenu.service';
import {coerceElement} from '@angular/cdk/coercion';
import {createDestroyableInjector} from '@scion/components/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {injectMenuAcceleratorTargets, injectMenuContext} from './menu-environment/menu-environment-providers';

/**
 * Installs accelerators for menu items contributed to the given location matching the specified context.
 *
 * An accelerator maps a physical key combination (key combined with modifiers such as `Ctrl`, `Shift`, or `Alt`) to an application action,
 * enabling users to trigger commands or navigate the user interface without using a pointer device.
 *
 * Menu items are contributed to a location and may declare a required context. Only accelerators of menu items matching the specified context are installed.
 *
 * This function must be called within an injection context, or an explicit {@link Injector} passed. Destroying the injection context uninstalls the accelerators.
 *
 * @param location - Specifies the menu, toolbar, or menubar for which to install accelerators.
 * @param options - Controls installation of accelerators.
 * @returns Handle to uninstall the accelerators.
 */
export function installMenuAccelerators(location: `menu:${string}` | `toolbar:${string}` | `menubar:${string}`, options?: SciMenuAcceleratorOptions): Disposable {
  const injector = createDestroyableInjector({parent: options?.injector ?? inject(Injector)});

  return runInInjectionContext(injector, () => {
    const environmentContext = injectMenuContext();
    const environmentTargets = injectMenuAcceleratorTargets();
    const context = computed(() => new Map([...environmentContext(), ...options?.context ?? new Map()]));
    const menuItems = inject(ɵSciMenuService).menuItems(location, context, {metadata: options?.metadata});

    effect(onCleanup => {
      const ɵmenuItems = menuItems();
      const ɵoptions: ɵSciMenuAcceleratorOptions = {
        targets: options?.target,
        environmentTargets: environmentTargets(),
        injector,
      };

      untracked(() => {
        const accelerators = ɵinstallMenuAccelerators(ɵmenuItems, ɵoptions);
        onCleanup(() => accelerators.dispose());
      });
    });

    return {
      dispose: () => injector.destroy(),
    };
  });
}

/**
 * Installs accelerators for given menu items, recursively for menu items in submenus and groups.
 */
export function ɵinstallMenuAccelerators(menuItems: SciMenuItemLike[], options?: ɵSciMenuAcceleratorOptions): Disposable {
  assertNotInReactiveContext(installMenuAccelerators, 'Call installMenuAccelerators() in a non-reactive (non-tracking) context, such as within the untracked() function.');

  const menuItemsWithAccelerator = collectMenuItemsWithAccelerator(menuItems);
  if (!menuItemsWithAccelerator.length) {
    return {dispose: noop};
  }

  const injector = options?.injector ?? inject(Injector);
  const zone = injector.get(NgZone);
  const targets = coerceElements(options?.targets) ?? coerceElements(options?.environmentTargets) ?? [injector.get(DOCUMENT)];
  const onSelectFn = options?.onSelect ?? (menuItem => menuItem.onSelect?.());

  const subscription = merge(...targets.map(target => fromEvent<KeyboardEvent>(target, 'keydown')))
    .pipe(
      subscribeIn(fn => zone.runOutsideAngular(fn)),
      takeUntilDestroyed(injector.get(DestroyRef)),
    )
    .subscribe(event => {
      // Skip if only pressing a modifier key.
      switch (event.key) {
        case 'Control':
        case 'Shift':
        case 'Alt':
        case 'AltGraph':
          return;
        // UNDOCUMENTED: `event.key` can be `undefined`, for example, when selecting an option from an input element's datalist.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        case undefined:
          return;
      }

      // Skip if not pressing a modifier key. Accelerators must have a modifier key.
      if (!event.ctrlKey && !event.altKey && !event.shiftKey && !event.metaKey && !allowedSingleKeys.has(event.key.toLowerCase())) {
        return;
      }

      const matchingMenuItems = menuItemsWithAccelerator.filter(menuItem => !menuItem.disabled?.() && matchesAccelerator(event, menuItem.accelerator));
      if (!matchingMenuItems.length) {
        return;
      }

      // Invoke menu item handler.
      event.preventDefault();
      event.stopPropagation();
      zone.run(() => matchingMenuItems.forEach(menuItem => onSelectFn(menuItem)));
    });

  return {
    dispose: () => subscription.unsubscribe(),
  };
}

/**
 * Returns given native elements, or `undefined` if empty.
 */
function coerceElements(targets: MaybeArray<Element | ElementRef<Element>> | undefined): Element[] | undefined {
  const elements = Arrays.coerce(targets).map(coerceElement);
  return elements.length ? elements : undefined;
}

/**
 * Returns a flat list of all menu items that have an accelerator.
 */
export function collectMenuItemsWithAccelerator(menuItemLikes: SciMenuItemLike[]): SciMenuItem[] {
  return menuItemLikes.reduce((menuItems, menuItemLike) => {
    switch (menuItemLike.type) {
      case 'menu-item': {
        return menuItems
          .concat(menuItemLike.accelerator ? menuItemLike : [])
          .concat(collectMenuItemsWithAccelerator(menuItemLike.actions ?? []))
          .concat(collectMenuItemsWithAccelerator(menuItemLike.menu?.children ?? []));
      }
      case 'group': {
        return menuItems
          .concat(collectMenuItemsWithAccelerator(menuItemLike.children))
          .concat(collectMenuItemsWithAccelerator(menuItemLike.actions ?? []));
      }
    }
  }, new Array<SciMenuItem>());
}

/**
 * Validates the passed menu accelerator to have a modifier, unless a function key, 'Delete', or 'Escape'.
 */
export function validateMenuAccelerator(accelerator: SciKeyboardAccelerator | undefined): SciKeyboardAccelerator | undefined {
  if (!accelerator) {
    return undefined;
  }

  if (!accelerator.ctrl && !accelerator.alt && !accelerator.shift && !allowedSingleKeys.has(accelerator.key.toLowerCase())) {
    console.warn(`[MenuDefinitionError] Illegal menu accelerator. The key '${accelerator.key}' requires a modifier such as 'Ctrl', 'Shift', or 'Alt'. Only function keys F1-F12 and 'Delete' are allowed without a modifier. Examples: ['ctrl', 's'], ['F5'].`);
    return undefined;
  }
  return accelerator;
}

/**
 * Tests if the given keyboard event matches the specified accelerator.
 */
function matchesAccelerator(event: KeyboardEvent, accelerator: SciKeyboardAccelerator | undefined): boolean {
  if (!accelerator) {
    return false;
  }
  if (accelerator.key.toLowerCase() !== event.key.toLowerCase()) {
    return false;
  }
  // Handles Meta key as the Control key modifier as on Apple devices the Command (⌘) key is used instead of the Control (Ctrl) key.
  if ((accelerator.ctrl ?? false) !== (event.ctrlKey || event.metaKey)) {
    return false;
  }
  if ((accelerator.shift ?? false) !== event.shiftKey) {
    return false;
  }
  if ((accelerator.alt ?? false) !== event.altKey) {
    return false;
  }
  if (accelerator.location === 'left' && event.location !== 1) {
    return false;
  }
  if (accelerator.location === 'right' && event.location !== 2) {
    return false;
  }
  if (accelerator.location === 'numpad' && event.location !== 3) {
    return false;
  }
  return true;
}

/**
 * Controls installation of accelerators.
 */
export interface SciMenuAcceleratorOptions {
  /**
   * Specifies DOM elements on which to install menu accelerators. Defaults to {@link SciMenuEnvironmentProvider.provideAcceleratorTargets} or {@link Document}.
   */
  target?: MaybeArray<Element | ElementRef<Element>>;
  /**
   * Controls in which context to install menu accelerators.
   *
   * Menu items are contributed to a location and may declare a required context. Only accelerators of menu items matching this context are installed.
   */
  context?: Map<string, unknown>;
  /**
   * Specifies metadata available to the operation.
   */
  metadata?: {[key: string]: unknown};
  /**
   * Specifies the injector used to install accelerators. Defaults to the current injection context. Destroying the injector uninstalls the accelerators.
   */
  injector?: Injector;
}

/**
 * Controls installation of accelerators.
 *
 * Accelerators are installed on the specified {@link targets}. If not set or empty, falls back to {@link environmentTargets}, defaulting to the {@link Document} if both are empty.
 */
export interface ɵSciMenuAcceleratorOptions {
  /**
   * Specifies DOM elements on which to install the accelerators. Defaults to {@link environmentTargets}.
   */
  targets?: MaybeArray<Element | ElementRef<Element>>;
  /**
   * Specifies default accelerator targets based on the current injection context. Defaults to {@link Document}.
   */
  environmentTargets?: MaybeArray<Element | ElementRef<Element>>;
  /**
   * Specifies the callback invoked when an accelerator is triggered. Defaults to invoking {@link SciMenuItem.onSelect}.
   */
  onSelect?: (menuItem: SciMenuItem) => void;
  /**
   * Specifies the injector used to install accelerators. Defaults to the current injection context. Destroying the injector uninstalls the accelerators.
   */
  injector?: Injector;
}

/**
 * Represents a keyboard accelerator to match specific keystrokes or key combinations.
 *
 * An accelerator maps a physical key combination (key combined with modifiers such as `Ctrl`, `Shift`, or `Alt`) to an application action,
 * enabling users to trigger commands or navigate the user interface without using a pointer device.
 */
export interface SciKeyboardAccelerator {
  /**
   * Specifies the key of the accelerator.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/UI_Events/Keyboard_event_key_values
   */
  key: string;
  /**
   * Indicates whether the `Ctrl` key (or `Cmd` key on macOS) must be pressed.
   */
  ctrl?: boolean;
  /**
   * Indicates whether the `Shift` key must be pressed.
   */
  shift?: boolean;
  /**
   * Indicates whether the `Alt` key (or `Opt` key on macOS) must be pressed.
   */
  alt?: boolean;
  /**
   * Specifies the physical location of the key on the keyboard.
   *
   * - `numpad`: Keys on the numeric keypad.
   * - `left`: Left-side modifier keys.
   * - `right`: Right-side modifier keys.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/location
   */
  location?: 'numpad' | 'left' | 'right';
}

/**
 * Keys that can be used without a modifier (ctrl, alt, shift).
 */
const allowedSingleKeys = new Set<string>([
  ...Array.from(Array(20).keys()).map(i => `f${i + 1}`), // F1 - F20
  'delete',
]);
