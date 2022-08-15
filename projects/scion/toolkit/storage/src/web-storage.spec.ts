/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {WebStorage} from './web-storage';
import {ObserveCaptor} from '@scion/toolkit/testing';

describe('WebStorage', () => {

  beforeEach(() => {
    sessionStorage.clear();
  });

  describe('WebStorage.observe$', () => {

    it('should, by default, not emit upon subscription if no item is associated with the key', async () => {
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual([]);
    });

    it('should not emit upon subscription if no item is associated with the key (emitIfAbsent: false)', async () => {
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key', {emitIfAbsent: false}).subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual([]);
    });

    it('should emit upon subscription if no item is associated with the key (emitIfAbsent: true)', async () => {
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key', {emitIfAbsent: true}).subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual([undefined]);
    });

    it('should emit upon subscription if there is an item associated with the key', async () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual(['value']);
    });

    it('should emit upon subscription if there is the `undefined` value associated with the key', async () => {
      sessionStorage.setItem('key', undefined!);
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual([undefined]);
    });

    it('should emit upon subscription if there is the `null` value associated with the key', async () => {
      sessionStorage.setItem('key', null!);
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual([null]);
    });

    it('should emit when associating an item with the key', async () => {
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual([]);

      testee.put('key', 'value');
      await expect(observeCaptor.getValues()).toEqual(['value']);
    });

    it('should emit continuously when associating an item with the key', async () => {
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual([]);

      testee.put('key', 'value 1');
      await expect(observeCaptor.getValues()).toEqual(['value 1']);
      observeCaptor.reset();

      testee.put('key', 'value 2');
      await expect(observeCaptor.getValues()).toEqual(['value 2']);
      observeCaptor.reset();

      testee.put('key', 'value 3');
      await expect(observeCaptor.getValues()).toEqual(['value 3']);
      observeCaptor.reset();
    });

    it('should not emit when associating the same item multiple times', async () => {
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual([]);

      testee.put('key', 'value');
      await expect(observeCaptor.getValues()).toEqual(['value']);
      observeCaptor.reset();

      testee.put('key', 'value');
      await expect(observeCaptor.getValues()).toEqual([]);
      observeCaptor.reset();

      testee.put('key', 'value');
      await expect(observeCaptor.getValues()).toEqual([]);
      observeCaptor.reset();
    });

    it('should, by default, not emit when removing an item', async () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual(['value']);
      observeCaptor.reset();

      testee.remove('key');
      await expect(observeCaptor.getValues()).toEqual([]);
    });

    it('should not emit when removing an item (emitIfAbsent: false)', async () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual(['value']);
      observeCaptor.reset();

      testee.remove('key');
      await expect(observeCaptor.getValues()).toEqual([]);
    });

    it('should emit when removing an item (emitIfAbsent: true)', async () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key', {emitIfAbsent: true}).subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual(['value']);
      observeCaptor.reset();

      testee.remove('key');
      await expect(observeCaptor.getValues()).toEqual([undefined]);
    });

    it('should emit when associating the `null` value with the key', async () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual(['value']);
      observeCaptor.reset();

      testee.put('key', null);
      await expect(observeCaptor.getValues()).toEqual([null]);
    });

    it('should emit when associating the `undefined` value with the key', async () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual(['value']);
      observeCaptor.reset();

      testee.put('key', undefined);
      await expect(observeCaptor.getValues()).toEqual([undefined]);
    });

    it('should not emit if an invalid JSON value is associated with the key', async () => {
      sessionStorage.setItem('key', 'VALUE NOT IN JSON FORMAT');
      const testee = new WebStorage(window.sessionStorage);
      const observeCaptor = new ObserveCaptor();

      testee.observe$('key').subscribe(observeCaptor);
      await expect(observeCaptor.getValues()).toEqual([]);
      observeCaptor.reset();

      sessionStorage.setItem('key', 'illegal value');
      await expect(observeCaptor.getValues()).toEqual([]);
      observeCaptor.reset();
    });
  });

  describe('WebStorage.get', () => {

    it('should return the value associated with the given key', () => {
      const testee = new WebStorage(window.sessionStorage);
      testee.put('key', 'value');
      expect(testee.get('key')!).toEqual('value');
    });

    it('should return the object associated with the given key', () => {
      const testee = new WebStorage(window.sessionStorage);
      const value = {p1: 'value', p2: 2, p3: true};
      testee.put('key', value);
      expect(testee.get('key')!).toEqual(value);
    });

    it('should return `undefined` if no item is associated with the given key', () => {
      const testee = new WebStorage(window.sessionStorage);
      expect(testee.get('key')).toBeUndefined();
    });

    it('should return `null` if the `null` value is associated with the given key', () => {
      const testee = new WebStorage(window.sessionStorage);
      testee.put('key', null);
      expect(testee.get('key')).toBeNull();
    });

    it('should return `undefined` if the `undefined` value is associated with the given key', () => {
      const testee = new WebStorage(window.sessionStorage);
      testee.put('key', undefined);
      expect(testee.get('key')).toBeUndefined();
    });

    it('should return `0` if the `0` value is associated with the given key (falsy value)', () => {
      const testee = new WebStorage(window.sessionStorage);
      testee.put('key', 0);
      expect(testee.get('key')!).toEqual(0);
    });

    it('should return `false` if the `false` value is associated with the given key (falsy value)', () => {
      const testee = new WebStorage(window.sessionStorage);
      testee.put('key', false);
      expect(testee.get('key')).toBeFalse();
    });

    it('should return an empty string if the "" value is associated with the given key (falsy value)', () => {
      const testee = new WebStorage(window.sessionStorage);
      testee.put('key', '');
      expect(testee.get('key')!).toEqual('');
    });

    it('should throw if failed to parse the value associated with the given key', () => {
      const testee = new WebStorage(window.sessionStorage);
      sessionStorage.setItem('key', 'VALUE NOT IN JSON FORMAT');
      expect(() => testee.get('key')).toThrowError(/Unexpected token 'V'/);
    });
  });

  describe('WebStorage.isPresent', () => {

    it('should not be present if no value is associated with the key', () => {
      const testee = new WebStorage(window.sessionStorage);
      expect(testee.isPresent('key')).toBeFalse();
    });

    it('should be present if the `null` value is associated with the key', () => {
      const testee = new WebStorage(window.sessionStorage);
      sessionStorage.setItem('key', null!);
      expect(testee.isPresent('key')).toBeTrue();
    });

    it('should be present if the `undefined` value is associated with the key', () => {
      const testee = new WebStorage(window.sessionStorage);
      sessionStorage.setItem('key', undefined!);
      expect(testee.isPresent('key')).toBeTrue();
    });

    it('should be present if a value is associated with the key', () => {
      const testee = new WebStorage(window.sessionStorage);
      sessionStorage.setItem('key', 'value');
      expect(testee.isPresent('key')).toBeTrue();
    });

    it('should be present if a falsy value is associated with the key', () => {
      const testee = new WebStorage(window.sessionStorage);
      testee.put('key', 0);
      expect(testee.isPresent('key')).toBeTrue();

      testee.put('key', '');
      expect(testee.isPresent('key')).toBeTrue();

      testee.put('key', false);
      expect(testee.isPresent('key')).toBeTrue();
    });
  });

  describe('WebStorage.putIfAbsent', () => {

    it('should put an item if not present', async () => {
      const testee = new WebStorage(window.sessionStorage);

      testee.putIfAbsent('key1', 'value');
      await expect(sessionStorage.getItem('key1')).toEqual(JSON.stringify('value'));
      testee.putIfAbsent('key1', 'new value');
      await expect(sessionStorage.getItem('key1')).toEqual(JSON.stringify('value'));

      testee.putIfAbsent('key2', () => 'value');
      await expect(sessionStorage.getItem('key2')).toEqual(JSON.stringify('value'));
      testee.putIfAbsent('key2', () => 'new value');
      await expect(sessionStorage.getItem('key2')).toEqual(JSON.stringify('value'));
    });
  });

  describe('WebStorage.absent$', () => {
    it('should emit if there is no item associated with the key upon subscription', async () => {
      const testee = new WebStorage(window.sessionStorage);
      const absentCaptor = new ObserveCaptor();

      testee.absent$('key').subscribe(absentCaptor);
      await expect(absentCaptor.getValues()).toEqual([undefined]);
    });

    it('should not emit if there is an item associated with the key upon subscription', async () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      const testee = new WebStorage(window.sessionStorage);
      const absentCaptor = new ObserveCaptor();

      testee.absent$('key').subscribe(absentCaptor);
      await expect(absentCaptor.getValues()).toEqual([]);
    });

    it('should emit when when removing an item', async () => {
      const testee = new WebStorage(window.sessionStorage);
      const absentCaptor = new ObserveCaptor();

      testee.absent$('key').subscribe(absentCaptor);
      await expect(absentCaptor.getValues()).toEqual([undefined]);
      absentCaptor.reset();

      testee.put('key', 'value-1');
      await expect(absentCaptor.getValues()).toEqual([]);

      testee.put('key', 'value-2');
      await expect(absentCaptor.getValues()).toEqual([]);

      testee.remove('key');
      await expect(absentCaptor.getValues()).toEqual([undefined]);
    });

    it('should not emit when associating the `null` value with the key', async () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      const testee = new WebStorage(window.sessionStorage);
      const absentCaptor = new ObserveCaptor();

      testee.absent$('key').subscribe(absentCaptor);

      testee.put('key', null);
      await expect(absentCaptor.getValues()).toEqual([]);
    });

    it('should not emit when associating the `undefined` value with the key', async () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      const testee = new WebStorage(window.sessionStorage);
      const absentCaptor = new ObserveCaptor();

      testee.absent$('key').subscribe(absentCaptor);

      testee.put('key', undefined);
      await expect(absentCaptor.getValues()).toEqual([]);
    });

    it('should not emit when associating a falsy value with the key', async () => {
      sessionStorage.setItem('key', JSON.stringify('value'));
      const testee = new WebStorage(window.sessionStorage);
      const absentCaptor = new ObserveCaptor();

      testee.absent$('key').subscribe(absentCaptor);
      await expect(absentCaptor.getValues()).toEqual([]);

      testee.put('key', 0);
      await expect(absentCaptor.getValues()).toEqual([]);

      testee.put('key', '');
      await expect(absentCaptor.getValues()).toEqual([]);

      testee.put('key', false);
      await expect(absentCaptor.getValues()).toEqual([]);
    });
  });
});
