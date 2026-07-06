/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ComponentType} from '@angular/cdk/portal';
import {SciMenuDescriptor, SciMenuFactory} from '../menu/menu.factory';
import {MaybeSignal, SciComponentDescriptor} from '@scion/components/common';
import {Translatable} from '@scion/components/text';
import {SciKeyboardAccelerator} from '../menu-accelerators';
import {Binding, Injector, Provider} from '@angular/core';

/**
 * Factory used for adding items to a {@link SciToolbarComponent}.
 *
 * A toolbar is a horizontal or vertical container that provides quick access to context-related tools.
 * It can contain buttons, split buttons, toggles, menus, and other controls, with related items grouped together.
 *
 * The methods of this factory return a reference to this factory, enabling method chaining.
 */
export interface SciToolbarFactory {

  /**
   * Adds a button or toggle to the toolbar.
   *
   * A toolbar button typically has an icon, a tooltip, and an accelerator. Clicking the button invokes {@link SciToolbarButtonDescriptor.onSelect}.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarButton({icon: 'undo', accelerator: {ctrl: true, key: 'Z'}, tooltip: 'Undo', onSelect: () => console.log('Undo')})
   *   .addToolbarButton({icon: 'redo', accelerator: {ctrl: true, key: 'Y'}, tooltip: 'Redo', onSelect: () => console.log('Redo')}),
   * );
   * ```
   *
   * ##### Toggle Button
   *
   * Setting {@link SciToolbarButtonDescriptor.checked} configures the button as a toggle button.
   *
   * ```ts
   * const bold = signal(true);
   * const italic = signal(false);
   *
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarButton({icon: 'format_bold', checked: bold, accelerator: {ctrl: true, shift: true, key: 'B'}, tooltip: 'Bold', onSelect: () => bold.update(bold => !bold)})
   *   .addToolbarButton({icon: 'format_italic', checked: italic, accelerator: {ctrl: true, shift: true, key: 'I'}, tooltip: 'Italic', onSelect: () => italic.update(italic => !italic)}),
   * );
   * ```
   *
   * ##### Allow for Relative Positioning
   *
   * Assigning a name allows other contributions to be positioned relative to this button.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarButton({
   *     name: 'menuitem:undo', // <--- Give button a name
   *     icon: 'undo',
   *     onSelect: () => console.log('Undo'),
   *   }),
   * );
   * ```
   *
   * Use that name to contribute before or after the toolbar button.
   *
   * ```ts
   * contributeMenu({location: 'toolbar:main', after: 'menuitem:undo'}, toolbar => toolbar
   *   .addToolbarButton({icon: 'save', onSelect: () => console.log('Save')}),
   * );
   * ```
   *
   * @param descriptor - Configures the appearance and behavior of the button.
   * @returns A reference to this factory, enabling method chaining.
   */
  addToolbarButton(descriptor: SciToolbarButtonDescriptor): this;

