/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {inputBinding} from '@angular/core';
import {SciIconProviderFn} from './icon.provider';
import {SciComponentDescriptor} from '@scion/components/common';
import {SciIconFontComponent} from './icon-font.component';

/**
 * Provides icons used in SCION libraries.
 *
 * Register this provider as the last icon provider, enabling replacement of built-in SCION icons.
 *
 * This provider requires the SCION icon font 'scion-icons' to be included in the HTML:
 *
 * scss
 * ```
 * @import url('https://cdn.jsdelivr.net/npm/@scion/icons/scion-icon-font.css');
 * ```
 */
export const scionIconProvider: SciIconProviderFn = (icon: string): SciComponentDescriptor | undefined => {
  const ligature = icon.startsWith('scion:') ? icon.substring('scion:'.length) : undefined;
  if (ligature) {
    return {
      component: SciIconFontComponent,
      bindings: [
        inputBinding('fontFamily', () => 'scion-icons'),
        inputBinding('ligature', () => ligature),
      ],
      attributes: {
        part: 'scion-icon', // Public API to change the font characteristics of SCION icons.
      },
    };
  }
  return undefined;
};
