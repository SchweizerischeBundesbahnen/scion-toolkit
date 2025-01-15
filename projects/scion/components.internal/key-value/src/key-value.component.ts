/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, computed, input, untracked} from '@angular/core';
import {KeyValue, KeyValuePipe} from '@angular/common';
import {Dictionaries, Dictionary} from '@scion/toolkit/util';

/**
 * Displays key-value pairs of an object.
 */
@Component({
  selector: 'sci-key-value',
  templateUrl: './key-value.component.html',
  styleUrls: ['./key-value.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    KeyValuePipe,
  ],
})
export class SciKeyValueComponent {

  public readonly object = input<Dictionary | Map<string, unknown> | null | undefined>();

  protected readonly flattenedProperties = computed(() => {
    const object = this.object() ?? {};
    return untracked(() => this.flattenObject(object));
  });

  /**
   * Compares qualifier entries by their position in the object.
   */
  protected keyCompareFn = (a: KeyValue<string, unknown>, b: KeyValue<string, unknown>): number => {
    const keys = Object.keys(this.flattenedProperties());
    return keys.indexOf(a.key) - keys.indexOf(b.key);
  };

  private flattenObject(property: Dictionary | Map<string, unknown>, path: string[] = []): Dictionary {
    if (property instanceof Map) {
      return this.flattenObject(Dictionaries.coerce(property), path);
    }

    return Object.entries(property).reduce((acc, [key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return {...acc, ...this.flattenObject(value as Dictionary | Map<string, unknown>, [...path, key])};
      }
      else {
        const propName = [...path, key].join('.');
        return {...acc, ...{[propName]: value}};
      }
    }, {});
  }
}
