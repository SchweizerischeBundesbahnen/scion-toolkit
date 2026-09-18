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
  const ligature = icon.startsWith('scion.') ? icon.substring('scion.'.length) : undefined;
  if (ligature) {
    return {component: SciInternalIconComponent, bindings: [inputBinding('ligature', () => ligature)]};
  }
  return undefined;
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
