/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, effect, ElementRef, inject, Injector, input, untracked, ViewContainerRef} from '@angular/core';
import {SciToolbarGroupComponent} from './toolbar-group.component';
import {ɵinstallMenuAccelerators, ɵSciMenuAcceleratorOptions} from '../menu-accelerators';
import {ɵSciMenuService} from '../ɵmenu.service';
import {MaybeArray} from '@scion/toolkit/types';
import {injectMenuAcceleratorTargets, injectMenuContext} from '../menu-environment/menu-environment-providers';

/**
 * Represents a toolbar, a horizontal or vertical container that provides quick access to context-related tools.
 * A toolbar can contain buttons, toggles, menus, and other controls, with related items grouped together.
 *
 * To use the toolbar, assign it a name and contribute tools by calling the {@link contributeMenu} function, passing the toolbar name and a factory function.
 * The toolbar name must start with the `toolbar:` prefix. The toolbar calls the passed factory function with a {@link SciToolbarFactory} that provides methods
 * for adding tools, groups, and menus.
 *
 * ```html
 * <sci-toolbar name="toolbar:main"/>
 * ```
 *
 * ```ts
 * contributeMenu('toolbar:main', toolbar => toolbar
 *   .addToolbarButton({icon: 'undo', accelerator: {ctrl: true, key: 'Z'}, tooltip: 'Undo', onSelect: () => console.log('Undo')})
 *   .addToolbarButton({icon: 'redo', accelerator: {ctrl: true, key: 'Y'}, tooltip: 'Redo', onSelect: () => console.log('Redo')})
 *   .addGroup(group => group
 *     .addToolbarButton({icon: 'content_copy', accelerator: {ctrl: true, key: 'C'}, tooltip: 'Copy', onSelect: () => console.log('Copy')})
 *     .addToolbarButton({icon: 'content_paste', accelerator: {ctrl: true, key: 'V'}, tooltip: 'Paste', onSelect: () => console.log('Paste')}),
 *   )
 *   .addToolbarMenu({icon: 'folder', tooltip: 'File'}, menu => menu
 *     .addMenuItem({icon: 'save', label: 'Save', accelerator: {ctrl: true, key: 'S'}, onSelect: () => console.log('Save')})
 *     .addMenuItem({icon: 'print', label: 'Print', accelerator: {ctrl: true, key: 'P'}, onSelect: () => console.log('Print')})
 *     .addMenu({icon: 'file_download', label: 'Export As...'}, menu => menu
 *       .addMenuItem({icon: 'picture_as_pdf', label: 'PDF Document', onSelect: () => console.log('PDF Document')})
 *       .addMenuItem({icon: 'table_view', label: 'Excel Spreadsheet', onSelect: () => console.log('Excel Spreadsheet')}),
 *     ),
 *   ),
 * );
 * ```
 *
 * Multiple contributions to the same toolbar can populate it from different places in the application. Passing a {@link SciToolbarContributionLocation}
 * gives exact control over contribution placement within the toolbar. By default, toolbar items are added in contribution order.
 *
 * Toolbar groups and menus can have a name, enabling extension from other contributions.
 *
 * ## Context
 * A toolbar can have a context, a key/value map that describes its environment. Contributions can declare a minimal required context and read the toolbar context.
 *
 * A context can be set on the toolbar with the `context` input:
 *
 * ```html
 * <sci-toolbar name="toolbar:main" [context]="..."/>
 * ```
 *
 * A context can also be provided at the injector level using {@link provideMenuContextProvider}, for example, at the component, route, or application level.
 * Toolbars within the scope of the injector inherit the context but can override or extend it.
 *
 * ```ts
 * providers: [
 *   provideMenuContextProvider(() => new Map().set('key', 'value')),
 * ];
 * ```
 *
 * ## Accelerator Target
 * Tools and menu items can have an accelerator for quick access using a keyboard shortcut. By default, the toolbar uses the {@link Document} as the accelerator target.
 *
 * The accelerator target can be changed via the `acceleratorTarget` input:
 *
 * ```html
 * <sci-toolbar name="toolbar:main" [acceleratorTarget]="..."/>
 * ```
 *
 * Alternatively, accelerator targets can be provided at the injector level using {@link provideMenuAcceleratorTargetProvider}, for example, at the component, route, or application level.
 * Toolbars within the scope of the injector inherit the accelerator targets. Setting an accelerator target on the toolbar overrides inherited targets.
 *
 * ## Toolbar Size
 * Toolbar icons have a default size of `16px`. The size can be changed via the `--sci-toolbar-item-size` CSS variable, either globally in the `:root` or on a specific toolbar component.
 *
 * ```css
 * sci-toolbar {
 *   --sci-toolbar-item-size: 18px;
 * }
 * ```
 *
 * ## Hiding an Empty Toolbar
 * If the toolbar has no tools, it can be hidden using the CSS `:empty` pseudo-class:
 *
 * ```css
 * sci-toolbar:empty {
 *   display: none;
 * }
 * ```
 *
 * ## Custom Styling
 * The appearance of the toolbar can be customized using CSS variables, either globally in the `:root` or on a specific toolbar component.
 *
 * Supported CSS variables:
 * - `--sci-toolbar-item-size`: Size of toolbar items.
 * - `--sci-toolbar-item-cursor`: Cursor style when hovering over a toolbar item.
 * - `--sci-toolbar-item-text-color`: Text and icon color of toolbar items.
 * - `--sci-toolbar-item-text-color-disabled`: Text and icon color of disabled toolbar items.
 * - `--sci-toolbar-item-background-color`: Background color of toolbar items.
 * - `--sci-toolbar-item-background-color-hover`: Background color of a toolbar item when hovered.
 * - `--sci-toolbar-item-background-color-active`: Background color of a toolbar item when pressed.
 * - `--sci-toolbar-item-background-color-checked`: Background color of toggled toolbar items.
 * - `--sci-toolbar-item-border-radius`: Border radius of toolbar items.
 * - `--sci-toolbar-item-border-color-checked`: Border color of toggled toolbar items.
 * - `--sci-toolbar-item-outline-width`: Outline width of toolbar items when focused.
 * - `--sci-toolbar-item-menu-indicator-color`: Color of the toolbar icon menu indicator.
 * - `--sci-toolbar-item-menu-indicator-color-disabled`: Color of the toolbar icon menu indicator if disabled.
 * - `--sci-toolbar-item-menu-indicator-size`: Size of the toolbar icon menu indicator.
 */
