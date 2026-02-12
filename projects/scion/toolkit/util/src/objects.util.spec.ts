/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Objects} from './objects.util';

describe('Objects.keys', () => {

  it('should return keys', () => {
    const object = {key1: 'value1', key2: 'value2'};
    expect(Objects.keys(object)).toEqual(['key1', 'key2']);
  });

  it('should preserve data type of keys', () => {
    type Key = `key.${number}`;
    const object: Record<Key, string> = {'key.1': 'value1', 'key.2': 'value2'};
    expect(Objects.keys(object) satisfies Key[]).toEqual(['key.1', 'key.2']);
  });
});

describe('Objects.entries', () => {

  it('should return entries', () => {
    const object = {key1: 'value1', key2: 'value2'};
    expect(Objects.entries(object)).toEqual([['key1', 'value1'], ['key2', 'value2']]);
  });

  it('should preserve data type of keys', () => {
    type Key = `key.${number}`;
    const object: Record<Key, string> = {'key.1': 'value1', 'key.2': 'value2'};
    expect(Objects.entries(object) satisfies Array<[Key, string]>).toEqual([['key.1', 'value1'], ['key.2', 'value2']]);
  });
});

describe('Objects.toMatrixNotation', () => {

  it('should stringify an object to matrix notation', () => {
    const object = {key1: 'value1', key2: undefined, key3: 'value3', key4: null};
    expect(Objects.toMatrixNotation(object)).toEqual('key1=value1;key2=undefined;key3=value3;key4=null');
  });

  it('should stringify `null` to matrix notation', () => {
    expect(Objects.toMatrixNotation(null)).toEqual('');
  });

  it('should stringify `undefined` to matrix notation', () => {
    expect(Objects.toMatrixNotation(undefined)).toEqual('');
  });
});

