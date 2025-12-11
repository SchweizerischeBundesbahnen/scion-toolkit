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

  public readonly object = input<Record<string, unknown> | Map<string, unknown> | Set<unknown> | Array<unknown> | null | undefined>();

  protected readonly flattenedProperties = computed(() => {
    const object = this.object() ?? {};
    return untracked(() => this.flatten(object));
  });

  /**
   * Compares qualifier entries by their position in the object.
   */
  protected readonly keyCompareFn = (a: KeyValue<string, unknown>, b: KeyValue<string, unknown>): number => {
    const keys = Object.keys(this.flattenedProperties());
    return keys.indexOf(a.key) - keys.indexOf(b.key);
  };

  private flatten(object: Record<string, unknown> | Map<string, unknown> | Set<unknown> | Array<unknown>, path: string[] = []): Record<string, unknown> {
    if (object instanceof Map) {
      return this.flatten(Object.fromEntries(object), path);
    }
    if (object instanceof Set) {
      return this.flatten([...object], path);
    }
    return Object.entries(object).reduce((acc, [key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return {...acc, ...this.flatten(value as Record<string, unknown> | Map<string, unknown> | Set<unknown> | Array<unknown>, [...path, key])};
      }
      else {
        const propName = [...path, key].join('.');
        return {...acc, ...{[propName]: value}};
      }
    }, {});
  }
}