@Component({
  selector: 'sci-toolbar',
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  imports: [
    SciToolbarGroupComponent,
  ],
  host: {
    '[attr.name]': 'name()', // Public API: Enables selecting the toolbar by name in CSS (also if the toolbar has a dynamic name input binding)
  },
})
export class SciToolbarComponent {

  /**
   * Defines the name of the toolbar. The name must start with the `toolbar:` prefix.
   *
   * Use this name to contribute tools to the toolbar using the {@link contributeMenu} function.
   */
  public readonly name = input.required<`toolbar:${string}`>();

  /**
   * Specifies the orientation of the toolbar. Defaults to `horizontal`.
   */
  public readonly orientation = input<'horizontal' | 'vertical'>('horizontal');

  /**
   * Specifies the context of the toolbar to describe its environment.
   *
   * Contributions can declare a minimal required context and read the toolbar context.
   *
   * A context can also be provided at the injector level using {@link provideMenuContextProvider}, for example, at the component, route, or application level.
   * Toolbars within the scope of the injector inherit the context but can override or extend it.
   *
   * @see provideMenuContextProvider
   */
  public readonly context = input<Map<string, unknown>>();

  /**
   * Specifies the accelerator targets for the toolbar. Defaults to {@link Document}.
   *
   * Alternatively, accelerator targets can be provided at the injector level using {@link provideMenuAcceleratorTargetProvider}, for example, at the component, route, or application level.
   * Toolbars within the scope of the injector inherit the accelerator targets. Setting an accelerator target on the toolbar overrides inherited targets.
   */
  public readonly acceleratorTarget = input<MaybeArray<Element | ElementRef<Element>>>();

  /**
   * Controls where to attach menu popovers in the DOM. By default, popovers are added as a direct sibling of the toolbar.
   */
  public readonly popoverViewContainerRef = input<ViewContainerRef>(inject(ViewContainerRef));

  private readonly _environmentContext = injectMenuContext();
  private readonly _context = computed(() => new Map([...this._environmentContext(), ...this.context() ?? new Map()]));

  protected readonly menuItems = inject(ɵSciMenuService).menuItems(this.name, this._context);

  constructor() {
    this.installAccelerators();
  }

  /**
   * Installs accelerators of menu items in this toolbar, recursively for menu items in submenus and groups.
   */
  private installAccelerators(): void {
    const injector = inject(Injector);
    const environmentTargets = injectMenuAcceleratorTargets();

    effect(onCleanup => {
      const menuItems = this.menuItems();
      const options: ɵSciMenuAcceleratorOptions = {
        targets: this.acceleratorTarget(),
        environmentTargets: environmentTargets(),
        injector,
      };

      untracked(() => {
        const accelerators = ɵinstallMenuAccelerators(menuItems, options);
        onCleanup(() => accelerators.dispose());
      });
    });
  }
}
