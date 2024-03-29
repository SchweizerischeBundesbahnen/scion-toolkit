/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Objects} from './objects.util';

describe('Objects', () => {

  describe('Objects.isEqual', () => {

    it('should be equal for same object reference', () => {
      const obj = {};
      expect(Objects.isEqual(obj, obj)).toBeTrue();
    });

    it('should be equal for different property order', () => {
      const a = {firstname: 'john', lastname: 'smith'};
      const b = {lastname: 'smith', firstname: 'john'};
      expect(Objects.isEqual(a, b)).toBeTrue();
    });

    it('should be equal for two `null` objects', () => {
      expect(Objects.isEqual(null, null)).toBeTrue();
    });

    it('should be equal for two `undefined` objects', () => {
      expect(Objects.isEqual(undefined, undefined)).toBeTrue();
    });

    it('should not be equal for `undefined` and object', () => {
      expect(Objects.isEqual(undefined, {})).toBeFalse();
    });

    it('should not be equal for `null` and object', () => {
      expect(Objects.isEqual(null, {})).toBeFalse();
    });

    it('should not be equal for `null` and `undefined`', () => {
      expect(Objects.isEqual(null, undefined)).toBeFalse();
    });

    it('should be equal for two empty objects', () => {
      expect(Objects.isEqual({}, {})).toBeTrue();
    });

    it('should not be equal for different properties', () => {
      expect(Objects.isEqual({firstname: 'jack'}, {firstname: 'john'})).toBeFalse();
    });
  });
});
