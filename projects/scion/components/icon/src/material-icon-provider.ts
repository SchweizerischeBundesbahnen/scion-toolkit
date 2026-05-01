/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, input, inputBinding, signal} from '@angular/core';
import {SciIconProviderFn} from './icon.provider';
import {SciComponentDescriptor} from '@scion/components/common';

/**
 * Provides Material icons for non-scion icons.
 */
export const materialIconProvider: SciIconProviderFn = (ligature: string): SciComponentDescriptor | undefined => {
  if (ligature.startsWith('scion.')) {
    return undefined; // delegate to next provider
  }

  return {component: MaterialIconComponent, bindings: [inputBinding('ligature', signal(ligature))]};
};

/**
 * Renders a Material icon based on its ligature.
 *
 * This component requires a Material icon font to be included in the HTML.
 *
 * Supported fonts:
 * - https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded
 * - https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined
 * - https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp
 * - https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Round|Material+Icons+Sharp
 */
@Component({
  selector: 'sci-material-icon',
  template: '{{ligature()}}',
  styles: `
    :host {
      font-family: 'Material Symbols Rounded', 'Material Symbols Outlined', 'Material Symbols Sharp', 'Material Icons', 'Material Icons Outlined', 'Material Icons Round', 'Material Icons Sharp';
      font-weight: normal;
      font-style: normal;
      line-height: 1;
      letter-spacing: normal;
      text-transform: none;
      display: inline-block;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;
      font-feature-settings: 'liga';
      -webkit-font-smoothing: antialiased;
    }
  `,
})
export class MaterialIconComponent {
  /**
   * Specifies the ligature of the Material icon.
   */
  public readonly ligature = input.required<string>();
}
