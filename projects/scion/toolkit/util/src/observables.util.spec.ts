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

describe('Observables', () => {

  describe('Observables.coerce', () => {

    it('should create a new Observable from a value', async () => {
      const value = {};
      await expectAsync(Observables.coerce(value).toPromise()).toBeResolvedTo(value);
    });

    it('should create a new Observable from `undefined`', async () => {
      await expectAsync(Observables.coerce(undefined).toPromise()).toBeResolvedTo(undefined);
    });

    it('should create a new Observable from `null`', async () => {
      await expectAsync(Observables.coerce(null).toPromise()).toBeResolvedTo(null);
    });

    it('should return the Observable if given an Observable', async () => {
      const observable = new Subject();
      await expect(Observables.coerce(observable)).toBe(observable);
    });

    it('should return an Observable if given a Promise', async () => {
      const promise = Promise.resolve('abc');
      await expectAsync(Observables.coerce(promise).toPromise()).toBeResolvedTo('abc');
    });
  });
});
