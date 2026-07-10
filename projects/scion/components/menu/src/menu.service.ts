/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ElementRef, Injectable, ViewContainerRef} from '@angular/core';
import {ɵSciMenuService} from './ɵmenu.service';
import {RequireOne} from '@scion/toolkit/types';
import {SciMenuFilterConfig} from './menu/menu.factory';

/**
 * Opens a menu with items contributed via {@link contributeMenu}.
 *
 * A menu displays a list of related items in a popover, organized into groups and submenus.
 * It closes when a menu item is selected or on an outside click. Menu items can define a keyboard accelerator for quick access.
 *
 * ## Menu Item Size
 * The menu item size is based on the `--sci-menu-item-size` CSS variable and defaults to `16px`. It determines the icon size and is used to compute the font size and padding.
 *
 * A custom size can be defined globally via the `:root` selector:
 *
 * ```css
 * sci-menu {
 *   --sci-menu-item-size: 18px;
 * }
 * ```
 *
 * Instead of computing the font size based on `--sci-menu-item-size`, an explicit font size can be defined using the `--sci-menu-font-size` CSS variable:
 *
 * ```css
 * sci-menu {
 *   --sci-menu-item-size: 14px;
 * }
 * ```
 *
 * ## Custom Styling
 * The appearance of the menu can be customized using the following CSS variables:
 *
 *  - `--sci-menu-font-size`: Font size of menu items.
 *  - `--sci-menu-border-radius`: Border radius of a menu popover.
 *  - `--sci-menu-min-width`: Minimum width of a menu popover.
 *  - `--sci-menu-submenu-min-width`: Minimum width of a submenu popover.
 *  - `--sci-menu-item-size`: Size of menu items; used as the menu item icon size and to compute font size and padding.
 *  - `--sci-menu-item-cursor`: Cursor style when hovering over a menu item.
 *  - `--sci-menu-item-text-color`: Text and icon color of menu items.
 *  - `--sci-menu-item-text-color-disabled`: Text and icon color of disabled menu items.
 *  - `--sci-menu-item-background-color-hover`: Background color of a menu item when hovered.
 *  - `--sci-menu-item-background-color-active`: Background color of a menu item when pressed.
 *  - `--sci-menu-item-border-radius`: Border radius of menu items.
 *  - `--sci-menu-item-outline-width`: Outline width of menu items when focused.
 *  - `--sci-menu-item-accelerator-text-color`: Text color of menu item accelerators.
 *  - `--sci-menu-item-active-indicator-size`: Size of the visual indicator for active menu items.
 *  - `--sci-menu-item-active-indicator-background-color`: Background color of the visual indicator for active menu items.
 *  - `--sci-menu-item-active-indicator-border-radius`: Border radius of the visual indicator for active menu items.
 *  - `--sci-menu-group-header-font-family`: Font family for group headers.
 *  - `--sci-menu-group-header-font-size`: Font size for group headers.
 *  - `--sci-menu-group-header-font-weight`: Font weight for group headers.
 *  - `--sci-menu-group-header-text-color`: Text color for group headers.
 *  - `--sci-menu-filter-outline-width`: Outline width of the filter field.
 *  - `--sci-menu-filter-outline-radius`: Outline radius of the filter field.
 */
@Injectable({providedIn: 'root', useExisting: ɵSciMenuService})
export abstract class SciMenuService {

