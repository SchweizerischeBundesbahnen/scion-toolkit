/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Dictionaries} from './dictionaries.util';

describe('Dictionaries', () => {

  describe('Dictionaries.coerce', () => {

    it('should return a Map as dictionary', () => {
      const map = new Map()
        .set('firstname', 'John')
        .set('lastname', 'Smith')
        .set('age', 42)
        .set('male', true);
      expect(Dictionaries.coerce(map)).toEqual({firstname: 'John', lastname: 'Smith', age: 42, male: true});
    });

    it('should return the dictionary if given a dictionary', () => {
      const dictionary = {firstname: 'John', lastname: 'Smith'};
      expect(Dictionaries.coerce(dictionary)).toBe(dictionary);
    });

    it('should return tuples as dictionary', () => {
      const tuples: Array<[string, string]> = [['key1', 'value1'], ['key2', 'value2']];
      expect(Dictionaries.coerce(tuples)).toEqual({key1: 'value1', key2: 'value2'});
    });

    it('should return `null` for a `null` value', () => {
      expect(Dictionaries.coerce(null, {coerceNullOrUndefined: false})).toBeNull();
    });

    it('should return `undefined` for an `undefined` value', () => {
      expect(Dictionaries.coerce(undefined, {coerceNullOrUndefined: false})).toBeUndefined();
    });

    it('should return an empty dictionary for a `null` value (by default)', () => {
      expect(Dictionaries.coerce(null)).toEqual({});
      expect(Dictionaries.coerce(null, {coerceNullOrUndefined: true})).toEqual({});
    });

    it('should return an empty dictionary for an `undefined` value (by default)', () => {
      expect(Dictionaries.coerce(undefined)).toEqual({});
      expect(Dictionaries.coerce(undefined, {coerceNullOrUndefined: true})).toEqual({});
    });
  });

  describe('Dictionaries.withoutUndefinedEntries', () => {

    it('should remove undefined entries (resulting dictionary is empty)', () => {
      const dictionary = {firstname: undefined, lastname: undefined};
      expect(Dictionaries.withoutUndefinedEntries(dictionary)).toEqual({});
    });

    it('should remove undefined entries (resulting dictionary contains entries)', () => {
      // Use explicit typing to test the correct signature.
      const given: Record<string, string | undefined> = {firstname: 'John', lastname: undefined};
      const actual: Record<string, string> = Dictionaries.withoutUndefinedEntries(given);
      expect(actual).toEqual({firstname: 'John'});
    });

    it('should not alter dictionary without undefined entries', () => {
      const dictionary = {firstname: 'John', lastname: 'Smith'};
      expect(Dictionaries.withoutUndefinedEntries(dictionary)).toEqual(dictionary);
    });

    it('should not alter empty dictionary', () => {
      const dictionary = {};
      expect(Dictionaries.withoutUndefinedEntries(dictionary)).toEqual(dictionary);
    });

    it('should not alter dictionary containing `null` entries', () => {
      const dictionary = {firstname: null, lastname: null};
      expect(Dictionaries.withoutUndefinedEntries(dictionary)).toEqual(dictionary);
    });
  });
});
