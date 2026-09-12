/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, input, inputBinding} from '@angular/core';
import {SciIconProviderFn} from './icon.provider';
import {SciComponentDescriptor} from '@scion/components/common';

/**
 * Provides icons used in SCION libraries.
 *
 * Register this provider as the last icon provider, enabling replacement of built-in SCION icons.
 */
export const scionIconProvider: SciIconProviderFn = (icon: string): SciComponentDescriptor | undefined => {
  const ligature = scionIcons[icon];
  if (ligature) {
    return {component: SciInternalIconComponent, bindings: [inputBinding('ligature', () => ligature)]};
  }
  return undefined;
};

/**
 * Maps icons to ligatures of the SCION icon font.
 */
const scionIcons: {[icon: string]: string} = {
  'scion.add': 'add',
  'scion.add_large': 'add_large',
  'scion.bin': 'bin',
  'scion.checkmark': 'checkmark',
  'scion.checkmark_small': 'checkmark_small',
  'scion.chevron_down': 'chevron_down',
  'scion.chevron_left': 'chevron_left',
  'scion.chevron_right': 'chevron_right',
  'scion.chevron_up': 'chevron_up',
  'scion.clear': 'clear',
  'scion.clear_large': 'clear_large',
  'scion.close': 'close',
  'scion.close_lage': 'close_large',
  'scion.collapse_all': 'collapse_all',
  'scion.copy': 'copy',
  'scion.delete': 'delete',
  'scion.dirty': 'dirty',
  'scion.drag_indicator': 'drag_indicator',
  'scion.duplicate': 'duplicate',
  'scion.edit': 'edit',
  'scion.envelope': 'envelope',
  'scion.envelope_open': 'envelope_open',
  'scion.expand_all': 'expand_all',
  'scion.external_link': 'external_link',
  'scion.filter': 'filter',
  'scion.folder': 'folder',
  'scion.help': 'help',
  'scion.magnifier': 'magnifier',
  'scion.minimize': 'minimize',
  'scion.more_horizontal': 'more_horizontal',
  'scion.more_vertical': 'more_vertical',
  'scion.paste': 'paste',
  'scion.pen': 'pen',
  'scion.pin': 'pin',
  'scion.placeholder_frame': 'placeholder_frame',
  'scion.placeholder_image': 'placeholder_image',
  'scion.remove': 'remove',
  'scion.reset': 'reset',
  'scion.search': 'search',
  'scion.sort_asc': 'sort_asc',
  'scion.sort_by': 'sort_by',
  'scion.sort_desc': 'sort_desc',
  'scion.sort_indicator': 'sort_indicator',
  'scion.user': 'user',
  'scion.user_pen': 'user_pen',
};

/**
 * Renders the icon for a ligature of the SCION icon font.
 *
 * This component requires the SCION icon font 'scion-icons' to be included in the HTML.
 */
@Component({
  selector: 'sci-internal-icon',
  template: '{{ligature()}}',
  styles: `
    :host {
      font-family: 'scion-icons';
      font-style: normal;
      font-weight: normal;
      font-variant: normal;
      text-transform: none;
      line-height: 1;

      /* Enable Ligatures */
      letter-spacing: 0;
      font-feature-settings: "liga";
      font-variant-ligatures: discretionary-ligatures;

      /* Better Font Rendering */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `,
})
export class SciInternalIconComponent {

  /**
   * Specifies the ligature of the icon.
   */
  public readonly ligature = input.required<string>();
}