  /**
   * Opens a menu with items contributed to the specified menu.
   *
   * The menu is positioned relative to the specified anchor, vertically or horizontally. The anchor can be a coordinate, a mouse event, or a DOM element.
   *
   * ```ts
   * import {inject} from '@angular/core';
   * import {SciMenuService} from '@scion/components/menu';
   *
   * inject(SciMenuService).open('menu:contextmenu', { // <--- Specifies the name of the menu
   *   anchor: {x: 500, y: 600}, // <--- Specifies the anchor
   * });
   * ```
   *
   * Use the {@link contributeMenu} function to contribute to the menu by passing the menu name and a factory function.
   * The menu calls the factory function with a {@link SciMenuFactoryFn}, providing methods for populating the menu.
   *
   * ```ts
   * import {contributeMenu} from '@scion/components/menu';
   *
   * contributeMenu('menu:contextmenu', menu => menu
   *   .addMenuItem({icon: 'content_copy', label: 'Copy', onSelect: () => console.log('Copy')})
   *   .addMenuItem({icon: 'content_paste', label: 'Paste', onSelect: () => console.log('Paste')}),
   * );
   * ```
   *
   * Multiple contributions to the same menu can populate it from different places in the application. Passing a {@link SciMenuContributionLocation}
   * gives exact control over contribution placement within the menu. By default, menu items are added in contribution order.
   *
   * Groups and submenus can be named to allow extension from other contributions.
   *
   * ## Location in the DOM
   * By default, the menu popover is inserted after the anchor element in the DOM, or appended to the HTML body if using a coordinate anchor.
   *
   * A different location can be set via the {@link SciMenuOptions.viewContainerRef} option:
   *
   * ```ts
   * import {inject, ViewContainerRef} from '@angular/core';
   * import {SciMenuService} from '@scion/components/menu';
   *
   * inject(SciMenuService).open('menu:contextmenu', {
   *   anchor: {x: 500, y: 600},
   *   viewContainerRef: inject(ViewContainerRef), // <--- Specifies a custom DOM location
   * });
   * ```
   *
   * ## Filterable Menu
   * Setting the {@link SciMenuOptions.filter} option displays a filter field, enabling filtering of menu items.
   *
   * ```ts
   * import {inject} from '@angular/core';
   * import {SciMenuService} from '@scion/components/menu';
   *
   * inject(SciMenuService).open('menu:contextmenu', {
   *   anchor: {x: 500, y: 600},
   *   filter: true, // <--- Instructs the menu to display a filter field
   * });
   * ```
   *
   * ## Menu Size
   * The menu size can be controlled via menu options. By default, a menu uses the minimum width defined by the `--sci-menu-min-width` or `--sci-menu-submenu-min-width` CSS variables.
   *
   * ```ts
   * import {inject} from '@angular/core';
   * import {SciMenuService} from '@scion/components/menu';
   *
   * inject(SciMenuService).open('menu:contextmenu', {
   *   anchor: {x: 500, y: 600},
   *   width: '500px', // <--- Specifies a fixed menu width
   *   maxHeight: '800px', // <--- Specifies a maximum menu height
   * });
   * ```
   *
   * ## Context
   * A menu can have a context, a key/value map that describes its environment. Contributions can declare a minimal required context and read the menu context.
   *
   * A context can be set via the {@link SciMenuOptions.context} option:
   *
   * ```ts
   * import {SciMenuService} from '@scion/components/menu';
   * import {inject} from '@angular/core';
   *
   * inject(SciMenuService).open('menu:contextmenu', {
   *   anchor: {x: 500, y: 600},
   *   context: new Map().set('key', 'value'), // <--- Specifies the context
   * });
   * ```
   *
   * ## Accelerators
   * Menu items can have an accelerator for quick access using a keyboard shortcut.
   *
   * Menu accelerators must be installed using the {@link installMenuAccelerators} function, passing the name of the menu.
   *
   * ```ts
   * import {installMenuAccelerators} from '@scion/components/menu';
   *
   * installMenuAccelerators('menu:contextmenu', {
   *   context: new Map().set('key', 'value'), // <--- Specifies the menu context, if any
   * });
   * ```
   *
   * By default, accelerators are installed on the {@link Document}. A different accelerator target can be defined via the {@link SciMenuAcceleratorOptions.target} option.
   *
   * ```ts
   * import {installMenuAccelerators} from '@scion/components/menu';
   * import {ElementRef, inject} from '@angular/core';
   *
   * installMenuAccelerators('menu:contextmenu', {
   *   target: inject(ElementRef), // <--- Specifies a different accelerator target
   * });
   * ```
   *
   * Alternatively, accelerator targets can be provided at the injector level using {@link provideMenuAcceleratorTargetProvider}, for example, at the component, route, or application level.
   * Accelerators installed within the scope of the injector inherit the accelerator targets. Setting an accelerator target on the menu overrides inherited targets.
   *
   * @param name - Specifies the name of the menu. Used to look up menu items contributed via the {@link contributeMenu} function.
   * @param options - Controls the appearance and placement of the menu. At minimum, the menu anchor must be configured to determine where to open the menu.
   * @returns A reference to the menu, allowing to close the menu or get notified when it is closed.
   */
  public abstract open(name: `menu:${string}`, options: SciMenuOptions): SciMenuRef;

