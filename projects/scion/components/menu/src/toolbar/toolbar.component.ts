/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, effect, ElementRef, inject, Injector, input, untracked, viewChild, ViewContainerRef} from '@angular/core';
import {SciToolbarGroupComponent} from './toolbar-group.component';
import {ɵinstallMenuAccelerators, ɵSciMenuAcceleratorOptions} from '../menu-accelerators';
import {ɵSciMenuService} from '../ɵmenu.service';
import {MaybeArray} from '@scion/toolkit/types';
import {injectMenuAcceleratorTargets, injectMenuContext} from '../menu-environment/menu-environment-providers';

/**
 * Displays items contributed via the {@link contributeMenu} function matching the toolbar's name.
 *
 * A toolbar is a horizontal or vertical container providing quick access to context-related tools.
 * It contains buttons, toggles, menus, and other controls, with related items grouped together.
 *
 * The toolbar must be assigned a name, used as the location when contributing to the toolbar.
 * The name must start with the `toolbar:` prefix.
 *
 * ```html
 * <sci-toolbar name="toolbar:main"/>
 * ```
 *
 * Use the {@link contributeMenu} function to contribute to the toolbar by passing the toolbar name and a factory function.
 * The toolbar calls the factory function with a {@link SciToolbarFactory}, providing methods for populating the toolbar.
 *
 * ```ts
 * import {contributeMenu} from '@scion/components/menu';
 *
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
 * Menus and groups can be named to allow extension from other contributions.
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
 * ## Accelerator Target
 * Tools can have an accelerator for quick access using a keyboard shortcut. By default, the toolbar uses the {@link Document} as the accelerator target.
 *
 * The accelerator target can be changed via the `acceleratorTarget` input:
 *
 * ```html
 * <sci-toolbar name="toolbar:main" [acceleratorTarget]="..."/>
 * ```
 *
 * ## Toolbar Size
 * The toolbar size is based on the `--sci-toolbar-item-size` CSS variable and defaults to 16px. It determines the icon size and is used to compute the font size and padding.
 *
 * A custom size can be defined globally using the `:root` selector or scoped to a specific toolbar.
 *
 * ```css
 * sci-toolbar {
 *   --sci-toolbar-item-size: 18px;
 * }
 * ```
 *
 * Instead of computing the font size based on `--sci-toolbar-item-size`, an explicit font size can be defined using the `--sci-toolbar-font-size` CSS variable, either globally or at the toolbar level.
 *
 * ```css
 * sci-toolbar {
 *   --sci-toolbar-font-size: 14px;
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
 * The appearance of the toolbar can be customized using the following CSS variables, either globally in the `:root` or on the toolbar level.
 *
 * - `--sci-toolbar-font-size`: Font size of toolbar items.
 * - `--sci-toolbar-item-size`: Size of toolbar items; used as the toolbar item icon size and to compute font size and padding.
 * - `--sci-toolbar-item-cursor`: Cursor style when hovering over a toolbar item.
 * - `--sci-toolbar-item-text-color`: Text and icon color of toolbar items.
 * - `--sci-toolbar-item-text-color-disabled`: Text and icon color of disabled toolbar items.
 * - `--sci-toolbar-item-background-color-hover`: Background color of a toolbar item when hovered.
 * - `--sci-toolbar-item-background-color-active`: Background color of a toolbar item when pressed.
 * - `--sci-toolbar-item-background-color-checked`: Background color of toggled toolbar items.
 * - `--sci-toolbar-item-border-radius`: Border radius of toolbar items.
 * - `--sci-toolbar-item-border-color-hover`: Border color of toolbar items when hovered.
 * - `--sci-toolbar-item-border-color-checked`: Border color of toggled toolbar items.
 * - `--sci-toolbar-item-outline-width`: Outline width of toolbar items when focused.
 * - `--sci-toolbar-item-menu-indicator-color`: Color of the menu indicator for toolbar items without a label.
 * - `--sci-toolbar-item-menu-indicator-color-disabled`: Color of the menu indicator if disabled.
 * - `--sci-toolbar-item-menu-indicator-size`: Size of the menu indicator.
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
   * Specifies a context to describe the environment of the toolbar.
   *
   * Toolbar contributions may declare a required context. Only contributions matching this context are used.
   *
   * A context can also be provided at the injector level using {@link provideMenuContextProvider}, for example, at the component, route, or application level,
   * and is available to toolbars used in the scope of this injector. The inherited context can be overridden or extended. Setting a context entry to `undefined` clears it.
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
  public readonly context = input<Map<string, unknown>>();

  /**
   * Specifies the accelerator targets for the toolbar. Defaults to {@link Document}.
   *
   * Alternatively, accelerator targets can be provided at the injector level using {@link provideMenuAcceleratorTargetProvider}, for example, at the component, route, or application level,
   * and are available to toolbars used in the scope of this injector. Inherited targets can be overridden.
   *
   * ```ts
   * import {provideMenuAcceleratorTargetProvider} from '@scion/components/menu';
   * import {ElementRef, inject} from '@angular/core';
   *
   * providers: [
   *   provideMenuAcceleratorTargetProvider(() => inject(ElementRef)),
   * ];
   * ```
   */
  public readonly acceleratorTarget = input<MaybeArray<Element | ElementRef<Element>>>();

  /**
   * Controls where to attach menu popovers in the DOM. By default, popovers are added as a direct sibling of the toolbar.
   */
  public readonly popoverViewContainerRef = input<ViewContainerRef>(inject(ViewContainerRef));

  /**
   * Indicates whether a menu is opened in this or any child group.
   *
   * TODO should it be internal?
   */
  public readonly toolbarMenuOpen = computed(() => this._toolbarGroupComponent()?.toolbarMenuOpen() ?? false);

  private readonly _environmentContext = injectMenuContext();
  private readonly _context = computed(() => new Map([...this._environmentContext(), ...this.context() ?? new Map()]));

  protected readonly menuItems = inject(ɵSciMenuService).menuItems(this.name, this._context);

  private readonly _toolbarGroupComponent = viewChild(SciToolbarGroupComponent);

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
