/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Observables} from './observables.util';
import {Subject} from 'rxjs';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {fakeAsync, flushMicrotasks} from '@angular/core/testing';

describe('Observables', () => {

  describe('Observables.coerce', () => {

    it('should create a new Observable from a value and then complete', () => {
      const value = {};
      const captor = new ObserveCaptor();
      Observables.coerce(value).subscribe(captor);
      expect(captor.getValues()).toEqual([value]);
      expect(captor.hasCompleted()).toBeTrue();
    });

    it('should create a new Observable from `undefined`', () => {
      const captor = new ObserveCaptor();
      Observables.coerce(undefined).subscribe(captor);
      expect(captor.getValues()).toEqual([undefined]);
      expect(captor.hasCompleted()).toBeTrue();
    });

    it('should create a new Observable from `null`', () => {
      const captor = new ObserveCaptor();
      Observables.coerce(null).subscribe(captor);
      expect(captor.getValues()).toEqual([null]);
      expect(captor.hasCompleted()).toBeTrue();
    });

    it('should return the Observable if given an Observable', async () => {
      const observable = new Subject();
      await expect(Observables.coerce(observable)).toBe(observable);
    });

    it('should return an Observable if given a Promise', fakeAsync(() => {
      const captor = new ObserveCaptor();
      Observables.coerce(Promise.resolve('abc')).subscribe(captor);
      flushMicrotasks();
      expect(captor.getValues()).toEqual(['abc']);
      expect(captor.hasCompleted()).toBeTrue();
    }));
  });
});