  /**
   * Adds a split button to the toolbar.
   *
   * A split button consists of two parts: a primary action button and a menu button that opens a menu with related actions.
   * Clicking the primary action button invokes {@link SciToolbarButtonDescriptor.onSelect}.
   *
   * Pass a descriptor to configure the primary action button and the appearance of the menu.
   * To add menu items to the menu, pass a menu factory function as the second argument. The menu calls this function with a {@link SciMenuFactory} that provides methods for populating it.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarSplitButton({
   *       icon: 'content_paste',
   *       tooltip: 'Paste',
   *       accelerator: {ctrl: true, key: 'V'},
   *       onSelect: () => console.log('Paste'),
   *     }, menu => menu
   *       .addMenuItem({icon: 'image', label: 'Paste Rich Text', onSelect: () => console.log('Paste Rich Text')})
   *       .addMenuItem({icon: 'article', label: 'Paste Text', onSelect: () => console.log('Paste Text')})
   *       .addMenuItem({icon: 'link', label: 'Paste URL', onSelect: () => console.log('Paste URL')}),
   *   ),
   * );
   * ```
   *
   * ##### Allow for Separate Menu Contributions
   *
   * As an alternative to defining the menu items inline, assign the menu a name, allowing for separate contributions to the menu using {@link contributeMenu}.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarSplitButton({
   *     icon: 'content_paste',
   *     tooltip: 'Paste',
   *     accelerator: {ctrl: true, key: 'V'},
   *     onSelect: () => console.log('Paste'),
   *     menu: {name: 'menu:paste-options'}, // <--- Give menu a name
   *   }),
   * );
   * ```
   *
   * Use that name to contribute to the menu.
   *
   * ```ts
   * contributeMenu('menu:paste-options', menu => menu
   *   .addMenuItem({icon: 'image', label: 'Paste Rich Text', onSelect: () => console.log('Paste Rich Text')})
   *   .addMenuItem({icon: 'article', label: 'Paste Text', onSelect: () => console.log('Paste Text')})
   *   .addMenuItem({icon: 'link', label: 'Paste URL', onSelect: () => console.log('Paste URL')}),
   * );
   * ```
   *
   * ##### Toggle Split Button
   *
   * Setting {@link SciToolbarButtonDescriptor.checked} configures the split button as a toggle button.
   *
   * ```ts
   * const underlined = signal<'solid' | 'dashed' | 'dotted' | false>(false);
   *
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarSplitButton({
   *       icon: 'format_underlined',
   *       checked: computed(() => underlined() !== false), // <--- Add checked state
   *       tooltip: 'Underlined',
   *       accelerator: {ctrl: true, shift: true, key: 'U'},
   *       onSelect: () => underlined.update(underlined => underlined ? false : 'solid'),
   *     }, menu => menu
   *       .addMenuItem({label: 'Solid', onSelect: () => underlined.set('solid')})
   *       .addMenuItem({label: 'Dashed', onSelect: () => underlined.set('dashed')})
   *       .addMenuItem({label: 'Dotted', onSelect: () => underlined.set('dotted')}),
   *   ),
   * );
   * ```
   *
   * ##### Allow for Relative Positioning
   *
   * Assigning the split button a name allows other contributions to be positioned relative to it.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarSplitButton({
   *     name: 'menuitem:paste', // <--- Give split button a name
   *     icon: 'content_paste',
   *     onSelect: () => console.log('Paste'),
   *   }),
   * );
   * ```
   *
   * Use that name to contribute before or after the split button.
   *
   * ```ts
   * contributeMenu({location: 'toolbar:main', after: 'menuitem:paste'}, toolbar => toolbar
   *   .addToolbarButton({icon: 'save', onSelect: () => console.log('Save')}),
   * );
   * ```
   *
   * @param descriptor - Configures the appearance and behavior of the split button and its menu.
   * @param menuFactoryFn - Optional factory function to add menu items to the menu.
   * @returns A reference to this factory, enabling method chaining.
   */
  addToolbarSplitButton(descriptor: SciToolbarButtonDescriptor & {menu?: SciMenuDescriptor['menu']}, menuFactoryFn?: (menu: SciMenuFactory) => void): this;

  /**
   * Adds a menu to the toolbar.
   *
   * Pass a descriptor to configure the menu button and the appearance of the menu.
   * By default, renders a visual menu indicator, which can be disabled via the {@link SciToolbarMenuDescriptor.visualMenuIndicator} property.
   *
   * To add menu items to the menu, pass a menu factory function as the second argument. The menu calls this function with a {@link SciMenuFactory} that provides methods for populating it.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
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
   * ##### Allow for Separate Menu Contributions
   *
   * As an alternative to defining the menu items inline, assign the menu (or submenu) a name, allowing for separate contributions to the menu using {@link contributeMenu}.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarMenu({
   *     icon: 'folder',
   *     tooltip: 'File',
   *     menu: {name: 'menu:file'}, // <--- Give menu a name
   *   }),
   * );
   * ```
   *
   * Use that name to contribute to the menu.
   *
   * ```ts
   * contributeMenu('menu:file', menu => menu
   *   .addMenuItem({icon: 'save', label: 'Save', accelerator: {ctrl: true, key: 'S'}, onSelect: () => console.log('Save')})
   *   .addMenuItem({icon: 'print', label: 'Print', accelerator: {ctrl: true, key: 'P'}, onSelect: () => console.log('Print')})
   *   .addMenu({icon: 'file_download', label: 'Export As...'}, menu => menu
   *     .addMenuItem({icon: 'picture_as_pdf', label: 'PDF Document', onSelect: () => console.log('PDF Document')})
   *     .addMenuItem({icon: 'table_view', label: 'Excel Spreadsheet', onSelect: () => console.log('Excel Spreadsheet')}),
   *   ),
   * );
   * ```
   *
   * ##### Allow for Relative Positioning
   *
   * Assigning the menu button a name allows other contributions to be positioned relative to it.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarMenu({
   *     name: 'menuitem:file', // <--- Give menu button a name
   *     icon: 'folder',
   *     tooltip: 'File',
   *   }),
   * );
   * ```
   *
   * Use that name to contribute before or after the menu button.
   *
   * ```ts
   * contributeMenu({location: 'toolbar:main', after: 'menuitem:file'}, toolbar => toolbar
   *   .addToolbarButton({icon: 'save', onSelect: () => console.log('Save')}),
   * );
   * ```
   *
   * @param descriptor - Configures the appearance and behavior of the menu button and its menu.
   * @param menuFactoryFn - Optional factory function to add menu items to the menu.
   * @returns A reference to this factory, enabling method chaining.
   */
  addToolbarMenu(descriptor: SciToolbarMenuDescriptor, menuFactoryFn?: (menu: SciMenuFactory) => void): this;