describe('Objects.isEqual', () => {

  it('should compare strings', () => {
    expect(Objects.isEqual('a', 'a')).toBeTrue();
    expect(Objects.isEqual('a', 'b')).toBeFalse();
    expect(Objects.isEqual('a', 'A')).toBeFalse();
    expect(Objects.isEqual('a', 123)).toBeFalse();
  });

  it('should compare booleans', () => {
    expect(Objects.isEqual(true, true)).toBeTrue();
    expect(Objects.isEqual(true, false)).toBeFalse();
    expect(Objects.isEqual(true, 'true')).toBeFalse();
  });

  it('should compare numbers', () => {
    expect(Objects.isEqual(1, 1)).toBeTrue();
    expect(Objects.isEqual(1, 2)).toBeFalse();
    expect(Objects.isEqual(1, '1')).toBeFalse();
  });

  it('should compare null and undefined', () => {
    expect(Objects.isEqual(null, null)).toBeTrue();
    expect(Objects.isEqual(undefined, undefined)).toBeTrue();
    expect(Objects.isEqual(null, undefined)).toBeFalse();
  });

  it('should compare object literal', () => {
    expect(Objects.isEqual({}, {})).toBeTrue();
    expect(Objects.isEqual({a: 'A', b: 'B'}, {a: 'A', b: 'B'})).toBeTrue();
    expect(Objects.isEqual({a: 'A', b: 'B'}, {b: 'B', a: 'A'})).toBeTrue();
    expect(Objects.isEqual({a: 'A', b: 'B', c: 'C'}, {b: 'B', a: 'A'})).toBeFalse();
    expect(Objects.isEqual({a: 'A', b: 'BB'}, {b: 'B', a: 'A'})).toBeFalse();
    expect(Objects.isEqual({a: {a1: 'A1', a2: 'A2'}, b: {b1: 'B1', b2: 'B2'}}, {a: {a1: 'A1', a2: 'A2'}, b: {b1: 'B1', b2: 'B2'}})).toBeTrue();
    expect(Objects.isEqual({a: {a1: 'A1', a2: 'A2'}, b: {b1: 'B1', b2: 'B2'}}, {b: {b2: 'B2', b1: 'B1'}, a: {a2: 'A2', a1: 'A1'}})).toBeTrue();
  });

  it('should compare Array', () => {
    expect(Objects.isEqual([], [])).toBeTrue();
    expect(Objects.isEqual(['a1', 2, {a: 'A', b: 'B'}], ['a1', 2, {a: 'A', b: 'B'}])).toBeTrue();
    expect(Objects.isEqual(['a1', 2, {a: 'A', b: 'B'}], [{a: 'A', b: 'B'}, 2, 'a1'])).toBeFalse();
    expect(Objects.isEqual(['a1', 2, {a: 'A', b: 'B'}], [{a: 'A', b: 'B'}, 2, 'a1'], {ignoreArrayOrder: true})).toBeTrue();
    expect(Objects.isEqual(['a1', 2, {a: 'A', b: 'B'}], [{a: 'A', b: 'B'}, 2])).toBeFalse();
    expect(Objects.isEqual(['a1', 2, {a: 'A', b: 'B'}], ['a1', 2, {a: 'A'}])).toBeFalse();
    expect(Objects.isEqual(['a1', 2, {a: 'A', b: 'B'}], ['a2', 2, {a: 'A', b: 'B'}])).toBeFalse();
    expect(Objects.isEqual(['a1', 2, {a: 'A', b: 'B'}], ['a1', 2, {a: 'AA', b: 'B'}])).toBeFalse();
    expect(Objects.isEqual(['a1', 2, ['A', 'B']], ['a1', 2, ['A', 'B']])).toBeTrue();
    expect(Objects.isEqual(['a1', 2, ['A', 'B']], ['a1', 2, ['B', 'A']])).toBeFalse();
    expect(Objects.isEqual(['a1', 2, ['A', 'B']], ['a1', 2, ['B', 'A']], {ignoreArrayOrder: true})).toBeTrue();
  });

  it('should compare Map', () => {
    expect(Objects.isEqual(new Map(), new Map())).toBeTrue();
    expect(Objects.isEqual(new Map().set('a', 'A').set('b', 'B'), new Map().set('a', 'A').set('b', 'B'))).toBeTrue();
    expect(Objects.isEqual(new Map().set('a', 'A').set('b', 'B'), new Map().set('b', 'B').set('a', 'A'))).toBeTrue();
    expect(Objects.isEqual(new Map().set('a', 'A').set('b', 'B').set('c', 'C'), new Map().set('b', 'B').set('a', 'A'))).toBeFalse();
    expect(Objects.isEqual(new Map().set('a', 'A').set('b', 'BB'), new Map().set('b', 'B').set('a', 'A'))).toBeFalse();
    expect(Objects.isEqual(new Map().set('a', new Map().set('a1', 'A1').set('a2', 'A2')).set('b', new Map().set('b1', 'B1').set('b2', 'B2')), new Map().set('a', new Map().set('a1', 'A1').set('a2', 'A2')).set('b', new Map().set('b1', 'B1').set('b2', 'B2')))).toBeTrue();
    expect(Objects.isEqual(new Map().set('a', new Map().set('a1', 'A1').set('a2', 'A2')).set('b', new Map().set('b1', 'B1').set('b2', 'B2')), new Map().set('b', new Map().set('b2', 'B2').set('b1', 'B1')).set('a', new Map().set('a2', 'A2').set('a1', 'A1')))).toBeTrue();
  });

  it('should compare Set', () => {
    expect(Objects.isEqual(new Set(), new Set())).toBeTrue();
    expect(Objects.isEqual(new Set().add('a1').add(2).add({a: 'A', b: new Set().add('B')}), new Set().add('a1').add(2).add({a: 'A', b: new Set().add('B')}))).toBeTrue();
    expect(Objects.isEqual(new Set().add('a1').add(2).add({a: 'A', b: new Set().add('B')}), new Set().add({a: 'A', b: new Set().add('B')}).add(2).add('a1'))).toBeTrue();
    expect(Objects.isEqual(new Set().add('a1').add(2).add({a: 'A', b: new Set().add('B')}), new Set().add({a: 'A', b: new Set().add('B')}).add(2))).toBeFalse();
    expect(Objects.isEqual(new Set().add('a1').add(2).add({a: 'A', b: new Set().add('B')}), new Set().add('a1').add(2).add({a: 'A'}))).toBeFalse();
    expect(Objects.isEqual(new Set().add('a1').add(2).add({a: 'A', b: new Set().add('B')}), new Set().add('a2').add(2).add({a: 'A', b: new Set().add('B')}))).toBeFalse();
    expect(Objects.isEqual(new Set().add('a1').add(2).add({a: 'A', b: new Set().add('B')}), new Set().add('a1').add(2).add({a: 'A', b: new Set().add('BB')}))).toBeFalse();
    expect(Objects.isEqual(new Set().add('a1').add(2).add(new Set('A').add('B')), new Set().add('a1').add(2).add(new Set('A').add('B')))).toBeTrue();
    expect(Objects.isEqual(new Set().add('a1').add(2).add(new Set().add('A').add('B')), new Set().add('a1').add(2).add(new Set().add('B').add('A')))).toBeTrue();
  });
});
