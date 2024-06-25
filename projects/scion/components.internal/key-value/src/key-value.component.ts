/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
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
  standalone: true,
  imports: [
    KeyValuePipe,
  ],
})
export class SciKeyValueComponent {

  public flattenedProperties: Dictionary = {};
  private _keys: string[] = [];

  @Input()
  public set object(object: Dictionary | Map<string, any>) {
    this.flattenedProperties = this.flattenObject(object || {});
    this._keys = Object.keys(this.flattenedProperties);
  }

  /**
   * Compares qualifier entries by their position in the object.
   */
  public keyCompareFn = (a: KeyValue<string, any>, b: KeyValue<string, any>): number => {
    return this._keys.indexOf(a.key) - this._keys.indexOf(b.key);
  };

  private flattenObject(property: Dictionary | Map<string, any>, path: string[] = []): Dictionary {
    if (property instanceof Map) {
      return this.flattenObject(Dictionaries.coerce(property), path);
    }

    return Object.entries(property).reduce((acc, [key, value]) => {
      if (typeof value === 'object' && value !== null) {
        return {...acc, ...this.flattenObject(value, [...path, key])};
      }
      else {
        const propName = [...path, key].join('.');
        return {...acc, ...{[propName]: value}};
      }
    }, {});
  }
}