  /**
   * Adds a component to the toolbar, allowing for custom toolbar items like a filter field.
   *
   * The control can be any component. Data can be passed to the component via {@link SciToolbarControlDescriptor.bindings}.
   * Because the component is not a button, it does not support a selection handler, checked state, or disabled state.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarControl({
   *     component: FilterFieldComponent,
   *     bindings: [inputBinding('placeholder', signal('Filter items...'))],
   *   }),
   * );
   * ```
   *
   * ##### Allow for Relative Positioning
   *
   * Assigning a name allows other contributions to be positioned relative to this control.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarControl({
   *     name: 'menuitem:filter', // <--- Give toolbar control a name
   *     component: FilterFieldComponent,
   *   }),
   * );
   * ```
   *
   * Use that name to contribute before or after the toolbar control.
   *
   * ```ts
   * contributeMenu({location: 'toolbar:main', after: 'menuitem:filter'}, toolbar => toolbar
   *   .addToolbarButton({icon: 'save', onSelect: () => console.log('Save')}),
   * );
   * ```
   *
   * @param descriptor - Specifies the component and its inputs.
   * @returns A reference to this factory, enabling method chaining.
   */
  addToolbarControl(descriptor: SciToolbarControlDescriptor): this;

  /**
   * Adds a split control to the toolbar.
   *
   * A split control consists of two parts: the control and a menu button that opens a menu with related actions.
   *
   * The control can be any component. Data can be passed to the component via {@link SciToolbarControlDescriptor.bindings}.
   * Because the component is not a button, it does not support a selection handler, checked state, or disabled state.
   *
   * To add menu items to the menu, pass a menu factory function as the second argument. The menu calls this function with a {@link SciMenuFactory} that provides methods for populating it.
   *
   * ```ts
   * const matchCase = signal(false);
   * const useRegex = signal(false);
   *
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarSplitControl({
   *       component: FilterFieldComponent,
   *       bindings: [inputBinding('placeholder', signal('Filter items...'))],
   *     }, menu => menu
   *       .addMenuItem({label: 'Match Case', checked: matchCase, onSelect: () => matchCase.update(caseSensitive => !caseSensitive)})
   *       .addMenuItem({label: 'Regular Expressions', checked: useRegex, onSelect: () => useRegex.update(regex => !regex)}),
   *   ),
   * );
   * ```
   * ##### Allow for Separate Menu Contributions
   *
   * As an alternative to defining the menu items inline, assign the menu a name, allowing for separate contributions to the menu using {@link contributeMenu}.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarSplitControl({
   *       component: FilterFieldComponent,
   *       bindings: [inputBinding('placeholder', signal('Filter items...'))],
   *       menu: {name: 'menu:filter-options'}, // <--- Give menu a name
   *     },
   *   ),
   * );
   * ```
   *
   * Use that name to contribute to the menu.
   *
   * ```ts
   * contributeMenu('menu:filter-options', menu => menu
   *   .addMenuItem({label: 'Match Case', checked: matchCase, onSelect: () => matchCase.update(caseSensitive => !caseSensitive)})
   *   .addMenuItem({label: 'Regular Expressions', checked: useRegex, onSelect: () => useRegex.update(regex => !regex)}),
   * );
   * ```
   *
   * ##### Allow for Relative Positioning
   *
   * Assigning the split control a name allows other contributions to be positioned relative to it.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addToolbarSplitControl({
   *       name: 'menuitem:filter', // <--- Give control a name
   *       component: FilterFieldComponent,
   *     },
   *   ),
   * );
   * ```
   *
   * Use that name to contribute before or after the split control.
   *
   * ```ts
   * contributeMenu({location: 'toolbar:main', after: 'menuitem:filter'}, toolbar => toolbar
   *   .addToolbarButton({icon: 'save', onSelect: () => console.log('Save')}),
   * );
   * ```
   *
   * @param descriptor - Specifies the component and its inputs.
   * @param menuFactoryFn - Optional factory function to add menu items to the split control.
   * @returns A reference to this factory, enabling method chaining.
   */
  addToolbarSplitControl(descriptor: SciToolbarControlDescriptor & {menu?: SciMenuDescriptor['menu']}, menuFactoryFn?: (menu: SciMenuFactory) => void): this;