  /**
   * Closes currently opened menus.
   */
  public abstract closeAll(): void;
}

/**
 * Controls the appearance and placement of a menu.
 */
export interface SciMenuOptions {
  /**
   * Controls where to open the menu.
   *
   * Can be an HTML element or a coordinate relative to the page viewport.
   */
  anchor: HTMLElement | ElementRef<HTMLElement> | SciMenuOrigin | MouseEvent;
  /**
   * Specifies the context of the menu to describe its environment.
   *
   * Contributions can declare a minimal required context and read the menu context.
   *
   * A context can also be provided at the injector level using {@link provideMenuContextProvider}, for example, at the component, route, or application level.
   * Menus opened within the scope of the injector inherit the context but can override or extend it.
   *
   * ```ts
   * import {provideMenuContextProvider} from '@scion/components/menu';
   *
   * providers: [
   *   provideMenuContextProvider(() => new Map().set('key', 'value')),
   * ];
   * ```
   *
   * @see provideMenuContextProvider
   */
  context?: Map<string, unknown>;
  /**
   * Controls whether to open the menu below or to the side of the anchor.
   */
  align?: 'vertical' | 'horizontal';
  /**
   * Controls where to insert the menu popover into the DOM.
   *
   * By default, the menu popover is inserted after the anchor element, or appended to the HTML body if using a coordinate anchor.
   */
  viewContainerRef?: ViewContainerRef;
  /**
   * Indicates whether the menu is opened as a submenu.
   *
   * @internal
   */
  submenu?: true;
  /**
   * Specifies the preferred menu width.
   */
  width?: string;
  /**
   * Specifies the preferred minimum menu width.
   *
   * Defaults to the `--sci-menu-min-width` or `--sci-menu-submenu-min-width` CSS variables.
   *
   * If the anchor is an {@link HTMLElement}, the effective minimum width evaluates to `max(anchorWidth, minWidth)`.
   */
  minWidth?: string;
  /**
   * Specifies the maximum menu width.
   */
  maxWidth?: string;
  /**
   * Specifies the maximum menu height.
   */
  maxHeight?: string;
  /**
   * Enables users to filter menu items.
   *
   * Setting a descriptor allows customizing the filter field, such as defining a custom placeholder text or controlling whether the filter field is focused on open.
   */
  filter?: boolean | RequireOne<SciMenuFilterConfig>;
  /**
   * Specifies CSS classes to associate with the menu.
   */
  cssClass?: string | string[];
  /**
   * Specifies HTML attributes to associate with the menu.
   *
   * Data attributes should start with the `data-` prefix.
   */
  attributes?: {[name: string]: string};
  /**
   * Allows associating arbitrary metadata with the operation.
   *
   * @internal Not public API. Used by frameworks integrating the SCION Menu API. Applications should not use this property.
   */
  metadata?: {[key: string]: unknown};
}

/**
 * Coordinate relative to the top/left corner of the page viewport.
 */
export interface SciMenuOrigin {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

/**
 * Represents a reference to a menu.
 *
 * Use to close the menu or get notified when the menu is closed.
 */
export interface SciMenuRef {
  /**
   * Closes the menu. Has no effect if the menu is already closed.
   */
  close(): void;

  /**
   * Registers a callback to be notified when the menu is closed.
   *
   * If the menu is already closed, the callback is executed immediately.
   */
  onClose: (fn: () => void) => void;
}
