/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Maps } from './maps.util';

describe('Maps', () => {

  describe('Maps.addSetValue', () => {

    it('should allow adding values', () => {
      const map = new Map<string, Set<string>>();
      expect(Maps.addSetValue(map, 'keydown', 'a')).toBe(map);
      expect(Maps.addSetValue(map, 'keydown', 'b')).toBe(map);
      expect(Maps.addSetValue(map, 'keydown', 'c')).toBe(map);
      expect(Maps.addSetValue(map, 'keyup', 'x')).toBe(map);
      expect(Maps.addSetValue(map, 'keyup', 'y')).toBe(map);
      expect(Maps.addSetValue(map, 'keypress', 'k')).toBe(map);
      expect(Maps.addSetValue(map, 'keypress', 'l')).toBe(map);

      expect(map).toEqual(new Map()
        .set('keydown', new Set(['a', 'b', 'c']))
        .set('keyup', new Set(['x', 'y']))
        .set('keypress', new Set(['k', 'l'])));
    });
  });

  describe('Maps.removeSetValue', () => {

    it('should allow removing values', () => {
      const map = new Map<string, Set<string>>();
      Maps.addSetValue(map, 'keydown', 'a');
      Maps.addSetValue(map, 'keydown', 'b');
      Maps.addSetValue(map, 'keydown', 'c');
      Maps.addSetValue(map, 'keyup', 'x');
      Maps.addSetValue(map, 'keyup', 'y');
      Maps.addSetValue(map, 'keypress', 'k');
      Maps.addSetValue(map, 'keypress', 'l');

      // Remove a value
      expect(Maps.removeSetValue(map, 'keyup', 'x')).toEqual(true);
      expect(map).toEqual(new Map()
        .set('keydown', new Set(['a', 'b', 'c']))
        .set('keyup', new Set(['y']))
        .set('keypress', new Set(['k', 'l'])));

      // Remove a value
      expect(Maps.removeSetValue(map, 'keyup', 'y')).toEqual(true);
      expect(map).toEqual(new Map()
        .set('keydown', new Set(['a', 'b', 'c']))
        .set('keypress', new Set(['k', 'l'])));

      // Remove a value not contained in the Map
      expect(Maps.removeSetValue(map, 'keyup', 'y')).toEqual(false);
      expect(Maps.removeSetValue(map, 'click', 'div')).toEqual(false);
    });

    it('should allow removing values by predicate', () => {
      const map = new Map<string, Set<string>>();
      Maps.addSetValue(map, 'keydown', 'a');
      Maps.addSetValue(map, 'keydown', 'b');
      Maps.addSetValue(map, 'keydown', 'c');
      Maps.addSetValue(map, 'keyup', 'a');
      Maps.addSetValue(map, 'keyup', 'y');
      Maps.addSetValue(map, 'keypress', 'k');
      Maps.addSetValue(map, 'keypress', 'y');

      // Remove a value
      expect(Maps.removeSetValue(map, 'keyup', (value: string): boolean => value === 'a')).toEqual(true);
      expect(map).toEqual(new Map()
        .set('keydown', new Set(['a', 'b', 'c']))
        .set('keyup', new Set(['y']))
        .set('keypress', new Set(['k', 'y'])));

      // Remove a value
      expect(Maps.removeSetValue(map, 'keyup', (value: string): boolean => value === 'y')).toEqual(true);
      expect(map).toEqual(new Map()
        .set('keydown', new Set(['a', 'b', 'c']))
        .set('keypress', new Set(['k', 'y'])));

      // Remove a value
      expect(Maps.removeSetValue(map, 'keypress', (value: string): boolean => value === 'y' || value === 'k')).toEqual(true);
      expect(map).toEqual(new Map().set('keydown', new Set(['a', 'b', 'c'])));

      // Remove a value not contained in the Map
      expect(Maps.removeSetValue(map, 'keyup', (): boolean => false)).toEqual(false);
    });
  });

  describe('Maps.addListValue', () => {

    it('should allow adding values', () => {
      const map = new Map<string, string[]>();
      expect(Maps.addListValue(map, 'keydown', 'a')).toBe(map);
      expect(Maps.addListValue(map, 'keydown', 'b')).toBe(map);
      expect(Maps.addListValue(map, 'keydown', 'c')).toBe(map);
      expect(Maps.addListValue(map, 'keyup', 'x')).toBe(map);
      expect(Maps.addListValue(map, 'keyup', 'y')).toBe(map);
      expect(Maps.addListValue(map, 'keypress', 'k')).toBe(map);
      expect(Maps.addListValue(map, 'keypress', 'l')).toBe(map);

      expect(map).toEqual(new Map()
        .set('keydown', ['a', 'b', 'c'])
        .set('keyup', ['x', 'y'])
        .set('keypress', ['k', 'l']));
    });
  });

  describe('Maps.removeListValue', () => {

    it('should allow removing values', () => {
      const map = new Map<string, string[]>();
      Maps.addListValue(map, 'keydown', 'a');
      Maps.addListValue(map, 'keydown', 'b');
      Maps.addListValue(map, 'keydown', 'c');
      Maps.addListValue(map, 'keyup', 'x');
      Maps.addListValue(map, 'keyup', 'y');
      Maps.addListValue(map, 'keypress', 'k');
      Maps.addListValue(map, 'keypress', 'l');

      // Remove a value
      expect(Maps.removeListValue(map, 'keyup', 'x')).toEqual(true);
      expect(map).toEqual(new Map()
        .set('keydown', ['a', 'b', 'c'])
        .set('keyup', ['y'])
        .set('keypress', ['k', 'l']));

      // Remove a value
      expect(Maps.removeListValue(map, 'keyup', 'y')).toEqual(true);
      expect(map).toEqual(new Map()
        .set('keydown', ['a', 'b', 'c'])
        .set('keypress', ['k', 'l']));

      // Remove a value not contained in the Map
      expect(Maps.removeListValue(map, 'keyup', 'y')).toEqual(false);
      expect(Maps.removeListValue(map, 'click', 'div')).toEqual(false);
    });

    it('should allow removing values by predicate', () => {
      const map = new Map<string, string[]>();
      Maps.addListValue(map, 'keydown', 'a');
      Maps.addListValue(map, 'keydown', 'b');
      Maps.addListValue(map, 'keydown', 'c');
      Maps.addListValue(map, 'keyup', 'a');
      Maps.addListValue(map, 'keyup', 'y');
      Maps.addListValue(map, 'keypress', 'k');
      Maps.addListValue(map, 'keypress', 'y');

      // Remove a value
      expect(Maps.removeListValue(map, 'keyup', (value: string): boolean => value === 'a')).toEqual(true);
      expect(map).toEqual(new Map()
        .set('keydown', ['a', 'b', 'c'])
        .set('keyup', ['y'])
        .set('keypress', ['k', 'y']));

      // Remove a value
      expect(Maps.removeListValue(map, 'keyup', (value: string): boolean => value === 'y')).toEqual(true);
      expect(map).toEqual(new Map()
        .set('keydown', ['a', 'b', 'c'])
        .set('keypress', ['k', 'y']));

      // Remove a value
      expect(Maps.removeListValue(map, 'keypress', (value: string): boolean => value === 'y' || value === 'k')).toEqual(true);
      expect(map).toEqual(new Map().set('keydown', ['a', 'b', 'c']));

      // Remove a value not contained in the Map
      expect(Maps.removeListValue(map, 'keyup', (): boolean => false)).toEqual(false);
    });
  });

  describe('Maps.coerce', () => {

    it('should create a new Map from a dictionary', () => {
      const dictionary = {firstname: 'John', lastname: 'Smith', age: 42, male: true};
      expect(Maps.coerce(dictionary)).toEqual(new Map().set('firstname', 'John').set('lastname', 'Smith').set('age', 42).set('male', true));
    });

    it('should return the map if given a map', () => {
      const map = new Map().set('firstname', 'John').set('lastname', 'Smith');
      expect(Maps.coerce(map)).toBe(map);
      expect(Maps.coerce(new Map(map))).toEqual(map);
    });

    it('should return tuples as map', () => {
      const tuples = [['key1', 'value1'], ['key2', 'value2']];
      expect(Maps.coerce(tuples)).toEqual(new Map().set('key1', 'value1').set('key2', 'value2'));
    });

    it('should return `null` for a `null` value', () => {
      expect(Maps.coerce(null, {coerceNullOrUndefined: false})).toBeNull();
    });

    it('should return `undefined` for an `undefined` value', () => {
      expect(Maps.coerce(undefined, {coerceNullOrUndefined: false})).toBeUndefined();
    });

    it('should return an empty map for a `null` value (by default)', () => {
      expect(Maps.coerce(null)).toEqual(new Map());
      expect(Maps.coerce(null, {coerceNullOrUndefined: true})).toEqual(new Map());
    });

    it('should return an empty map for an `undefined` value (by default)', () => {
      expect(Maps.coerce(undefined)).toEqual(new Map());
      expect(Maps.coerce(undefined, {coerceNullOrUndefined: true})).toEqual(new Map());
    });
  });
});