  /**
   * Adds a group to the toolbar to group related items visually.
   *
   * Pass a factory function to add items to the group. The group calls this function with a {@link SciToolbarFactory} that provides methods for populating it.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addGroup(group => group
   *     .addToolbarButton({icon: 'undo', onSelect: () => console.log('Undo')})
   *     .addToolbarButton({icon: 'redo', onSelect: () => console.log('Redo')}),
   *   ),
   * );
   * ```
   *
   * @param groupFactoryFn - Factory function to add items to the group.
   * @returns A reference to this factory, enabling method chaining.
   */
  addGroup(groupFactoryFn: (group: SciToolbarFactory) => void): this;

  /**
   * Adds a group to the toolbar to group related items visually.
   *
   * Pass a descriptor to configure the appearance and behavior of the group.
   * To add items to the group, pass a group factory function as the second argument. The group calls this function with a {@link SciToolbarFactory} that provides methods for populating it.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addGroup({cssClass: 'group'}, group => group
   *     .addToolbarButton({icon: 'undo', onSelect: () => console.log('Undo')})
   *     .addToolbarButton({icon: 'redo', onSelect: () => console.log('Redo')}),
   *   ),
   * );
   * ```
   *
   * ##### Allow for Separate Group Contributions
   *
   * Assigning the group a name allows for separate contributions to the group using {@link contributeMenu}.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addGroup({name: 'toolbar:edit'}), // <--- Give group a name
   * );
   * ```
   *
   * Use that name to contribute to the group.
   *
   * ```ts
   * contributeMenu('toolbar:edit', toolbar => toolbar
   *   .addToolbarButton({icon: 'undo', onSelect: () => console.log('Undo')})
   *   .addToolbarButton({icon: 'redo', onSelect: () => console.log('Redo')}),
   * );
   * ```
   *
   * ##### Allow for Relative Positioning
   *
   * Assigning the group a name allows other contributions to be positioned relative to it.
   *
   * ```ts
   * contributeMenu('toolbar:main', toolbar => toolbar
   *   .addGroup({
   *       name: 'toolbar:edit', // <--- Give group a name
   *     }, group => group
   *       .addToolbarButton({icon: 'undo', onSelect: () => console.log('Undo')})
   *       .addToolbarButton({icon: 'redo', onSelect: () => console.log('Redo')}),
   *   ),
   * );
   * ```
   *
   * Use that name to contribute before or after the group.
   *
   * ```ts
   * contributeMenu({location: 'toolbar:main', after: 'toolbar:edit'}, toolbar => toolbar
   *   .addToolbarButton({icon: 'save', onSelect: () => console.log('Save')}),
   * );
   * ```
   *
   * @param descriptor - Configures the appearance and behavior of the group.
   * @param groupFactoryFn - Optional factory function to add items to the group.
   * @returns A reference to this factory, enabling method chaining.
   */
  addGroup(descriptor: SciToolbarGroupDescriptor, groupFactoryFn?: (group: SciToolbarFactory) => void): this;
}

