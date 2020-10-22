/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { noop, Observable, Observer, of, TeardownLogic } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { mapArray, observeInside, subscribeInside } from './operators';
import { ObserveCaptor } from '@scion/toolkit/testing';

describe('Operators', () => {

  beforeEach(() => TestBed.configureTestingModule({}));

  describe('mapArray', async () => {

    it('should map items of an array', async () => {
      const observeCaptor = new ObserveCaptor();

      of(['a', 'b', 'c'])
        .pipe(mapArray(a => a.toUpperCase()))
        .subscribe(observeCaptor);

      await observeCaptor.waitUntilCompletedOrErrored();
      await expect(observeCaptor.getLastValue()).toEqual(['A', 'B', 'C']);
    });
  });

  describe('observeInside', () => {

    it('should execute downstream, next operators and the next subscription handler inside the Angular zone', async () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      const insideAngularCaptor = {
        onObservableCreate: undefined,
        onObservableTeardown: undefined,
        onNextBeforeObserveInside: undefined,
        onNextAfterObserveInside: undefined,
        onNext: undefined,
        onFinalize: undefined,
      };

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.next(); // emit an event
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap(() => insideAngularCaptor.onNextBeforeObserveInside = NgZone.isInAngularZone()),
          // use `observeInside` operator to continue operator chain inside the Angular zone
          observeInside(continueFn => zone.run(continueFn)),
          tap(() => insideAngularCaptor.onNextAfterObserveInside = NgZone.isInAngularZone()),
        );

      // WHEN
      const subscription = observable$.subscribe(() => {
        insideAngularCaptor.onNext = NgZone.isInAngularZone();
      });

      // THEN
      await expect(NgZone.isInAngularZone()).toBeFalse();
      await expect(insideAngularCaptor.onObservableCreate).toBeFalse();
      await expect(insideAngularCaptor.onNextBeforeObserveInside).toBeFalse();
      await expect(insideAngularCaptor.onNextAfterObserveInside).toBeTrue();
      await expect(insideAngularCaptor.onNext).toBeTrue();

      subscription.unsubscribe();

      await expect(insideAngularCaptor.onObservableTeardown).toBeFalse();
      await expect(insideAngularCaptor.onFinalize).toBeFalse();
    });

    it('should execute downstream complete operators and the complete subscription handler inside the Angular zone', async () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      const insideAngularCaptor = {
        onObservableCreate: undefined,
        onObservableTeardown: undefined,
        onCompleteBeforeObserveInside: undefined,
        onCompleteAfterObserveInside: undefined,
        onComplete: undefined,
        onFinalize: undefined,
      };

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.complete(); // complete the Observable
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap(noop, noop, () => insideAngularCaptor.onCompleteBeforeObserveInside = NgZone.isInAngularZone()),
          // use `observeInside` operator to continue operator chain inside the Angular zone
          observeInside(continueFn => zone.run(continueFn)),
          tap(noop, noop, () => insideAngularCaptor.onCompleteAfterObserveInside = NgZone.isInAngularZone()),
        );

      // WHEN
      const subscription = observable$.subscribe(noop, noop, () => {
        insideAngularCaptor.onComplete = NgZone.isInAngularZone();
      });

      // THEN
      await expect(NgZone.isInAngularZone()).toBeFalse();
      await expect(insideAngularCaptor.onObservableCreate).toBeFalse();
      await expect(insideAngularCaptor.onCompleteBeforeObserveInside).toBeFalse();
      await expect(insideAngularCaptor.onCompleteAfterObserveInside).toBeTrue();
      await expect(insideAngularCaptor.onComplete).toBeTrue();

      subscription.unsubscribe();

      await expect(insideAngularCaptor.onObservableTeardown).toBeFalse();
      await expect(insideAngularCaptor.onFinalize).toBeFalse();
    });

    it('should execute downstream error operators and the error subscription handler inside the Angular zone', async () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      const insideAngularCaptor = {
        onObservableCreate: undefined,
        onObservableTeardown: undefined,
        onErrorBeforeObserveInside: undefined,
        onErrorAfterObserveInside: undefined,
        onError: undefined,
        onFinalize: undefined,
      };

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.error('error'); // emit an error
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap(noop, () => insideAngularCaptor.onErrorBeforeObserveInside = NgZone.isInAngularZone()),
          // use `observeInside` operator to continue operator chain inside the Angular zone
          observeInside(continueFn => zone.run(continueFn)),
          tap(noop, () => insideAngularCaptor.onErrorAfterObserveInside = NgZone.isInAngularZone()),
        );

      // WHEN
      const subscription = observable$.subscribe(noop, () => {
        insideAngularCaptor.onError = NgZone.isInAngularZone();
      });

      // THEN
      await expect(NgZone.isInAngularZone()).toBeFalse();
      await expect(insideAngularCaptor.onObservableCreate).toBeFalse();
      await expect(insideAngularCaptor.onErrorBeforeObserveInside).toBeFalse();
      await expect(insideAngularCaptor.onErrorAfterObserveInside).toBeTrue();
      await expect(insideAngularCaptor.onError).toBeTrue();

      subscription.unsubscribe();

      await expect(insideAngularCaptor.onObservableTeardown).toBeFalse();
      await expect(insideAngularCaptor.onFinalize).toBeFalse();
    });
  });

  describe('subscribeInside', () => {

    it('should create the Observable and execute next operators and the next handler inside the Angular zone', async () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      const insideAngularCaptor = {
        onObservableCreate: undefined,
        onObservableTeardown: undefined,
        onNextBeforeSubscribeInside: undefined,
        onNextAfterSubscribeInside: undefined,
        onNext: undefined,
        onFinalize: undefined,
      };

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.next(); // emit an event
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap(() => insideAngularCaptor.onNextBeforeSubscribeInside = NgZone.isInAngularZone()),
          // use `subscribeInside` operator to run downstream and upstream operators inside the Angular zone
          subscribeInside(continueFn => zone.run(continueFn)),
          tap(() => insideAngularCaptor.onNextAfterSubscribeInside = NgZone.isInAngularZone()),
        );

      // WHEN
      const subscription = observable$.subscribe(() => {
        insideAngularCaptor.onNext = NgZone.isInAngularZone();
      });

      // THEN
      await expect(NgZone.isInAngularZone()).toBeFalse();
      await expect(insideAngularCaptor.onObservableCreate).toBeTrue();
      await expect(insideAngularCaptor.onNextBeforeSubscribeInside).toBeTrue();
      await expect(insideAngularCaptor.onNextAfterSubscribeInside).toBeTrue();
      await expect(insideAngularCaptor.onNext).toBeTrue();

      subscription.unsubscribe();

      await expect(insideAngularCaptor.onObservableTeardown).toBeTrue();
      await expect(insideAngularCaptor.onFinalize).toBeTrue();
    });

    it('should create the Observable and execute error operators and the error handler inside the Angular zone', async () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      const insideAngularCaptor = {
        onObservableCreate: undefined,
        onObservableTeardown: undefined,
        onErrorBeforeSubscribeInside: undefined,
        onErrorAfterSubscribeInside: undefined,
        onError: undefined,
        onFinalize: undefined,
      };

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.error('error'); // emit an error
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap(noop, () => insideAngularCaptor.onErrorBeforeSubscribeInside = NgZone.isInAngularZone()),
          // use `subscribeInside` operator to run downstream and upstream operators inside the Angular zone
          subscribeInside(continueFn => zone.run(continueFn)),
          tap(noop, () => insideAngularCaptor.onErrorAfterSubscribeInside = NgZone.isInAngularZone()),
        );

      // WHEN
      const subscription = observable$.subscribe(noop, () => {
        insideAngularCaptor.onError = NgZone.isInAngularZone();
      });

      // THEN
      await expect(NgZone.isInAngularZone()).toBeFalse();
      await expect(insideAngularCaptor.onObservableCreate).toBeTrue();
      await expect(insideAngularCaptor.onErrorBeforeSubscribeInside).toBeTrue();
      await expect(insideAngularCaptor.onErrorAfterSubscribeInside).toBeTrue();
      await expect(insideAngularCaptor.onError).toBeTrue();

      subscription.unsubscribe();

      await expect(insideAngularCaptor.onObservableTeardown).toBeTrue();
      await expect(insideAngularCaptor.onFinalize).toBeTrue();
    });

    it('should create the Observable and execute complete operators and the complete handler inside the Angular zone', async () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      const insideAngularCaptor = {
        onObservableCreate: undefined,
        onObservableTeardown: undefined,
        onCompleteBeforeSubscribeInside: undefined,
        onCompleteAfterSubscribeInside: undefined,
        onComplete: undefined,
        onFinalize: undefined,
      };

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.complete(); // complete the Observable
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap(noop, noop, () => insideAngularCaptor.onCompleteBeforeSubscribeInside = NgZone.isInAngularZone()),
          // use `subscribeInside` operator to run downstream and upstream operators inside the Angular zone
          subscribeInside(continueFn => zone.run(continueFn)),
          tap(noop, noop, () => insideAngularCaptor.onCompleteAfterSubscribeInside = NgZone.isInAngularZone()),
        );

      // WHEN
      const subscription = observable$.subscribe(noop, noop, () => {
        insideAngularCaptor.onComplete = NgZone.isInAngularZone();
      });

      // THEN
      await expect(NgZone.isInAngularZone()).toBeFalse();
      await expect(insideAngularCaptor.onObservableCreate).toBeTrue();
      await expect(insideAngularCaptor.onCompleteBeforeSubscribeInside).toBeTrue();
      await expect(insideAngularCaptor.onCompleteAfterSubscribeInside).toBeTrue();
      await expect(insideAngularCaptor.onComplete).toBeTrue();

      subscription.unsubscribe();

      await expect(insideAngularCaptor.onObservableTeardown).toBeTrue();
      await expect(insideAngularCaptor.onFinalize).toBeTrue();
    });
  });

  describe('subscribeInside and observeInside', () => {

    it('should subscribe outside the Angular zone, but observe inside of the Angular zone ', async () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      const insideAngularCaptor = {
        onObservableCreate: undefined,
        onObservableTeardown: undefined,
        onNextBeforeSubscribeInside: undefined,
        onNextAfterSubscribeInside: undefined,
        onNextAfterObserveInside: undefined,
        onNext: undefined,
        onComplete: undefined,
        onFinalize: undefined,
      };

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.next(); // emit an event
        observer.complete();
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap(() => insideAngularCaptor.onNextBeforeSubscribeInside = NgZone.isInAngularZone()),
          // use `subscribeInside` operator to run downstream and upstream operators inside the Angular zone
          subscribeInside(continueFn => zone.runOutsideAngular(continueFn)),
          tap(() => insideAngularCaptor.onNextAfterSubscribeInside = NgZone.isInAngularZone()),
          // use `observeInside` operator to run downstream operators inside the Angular zone
          observeInside(continueFn => zone.run(continueFn)),
          tap(() => insideAngularCaptor.onNextAfterObserveInside = NgZone.isInAngularZone()),
        );

      // WHEN
      await zone.run(async () => {
        const subscription = observable$.subscribe(
          () => insideAngularCaptor.onNext = NgZone.isInAngularZone(),
          noop,
          () => insideAngularCaptor.onComplete = NgZone.isInAngularZone(),
        );

        // THEN
        await expect(NgZone.isInAngularZone()).toBeTrue();
        await expect(insideAngularCaptor.onObservableCreate).toBeFalse();
        await expect(insideAngularCaptor.onNextBeforeSubscribeInside).toBeFalse();
        await expect(insideAngularCaptor.onNextAfterSubscribeInside).toBeFalse();
        await expect(insideAngularCaptor.onNextAfterObserveInside).toBeTrue();
        await expect(insideAngularCaptor.onNext).toBeTrue();
        await expect(insideAngularCaptor.onComplete).toBeTrue();

        subscription.unsubscribe();

        await expect(insideAngularCaptor.onObservableTeardown).toBeFalse();
        await expect(insideAngularCaptor.onFinalize).toBeFalse();
      });
    });
  });
});
