/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {KeyValue, KeyValuePipe} from '@angular/common';

/**
 * Displays the type and qualifier of a capability as chips.
 *
 * ## Styling
 *
 * To customize the default look of SCION components or support different themes, configure the `@scion/components` SCSS module in `styles.scss`.
 * To style a specific `sci-qualifier-chip-list` component, the following CSS variables can be set directly on the component.
 *
 * - --sci-qualifier-chip-list-type-background-color: Sets the background color of the type chip
 * - --sci-qualifier-chip-list-qualifier-background-color: Sets the background color of the qualifier chip
 *
 * ```css
 * sci-qualifier-chip-list {
 *   --sci-qualifier-chip-list-type-background-color: gray;
 * }
 * ```
 */
@Component({
  selector: 'sci-qualifier-chip-list',
  templateUrl: './qualifier-chip-list.component.html',
  styleUrls: ['./qualifier-chip-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KeyValuePipe,
  ],
})
export class SciQualifierChipListComponent {

  public readonly type = input<string | undefined>();
  public readonly qualifier = input<Qualifier | undefined | null>();

  /**
   * Compares qualifier entries by their position in the object.
   */
  protected qualifierKeyCompareFn = (a: KeyValue<string, any>, b: KeyValue<string, any>): number => {
    const keys = Object.keys(this.qualifier() ?? {});
    return keys.indexOf(a.key) - keys.indexOf(b.key);
  };
}

export interface Qualifier {
  [key: string]: string | number | boolean;
}