/**
 * Configures the appearance and behavior of a toolbar button.
 */
export interface SciToolbarButtonDescriptor {
  /**
   * Specifies the name of the button, used to position other toolbar items relative to it.
   */
  name?: `menuitem:${string}`;
  /**
   * Specifies the icon to be displayed for the button.
   *
   * SCION uses icon providers to render icons. An icon provider can be registered using {@link provideIconProvider}.
   *
   * Defaults to a Material icon provider if the application has not registered an icon provider, interpreting the icon as a Material Icon font ligature.
   * Refer to https://fonts.google.com/icons for available Material icons and instructions on including the Material icon font.
   *
   * For icons that can change, prefer setting the icon as a signal over tracking it manually to prevent the contribution function from re-running.
   *
   * A component can be used to render a custom icon. Data can be passed to the component via {@link SciComponentDescriptor.bindings}.
   */
  icon?: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor;
  /**
   * Specifies the label to be displayed for the button.
   *
   * Can be text or a translation key. A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
   *
   * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
   *
   * For texts that can change, prefer setting the text as a signal over tracking it manually to prevent the contribution function from re-running.
   *
   * A component can be used to render a custom label. Data can be passed to the component via {@link SciComponentDescriptor.bindings}.
   */
  label?: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor;
  /**
   * Specifies the tooltip to be displayed when hovering over the button.
   *
   * Can be text or a translation key. A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
   *
   * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
   *
   * For texts that can change, prefer setting the text as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  tooltip?: MaybeSignal<Translatable>;
  /**
   * Configures the button as a toggle button, with the specified checked state.
   *
   * Prefer setting the checked state as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  checked?: MaybeSignal<boolean>;
  /**
   * Specifies the accelerator to be installed for the button.
   *
   * Accelerators allow for quick access using a keyboard shortcut, mapping a physical key combination (key combined with modifiers such as `Ctrl`, `Shift`, or `Alt`) to an application action.
   */
  accelerator?: SciKeyboardAccelerator;
  /**
   * Indicates whether the button is disabled. Defaults to `false`.
   *
   * Prefer setting the disabled state as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  disabled?: MaybeSignal<boolean>;
  /**
   * Indicates whether the button is visible. Defaults to `true`.
   *
   * Prefer setting the visible state as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  visible?: MaybeSignal<boolean>;
  /**
   * Specifies CSS classes to associate with the button.
   */
  cssClass?: string | string[];
  /**
   * Specifies HTML attributes to associate with the button.
   *
   * Data attributes should start with the `data-` prefix.
   */
  attributes?: {[name: string]: string};
  /**
   * Specifies the handler invoked when the button is triggered by a click or keyboard shortcut.
   *
   * @returns A `boolean` or a Promise indicating whether to close the enclosing popover, if any. Non-checkable buttons close the popover by default.
   */
  onSelect: () => void | boolean | Promise<void | boolean>;
}

/**
 * Configures the appearance and behavior of a toolbar menu button and its menu.
 */
