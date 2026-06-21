/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, input, inputBinding, signal, ViewEncapsulation} from '@angular/core';
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
    return {
      component: ScionIconComponent,
      bindings: [inputBinding('ligature', signal(ligature))],
      attributes: {
        part: 'scion-icon', // Public API to change the font characteristics of SCION icons.
      },
    };
  }
  return undefined;
};

/**
 * Maps icons to ligatures of the SCION icon font.
 */
const scionIcons: {[icon: string]: string} = {
  'scion.add': 'add',
  'scion.checkmark': 'checkmark',
  'scion.chevron_down': 'chevron_down',
  'scion.chevron_left': 'chevron_left',
  'scion.chevron_right': 'chevron_right',
  'scion.chevron_up': 'chevron_up',
  'scion.clear': 'clear',
  'scion.close': 'close',
  'scion.collapse_all': 'collapse_all',
  'scion.delete': 'delete',
  'scion.dirty': 'dirty',
  'scion.edit': 'edit',
  'scion.expand_all': 'expand_all',
  'scion.filter': 'filter',
  'scion.minimize': 'minimize',
  'scion.more_horizontal': 'more_horizontal',
  'scion.more_vertical': 'more_vertical',
  'scion.pin': 'pin',
  'scion.remove': 'remove',
  'scion.search': 'search',
};

/**
 * Renders the icon for a ligature of the SCION icon font.
 *
 * This component requires the SCION icon font 'scion-icons' to be included in the HTML.
 */
@Component({
  selector: 'sci-scion-icon',
  template: '{{ligature()}}',
  encapsulation: ViewEncapsulation.ExperimentalIsolatedShadowDom, // TODO [Angular 23] Remove if PR #63131 is merged
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
      -webkit-font-variant-ligatures: discretionary-ligatures;
      font-variant-ligatures: discretionary-ligatures;

      /* Better Font Rendering */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `,
})
export class ScionIconComponent {

  /**
   * Specifies the ligature of the icon.
   */
  public readonly ligature = input.required<string>();
}
