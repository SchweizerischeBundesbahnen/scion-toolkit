/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Arrays} from './arrays.util';

describe('Arrays', () => {

  describe('Arrays.isEqual', () => {

    it('should be equal for same array references', () => {
      const array = ['a', 'b', 'c'];
      expect(Arrays.isEqual(array, array)).toBeTrue();
    });

    it('should be equal for same elements (same order)', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = ['a', 'b', 'c'];
      expect(Arrays.isEqual(array1, array2)).toBeTrue();
    });

    it('should be equal for same elements (unordered)', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = ['a', 'c', 'b'];
      expect(Arrays.isEqual(array1, array2, {exactOrder: false})).toBeTrue();
    });

    it('should not be equal for different elements (1)', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = ['a', 'b', 'c', 'e'];
      expect(Arrays.isEqual(array1, array2)).toBeFalse();
    });

    it('should not be equal for different elements (2)', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = ['a', 'B', 'c'];
      expect(Arrays.isEqual(array1, array2)).toBeFalse();
    });

    it('should not be equal if ordered differently', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = ['a', 'c', 'b'];
      expect(Arrays.isEqual(array1, array2)).toBeFalse();
    });

    it('should be equal if ordered differently', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = ['a', 'c', 'b'];
      expect(Arrays.isEqual(array1, array2, {exactOrder: false})).toBeTrue();
    });

    it('should compare \'null\' and \'undefined\' arrays', () => {
      expect(Arrays.isEqual(null, ['a', 'b', 'c'])).toBeFalse();
      expect(Arrays.isEqual(undefined, ['a', 'b', 'c'])).toBeFalse();
      expect(Arrays.isEqual(['a', 'b', 'c'], null)).toBeFalse();
      expect(Arrays.isEqual(['a', 'b', 'c'], undefined)).toBeFalse();
      expect(Arrays.isEqual(null, null)).toBeTrue();
      expect(Arrays.isEqual(undefined, undefined)).toBeTrue();
      expect(Arrays.isEqual(null, undefined)).toBeFalse();
      expect(Arrays.isEqual(undefined, null)).toBeFalse();
    });
  });

  describe('Arrays.remove (by item)', () => {

    it('should remove the specified element', () => {
      const array = ['a', 'b', 'c', 'd', 'e'];
      expect(Arrays.remove(array, 'c', {firstOnly: true})).toEqual(['c']);
      expect(array).toEqual(['a', 'b', 'd', 'e']);
    });

    it('should remove the first occurrence of the specified element', () => {
      const array = ['a', 'b', 'c', 'd', 'e', 'c', 'g'];
      expect(Arrays.remove(array, 'c', {firstOnly: true})).toEqual(['c']);
      expect(array).toEqual(['a', 'b', 'd', 'e', 'c', 'g']);
    });

    it('should remove all occurrences of the specified element (default if not specifying options)', () => {
      const array = ['a', 'b', 'c', 'd', 'e', 'c', 'g'];
      expect(Arrays.remove(array, 'c')).toEqual(['c', 'c']);
      expect(array).toEqual(['a', 'b', 'd', 'e', 'g']);
    });

    it('should remove all occurrences of the specified element', () => {
      const array = ['a', 'b', 'c', 'd', 'e', 'c', 'g'];
      expect(Arrays.remove(array, 'c', {firstOnly: false})).toEqual(['c', 'c']);
      expect(array).toEqual(['a', 'b', 'd', 'e', 'g']);
    });

    it('should return an empty array if the element is not contained', () => {
      const array = ['a', 'b', 'c'];
      expect(Arrays.remove(array, 'C', {firstOnly: false})).toEqual([]);
      expect(array).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Arrays.remove (by predicate)', () => {
    const a1 = {key: 'a', value: '1'};
    const b2 = {key: 'b', value: '2'};
    const c3 = {key: 'c', value: '3'};
    const d4 = {key: 'd', value: '4'};
    const e5 = {key: 'e', value: '5'};
    const c6 = {key: 'c', value: '6'};
    const g7 = {key: 'g', value: '7'};

    it('should remove the specified element', () => {
      const array = [a1, b2, c3, d4, e5];
      expect(Arrays.remove(array, item => item.key === 'c', {firstOnly: true})).toEqual([c3]);
      expect(array).toEqual([a1, b2, d4, e5]);
    });

    it('should remove the first occurrence of the specified element', () => {
      const array = [a1, b2, c3, d4, e5, c6, g7];
      expect(Arrays.remove(array, item => item.key === 'c', {firstOnly: true})).toEqual([c3]);
      expect(array).toEqual([a1, b2, d4, e5, c6, g7]);
    });

    it('should remove all occurrences of the specified element (default if not specifying options)', () => {
      const array = [a1, b2, c3, d4, e5, c6, g7];
      expect(Arrays.remove(array, item => item.key === 'c')).toEqual([c3, c6]);
      expect(array).toEqual([a1, b2, d4, e5, g7]);
    });

    it('should remove all occurrences of the specified element', () => {
      const array = [a1, b2, c3, d4, e5, c6, g7];
      expect(Arrays.remove(array, item => item.key === 'c', {firstOnly: false})).toEqual([c3, c6]);
      expect(array).toEqual([a1, b2, d4, e5, g7]);
    });

    it('should return an empty array if the element is not contained', () => {
      const array = [a1, b2, c3];
      expect(Arrays.remove(array, item => item.key === 'C', {firstOnly: false})).toEqual([]);
      expect(array).toEqual([a1, b2, c3]);
    });
  });

  describe('Arrays.distinct', () => {

    it('should remove duplicate string items', () => {
      const array = ['a', 'a', 'b', 'c', 'd', 'e', 'c'];
      expect(Arrays.distinct(array)).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('should remove duplicate objects by reference', () => {
      const apple = {id: 1, name: 'apple'};
      const banana = {id: 2, name: 'banana'};
      const cherry = {id: 3, name: 'cherry'};

      const array = [apple, banana, cherry, banana, apple];
      expect(Arrays.distinct(array)).toEqual([apple, banana, cherry]);
    });

    it('should remove duplicate objects by a given identity function', () => {
      const apple = {id: 1, name: 'apple'};
      const banana = {id: 2, name: 'banana'};
      const cherry = {id: 3, name: 'cherry'};
      const appleOtherInstance = {...apple};
      const bananaOtherInstance = {...banana};

      const array = [apple, banana, cherry, bananaOtherInstance, appleOtherInstance];
      expect(Arrays.distinct(array, (fruit) => fruit.id)).toEqual([apple, banana, cherry]);
    });

    it('should not modify the original array', () => {
      const array = ['a', 'a', 'b', 'c', 'd', 'e', 'c'];
      expect(Arrays.distinct(array)).toEqual(['a', 'b', 'c', 'd', 'e']);
      expect(array).toEqual(['a', 'a', 'b', 'c', 'd', 'e', 'c']);
    });
  });

  describe('Arrays.intersect', () => {

    it('should return an empty array if no array is given', () => {
      expect(Arrays.intersect()).toEqual([]);
    });

    it('should return a new empty array if an empty array is given', () => {
      const array = new Array<string>();
      expect(Arrays.intersect(array)).not.toBe(array);
      expect(Arrays.intersect(array)).toEqual(array);
    });

    it('should return a copy of the array when a single array is given', () => {
      const array = ['a', 'b', 'c'];
      expect(Arrays.intersect(array)).not.toBe(array);
      expect(Arrays.intersect(array)).toEqual(array);
    });

    it('should intersect empty arrays', () => {
      const array1 = new Array<string>();
      const array2 = new Array<string>();
      expect(Arrays.intersect(array1, array2)).not.toBe(array1);
      expect(Arrays.intersect(array1, array2)).not.toBe(array2);
      expect(Arrays.intersect(array1, array2)).toEqual([]);
    });

    it('should intersect same-element arrays (same order)', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = ['a', 'b', 'c'];
      expect(Arrays.intersect(array1, array2)).toEqual(['a', 'b', 'c']);
    });

    it('should intersect same-element arrays (unordered)', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = ['c', 'b', 'a'];
      expect(Arrays.intersect(array1, array2)).toEqual(jasmine.arrayContaining(['a', 'b', 'c']));
    });

    it('should return an empty array if intersecting with an empty array', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = new Array<string>();
      expect(Arrays.intersect(array1, array2)).toEqual([]);
      expect(Arrays.intersect(array2, array1)).toEqual([]);
    });

    it('should intersect multiple arrays', () => {
      const array1 = ['a', 'e', 'b', 'c', 'd'];
      const array2 = ['a', 'b', 'd', 'c'];
      const array3 = ['c', 'a', 'b'];
      expect(Arrays.intersect(array1, array2, array3)).toEqual(jasmine.arrayContaining(['a', 'b', 'c']));
      expect(Arrays.intersect(array3, array1, array2)).toEqual(jasmine.arrayContaining(['a', 'b', 'c']));
      expect(Arrays.intersect(array2, array3, array1)).toEqual(jasmine.arrayContaining(['a', 'b', 'c']));
    });

    it('should ignore `undefined` arrays', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = undefined;
      const array3 = ['c', 'd', 'e'];
      expect(Arrays.intersect(array1, array2, array3)).toEqual(jasmine.arrayContaining(['c']));
      expect(Arrays.intersect(array3, array1, array2)).toEqual(jasmine.arrayContaining(['c']));
      expect(Arrays.intersect(array2, array3, array1)).toEqual(jasmine.arrayContaining(['c']));
    });

    it('should ignore `null` arrays', () => {
      const array1 = ['a', 'b', 'c'];
      const array2 = null;
      const array3 = ['c', 'd', 'e'];
      expect(Arrays.intersect(array1, array2, array3)).toEqual(jasmine.arrayContaining(['c']));
      expect(Arrays.intersect(array3, array1, array2)).toEqual(jasmine.arrayContaining(['c']));
      expect(Arrays.intersect(array2, array3, array1)).toEqual(jasmine.arrayContaining(['c']));
    });
  });

  describe('Arrays.coerce', () => {

    it('should return `null` for a `null` value', () => {
      expect(Arrays.coerce(null, {coerceNullOrUndefined: false})).toBeNull();
    });

    it('should return `undefined` for an `undefined` value', () => {
      expect(Arrays.coerce(undefined, {coerceNullOrUndefined: false})).toBeUndefined();
    });

    it('should return an empty map for a `null` value (by default)', () => {
      expect(Arrays.coerce(null)).toEqual([]);
      expect(Arrays.coerce(null, {coerceNullOrUndefined: true})).toEqual([]);
    });

    it('should return an empty map for an `undefined` value (by default)', () => {
      expect(Arrays.coerce(undefined)).toEqual([]);
      expect(Arrays.coerce(undefined, {coerceNullOrUndefined: true})).toEqual([]);
    });

    it('should pack a \'non-array\' value as array', () => {
      expect(Arrays.coerce('value')).toEqual(['value']);
    });

    it('should return a given array', () => {
      const array = ['a', 'b', 'c'];
      expect(Arrays.coerce(array)).toEqual(array);
      expect(array).toBe(array);
    });
  });

  describe('Arrays.last', () => {

    it('should return `undefined` for a `undefined` array', () => {
      expect(Arrays.last(undefined)).toBeUndefined();
    });

    it('should return `undefined` for a `null` array', () => {
      expect(Arrays.last(null)).toBeUndefined();
    });

    it('should return `undefined` for an empty array', () => {
      expect(Arrays.last([])).toBeUndefined();
    });

    it('should return the last element', () => {
      expect(Arrays.last(['a', 'b', 'c'])).toEqual('c');
    });

    it('should return the last element matching the predicate', () => {
      expect(Arrays.last(['a', 'b', 'c'], item => item === 'a' || item === 'b')).toEqual('b');
    });

    it('should return `undefined` if no element matches the predicate', () => {
      expect(Arrays.last(['a', 'b', 'c'], item => item === 'g')).toBeUndefined();
    });
  });
});
