/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, input} from '@angular/core';

/**
 * Renders an icon of an icon font based on its ligature.
 */
@Component({
  selector: 'sci-icon-font',
  template: '',
  host: {
    '[attr.data-ligature]': 'ligature()',
    '[style.font-family]': 'fontFamily()',
  },
  styles: `
    :host {
      font-style: normal;
      font-weight: normal;
      font-variant: normal;
      display: inline-block;
      text-transform: none;
      line-height: 1;
      white-space: nowrap;
      word-wrap: normal;
      direction: ltr;

      /* Enable Ligatures */
      letter-spacing: 0;
      font-feature-settings: 'liga';
      font-variant-ligatures: discretionary-ligatures;

      /* Better Font Rendering */
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;

      /* Prevent font metrics from misaligning the icon vertically with adjacent text. */
      text-box-trim: trim-start;
      text-box-edge: text alphabetic;

      /* Render ligature in ::before pseudo-element so it is excluded from the DOM tree (e.g., will not be returned by Element.textContent). */
      &::before {
        content: attr(data-ligature);
      }
    }
  `,
})
export class SciIconFontComponent {
  /**
   * Specifies the name of the icon font.
   */
  public readonly fontFamily = input.required<string>();

  /**
   * Specifies the ligature of the icon.
   */
  public readonly ligature = input.required<string>();
}
