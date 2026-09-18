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
 * - scion.add               : Add an item
 * - scion.add_large         : Add an item (large)
 * - scion.bin               : Bin symbol
 * - scion.checkmark         : Indicates a selected option
 * - scion.chevron_down      : Chevron down symbol
 * - scion.chevron_left      : Chevron left symbol
 * - scion.chevron_right     : Chevron right symbol
 * - scion.chevron_up        : Chevron up symbol
 * - scion.clear             : Clear items
 * - scion.close             : Close a popover
 * - scion.collapse_all      : Collapse all items
 * - scion.copy              : Copy an item
 * - scion.delete            : Delete an item
 * - scion.dirty             : Indicates unsaved data
 * - scion.drag_handle       : Drag or move an item
 * - scion.duplicate         : Duplicate an item
 * - scion.edit              : Edit an item
 * - scion.emdash            : Em dash symbol
 * - scion.envelope          : Envelope symbol
 * - scion.envelope_closed   : Indicates a closed envelope
 * - scion.envelope_opened   : Indicates an opened envelope
 * - scion.expand_all        : Expand an item
 * - scion.external_link     : Open link in a new tab
 * - scion.filter            : Set or change a filter
 * - scion.find              : Find an item
 * - scion.folder            : Directory symbol
 * - scion.help              : Indicates help, support, or documentation
 * - scion.hide              : Hide a panel
 * - scion.magnifier         : Magnifier symbol
 * - scion.minimize          : Minimize a panel
 * - scion.minus             : Minus sign
 * - scion.modified          : Indicates modified data
 * - scion.more_horizontal   : Show a popover to the left or right
 * - scion.more_vertical     : Show a popover above or below
 * - scion.new               : Create an item
 * - scion.new_large         : Create an item (large)
 * - scion.paste             : Paste from clipboard
 * - scion.pen               : Pen symbol
 * - scion.pin               : Pin an item
 * - scion.pinned            : Indicates a pinned item
 * - scion.placeholder_frame : Placeholder symbol
 * - scion.placeholder_image : Placeholder symbol for an image
 * - scion.plus              : Plus sign
 * - scion.plus_large        : Plus sign (large)
 * - scion.remove            : Remove an item (x)
 * - scion.remove_minus      : Remove an item (-)
 * - scion.reset             : Reset a form
 * - scion.search            : Search for an item
 * - scion.sort_ascending    : Sort items in ascending order (A-Z, 0-9)
 * - scion.sort_by           : Change sort order
 * - scion.sort_descending   : Sort items in descending order (Z-A, 9-0)
 * - scion.user              : User symbol
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
