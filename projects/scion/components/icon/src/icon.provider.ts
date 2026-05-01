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
 * The default icon provider requires the application to include the Material icon font, for example in `styles.scss`, as follows:
 * ```scss
 * @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL@20..24,400,0&display=block');
 * ```
 *
 * SCION uses the following icons:
 * - `scion.add`: Add or create new item
 * - `scion.checkmark`: Checked state indicator of an option
 * - `scion.chevron_down`: Expand a section or tree node, or open a menu
 * - `scion.chevron_left`: Collapse or expand a side panel
 * - `scion.chevron_right`: Collapse or expand a side panel, or open a submenu
 * - `scion.chevron_up`: Collapse a section or tree node
 * - `scion.clear`: Clear content in input fields
 * - `scion.close`: Close a view, dialog, or notification
 * - `scion.collapse_all`: Collapse all tree nodes
 * - `scion.delete`: Delete selected item or data
 * - `scion.dirty`: Indicate unsaved changes
 * - `scion.edit`: Enter edit mode
 * - `scion.expand_all`: Expand all tree nodes
 * - `scion.filter`: Open or apply a filter
 * - `scion.minimize`: Minimize a panel
 * - `scion.more_horizontal`: Show options menu horizontally
 * - `scion.more_vertical`: Show options menu vertically
 * - `scion.pin`: Pin or unpin an element
 * - `scion.remove`: Remove item from a list or selection
 * - `scion.search`: Trigger or indicate search function
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
