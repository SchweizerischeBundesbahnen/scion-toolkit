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
 * Provides Material icons for non-scion icons.
 *
 * This provider requires a Material icon font to be included in the HTML.
 *
 * Supported fonts:
 * - https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded
 * - https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined
 * - https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp
 * - https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Round|Material+Icons+Sharp
 */
export const materialIconProvider: SciIconProviderFn = (ligature: string): SciComponentDescriptor | undefined => {
  if (ligature.startsWith('scion:')) {
    return undefined; // delegate to next provider
  }

  return {
    component: SciIconFontComponent,
    bindings: [
      inputBinding('fontFamily', () => `'Material Symbols Rounded', 'Material Symbols Outlined', 'Material Symbols Sharp', 'Material Icons', 'Material Icons Outlined', 'Material Icons Round', 'Material Icons Sharp'`),
      inputBinding('ligature', () => ligature),
    ],
  };
};