export interface SciToolbarMenuDescriptor {
  /**
   * Specifies the name of the menu button, used to position other toolbar items relative to it.
   */
  name?: `menuitem:${string}`;
  /**
   * Specifies the icon to be displayed for the menu button.
   *
   * SCION uses icon providers to render icons. An icon provider can be registered using {@link provideIconProvider}.
   *
   * Defaults to a Material icon provider if the application has not registered an icon provider, interpreting the icon as a Material Icon font ligature.
   * Refer to https://fonts.google.com/icons for available Material icons and instructions on including the Material icon font.
   *
   * For icons that can change, prefer setting the icon as a signal over tracking it manually to prevent the contribution function from re-running.
   *
   * A component can be used to render a custom icon. Data can be passed to the component via {@link SciComponentDescriptor.bindings}.
   */
  icon?: MaybeSignal<string> | ComponentType<unknown> | SciComponentDescriptor;
  /**
   * Specifies the label to be displayed for the menu button.
   *
   * Can be text or a translation key. A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
   *
   * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
   *
   * For texts that can change, prefer setting the text as a signal over tracking it manually to prevent the contribution function from re-running.
   *
   * A component can be used to render a custom label. Data can be passed to the component via {@link SciComponentDescriptor.bindings}.
   */
  label?: MaybeSignal<Translatable> | ComponentType<unknown> | SciComponentDescriptor;
  /**
   * Specifies the tooltip to be displayed when hovering over the menu button.
   *
   * Can be text or a translation key. A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
   *
   * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
   *
   * For texts that can change, prefer setting the text as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  tooltip?: MaybeSignal<Translatable>;
  /**
   * Indicates whether the menu button is disabled. Defaults to `false`.
   *
   * Prefer setting the disabled state as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  disabled?: MaybeSignal<boolean>;
  /**
   * Indicates whether the menu button is visible. Defaults to `true`.
   *
   * Prefer setting the visible state as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  visible?: MaybeSignal<boolean>;
  /**
   * Controls whether to display a visual indicator for the menu. Defaults to `true`.
   *
   * For icon menu buttons, a small triangle indicator is rendered in the bottom-right corner. For label menu buttons, a chevron is used.
   */
  visualMenuIndicator?: boolean;
  /**
   * Specifies CSS classes to associate with the menu button and menu.
   */
  cssClass?: string | string[];
  /**
   * Specifies HTML attributes to associate with the menu button and menu.
   *
   * Data attributes should start with the `data-` prefix.
   */
  attributes?: {[name: string]: string};
  /**
   * Configures the appearance and behavior of the menu opened when clicking the menu button.
   */
  menu?: SciMenuDescriptor['menu'];
}

/**
 * Configures the appearance and behavior of a toolbar control.
 */
export interface SciToolbarControlDescriptor {
  /**
   * Specifies the name of the control, used to position other toolbar items relative to it.
   */
  name?: `menuitem:${string}`;
  /**
   * Specifies the component used to render the control.
   */
  component: ComponentType<unknown>;
  /**
   * Specifies data to pass to the component.
   *
   * ```ts
   * bindings: [inputBinding('placeholder', signal('Filter items...'))];
   * ```
   *
   * Inputs are available as input properties in the component.
   *
   * ```ts
   * public placeholder = input.required<string>();
   * ```
   *
   * @see inputBinding
   * @see outputBinding
   * @see twoWayBinding
   */
  bindings?: Binding[];
  /**
   * Specifies the injector used to instantiate the component, giving control over which objects are available for injection. Defaults to the element injector.
   *
   * ```ts
   * Injector.create({
   *   parent: ...,
   *   providers: [
   *    {provide: <TOKEN>, useValue: <VALUE>}
   *   ],
   * })
   * ```
   */
  injector?: Injector;
  /**
   * Specifies providers available for injection in the component.
   */
  providers?: Provider[];
  /**
   * Specifies the tooltip to be displayed when hovering over the control.
   *
   * Can be text or a translation key. A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
   *
   * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
   *
   * For texts that can change, prefer setting the text as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  tooltip?: MaybeSignal<Translatable>;
  /**
   * Indicates whether the control is visible. Defaults to `true`.
   *
   * Prefer setting the visible state as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  visible?: MaybeSignal<boolean>;
  /**
   * Specifies CSS classes to associate with the control.
   */
  cssClass?: string | string[];
  /**
   * Specifies HTML attributes to associate with the control.
   *
   * Data attributes should start with the `data-` prefix.
   */
  attributes?: {[name: string]: string};
}

/**
 * Configures the appearance and behavior of a toolbar group.
 */
export interface SciToolbarGroupDescriptor {
  /**
   * Specifies the name of the group, used to position other toolbar items relative to it.
   */
  name?: `toolbar:${string}`;
  /**
   * Indicates whether the group is disabled. Defaults to `false`.
   *
   * Prefer setting the disabled state as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  disabled?: MaybeSignal<boolean>;
  /**
   * Indicates whether the group is visible. Defaults to `true`.
   *
   * Prefer setting the visible state as a signal over tracking it manually to prevent the contribution function from re-running.
   */
  visible?: MaybeSignal<boolean>;
  /**
   * Specifies CSS classes to associate with the group.
   */
  cssClass?: string | string[];
}
