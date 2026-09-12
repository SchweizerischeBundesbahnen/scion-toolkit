/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {EnvironmentProviders, makeEnvironmentProviders} from '@angular/core';
import {SCI_ICON_PROVIDER} from './icon-providers';
import {ComponentType} from '@angular/cdk/portal';
import {SciComponentDescriptor} from '@scion/components/common';

/**
 * Enables contribution or replacement of icons used in SCION.
 *
 * An icon provider is a function that returns a component for an icon. The component renders the icon.
 *
 * Multiple icon providers can be registered. Providers are called in registration order. If a provider does not provide the icon,
 * the next provider is called, and so on.
 *
 * Defaults to a Material icon provider, interpreting the icon as a Material icon ligature.
 *
 * Refer to https://fonts.google.com/icons for available Material icons and https://developers.google.com/fonts/docs/material_symbols#use_in_web
 * for instructions on including the Material icon font.
 *
 * @example - Importing the Material icon font in `styles.scss`
 * ```scss
 * @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL@20..24,400,0&display=block');
 * ```
 *
 * SCION uses the following built-in icons:
 * - `scion.add`: Add or create a new item
 * - `scion.add_large`: Add or create a new item (larger)
 * - `scion.bin`: Trash
 * - `scion.checkmark`: Indicate a selected or completed item
 * - `scion.checkmark_small`: Indicate a selected or completed item (small)
 * - `scion.chevron_down`: Expand a section, tree node, or open a menu
 * - `scion.chevron_left`: Collapse or expand a side panel
 * - `scion.chevron_right`: Collapse or expand a side panel, or open a submenu
 * - `scion.chevron_up`: Collapse a section or tree node
 * - `scion.clear`: Clear text from an input field
 * - `scion.clear_large`: Clear text from an input field (large)
 * - `scion.close`: Close a view, dialog, or notification
 * - `scion.close_large`: Close a view, dialog, or notification (large)
 * - `scion.collapse_all`: Collapse all tree nodes
 * - `scion.copy`: Copy content to clipboard
 * - `scion.delete`: Permanently delete an item
 * - `scion.dirty`: Indicate unsaved changes
 * - `scion.drag_indicator`: Drag to reorder or move an item
 * - `scion.duplicate`: Create a copy of an item
 * - `scion.edit`: Switch to edit mode
 * - `scion.envelope`: Message
 * - `scion.envelope_open`: Read message
 * - `scion.expand_all`: Expand all tree nodes
 * - `scion.external_link`: Open link in a new tab or window
 * - `scion.filter`: Change filter criteria
 * - `scion.folder`: Directory
 * - `scion.help`: Help, support, or documentation
 * - `scion.magnifier`: Magnifier
 * - `scion.minimize`: Minimize a panel
 * - `scion.more_horizontal`: Show options menu horizontally
 * - `scion.more_vertical`: Show options menu vertically
 * - `scion.paste`: Paste content from clipboard
 * - `scion.pen`: Pen
 * - `scion.pin`: Pin or unpin an element
 * - `scion.placeholder_frame`: Image placeholder
 * - `scion.placeholder_image`: Generic placeholder
 * - `scion.remove`: Remove item from a list or selection
 * - `scion.reset`: Reset to default values
 * - `scion.search`: Search for content
 * - `scion.sort_asc`: Sort items in ascending order (A-Z, 0-9)
 * - `scion.sort_by`: Change sort order or filter criteria
 * - `scion.sort_desc`: Sort items in descending order (Z-A, 9-0)
 * - `scion.sort_indicator`: Sort direction status
 * - `scion.user`: User profile or account settings
 * - `scion.user_pen`: Edit user profile details
 *
 * To not replace built-in icons, the icon provider can return `undefined` for icons starting with the `scion.` prefix.
 *
 * The function can call `inject` to get any required dependencies.
 *
 * @see SciIconProviderFn
 * @see SciIconComponent
 */
export function provideIconProvider(iconProviderFn: SciIconProviderFn | undefined): EnvironmentProviders {
  return makeEnvironmentProviders(iconProviderFn ? [
    {
      provide: SCI_ICON_PROVIDER,
      useValue: iconProviderFn,
      multi: true,
    },
  ] : []);
}

/**
 * Signature of a function to provide icons.
 *
 * An icon provider is a function that returns the component for an icon. The component renders the icon.
 *
 * Alternatively, the icon provider can return a descriptor, allowing for additional configuration such as inputs.
 * Inputs are available as input properties in the component. The component can use the inputs to render the icon.
 *
 * Icon keys used by SCION start with the `scion.` prefix. To not replace built-in icons, the icon provider can
 * return `undefined` for icons starting with the `scion.` prefix.
 *
 * An icon provider can be registered via {@link provideIconProvider} function.
 *
 * The function can call `inject` to get any required dependencies.
 *
 * @param icon - The key of the icon for which to provide the icon component.
 * @returns ComponentType or {@link SciComponentDescriptor} to render the icon, or `undefined` if not provided by the icon provider.
 */
export type SciIconProviderFn = (icon: string) => ComponentType<unknown> | SciComponentDescriptor | undefined;
