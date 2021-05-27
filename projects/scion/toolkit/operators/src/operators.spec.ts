/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { BehaviorSubject, noop, Observable, Observer, of, Subject, TeardownLogic } from 'rxjs';
import { fakeAsync, flushMicrotasks, TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { finalize, tap } from 'rxjs/operators';
import { combineArray, mapArray, observeInside, subscribeInside } from './operators';
import { ObserveCaptor } from '@scion/toolkit/testing';
import { bufferUntil, distinctArray } from '@scion/toolkit/operators';

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

  describe('combineArray', async () => {

    it('should combine the Observables of each source emission', () => {
      const observeCaptor = new ObserveCaptor();

      const source$ = new Subject<Array<Observable<string[]>>>();
      source$
        .pipe(combineArray())
        .subscribe(observeCaptor);

      // Simulate the source to emit an array of Observables.
      const a$ = new Subject<string[]>();
      const b$ = new Subject<string[]>();
      const c$ = new Subject<string[]>();
      source$.next([a$, b$, c$]);
      expect(observeCaptor.getValues()).toEqual([]);

      observeCaptor.reset();
      a$.next(['a1', 'a2']);
      expect(observeCaptor.getValues()).toEqual([]);

      observeCaptor.reset();
      b$.next(['b1']);
      expect(observeCaptor.getValues()).toEqual([]);

      observeCaptor.reset();
      c$.next(['c1', 'c2', 'c3']);
      expect(observeCaptor.getValues()).toEqual([
        ['a1', 'a2', 'b1', 'c1', 'c2', 'c3'],
      ]);

      observeCaptor.reset();
      c$.next(['c4', 'c5']);
      expect(observeCaptor.getValues()).toEqual([
        ['a1', 'a2', 'b1', 'c4', 'c5'],
      ]);

      observeCaptor.reset();
      b$.next(['b2', 'b3', 'b4']);
      expect(observeCaptor.getValues()).toEqual([
        ['a1', 'a2', 'b2', 'b3', 'b4', 'c4', 'c5'],
      ]);

      observeCaptor.reset();
      a$.next(['a3', 'a4', 'a5']);
      expect(observeCaptor.getValues()).toEqual([
        ['a3', 'a4', 'a5', 'b2', 'b3', 'b4', 'c4', 'c5'],
      ]);

      // Simulate the source to emit an array of Observables.
      observeCaptor.reset();
      const d$ = new BehaviorSubject<string[]>(['d1', 'd2']);
      const e$ = new Subject<string[]>();
      source$.next([d$, e$]);
      expect(observeCaptor.getValues()).toEqual([]);

      observeCaptor.reset();
      e$.next(['e1']);
      expect(observeCaptor.getValues()).toEqual([
        ['d1', 'd2', 'e1'],
      ]);

      observeCaptor.reset();
      d$.next(['d3']);
      expect(observeCaptor.getValues()).toEqual([
        ['d3', 'e1'],
      ]);

      observeCaptor.reset();
      e$.next(['e2', 'e3', 'e4']);
      expect(observeCaptor.getValues()).toEqual([
        ['d3', 'e2', 'e3', 'e4'],
      ]);

      // Simulate an Observable of a previous source emission to emit.
      // Expect no emission since unsubscribed from previous emitted Observables.
      observeCaptor.reset();
      b$.next(['b5']);
      expect(observeCaptor.getValues()).toEqual([]);
    });
  });

  describe('distinctArray', async () => {

    it('should remove duplicates of elements in the source array', () => {
      const observeCaptor = new ObserveCaptor();

      const source$ = new Subject<string[]>();
      source$
        .pipe(distinctArray())
        .subscribe(observeCaptor);

      source$.next(['a', 'b', 'c']);
      expect(observeCaptor.getValues()).toEqual([['a', 'b', 'c']]);

      observeCaptor.reset();
      source$.next(['d', 'e', 'f', 'e', 'd', 'g']);
      expect(observeCaptor.getValues()).toEqual([['d', 'e', 'f', 'g']]);

      observeCaptor.reset();
      source$.next(['d', 'e', 'f']);
      expect(observeCaptor.getValues()).toEqual([['d', 'e', 'f']]);

      observeCaptor.reset();
      source$.next([]);
      expect(observeCaptor.getValues()).toEqual([[]]);

      observeCaptor.reset();
      source$.next(['d', 'd']);
      expect(observeCaptor.getValues()).toEqual([['d']]);
    });

    it('should remove duplicates of elements in the source array by evaluating a key selector', () => {
      const observeCaptor = new ObserveCaptor();

      of([{value: 'a'}, {value: 'b'}, {value: 'a'}, {value: 'c'}])
        .pipe(distinctArray(item => item.value))
        .subscribe(observeCaptor);

      expect(observeCaptor.getLastValue()).toEqual([{value: 'a'}, {value: 'b'}, {value: 'c'}]);
    });
  });

  describe('bufferUntil', async () => {

    it('should buffer emissions until `closingNotifier$` emits', () => {
      const observeCaptor = new ObserveCaptor();

      const closingNotifier$ = new Subject();
      const source$ = new Subject<string>();
      source$
        .pipe(bufferUntil(closingNotifier$))
        .subscribe(observeCaptor);

      source$.next('a');
      expect(observeCaptor.getValues()).toEqual([]);

      source$.next('b');
      expect(observeCaptor.getValues()).toEqual([]);

      source$.next('c');
      expect(observeCaptor.getValues()).toEqual([]);

      // close the buffer.
      closingNotifier$.next();
      expect(observeCaptor.getValues()).toEqual(['a', 'b', 'c']);

      // emit after the buffer is closed.
      source$.next('d');
      expect(observeCaptor.getValues()).toEqual(['a', 'b', 'c', 'd']);

      source$.next('e');
      expect(observeCaptor.getValues()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('should buffer emissions until `closingNotifier$` completes', () => {
      const observeCaptor = new ObserveCaptor();

      const closingNotifier$ = new Subject();
      const source$ = new Subject<string>();
      source$
        .pipe(bufferUntil(closingNotifier$))
        .subscribe(observeCaptor);

      source$.next('a');
      expect(observeCaptor.getValues()).toEqual([]);

      source$.next('b');
      expect(observeCaptor.getValues()).toEqual([]);

      source$.next('c');
      expect(observeCaptor.getValues()).toEqual([]);

      // close the buffer.
      closingNotifier$.complete();
      expect(observeCaptor.getValues()).toEqual(['a', 'b', 'c']);

      // emit after the buffer is closed.
      source$.next('d');
      expect(observeCaptor.getValues()).toEqual(['a', 'b', 'c', 'd']);

      source$.next('e');
      expect(observeCaptor.getValues()).toEqual(['a', 'b', 'c', 'd', 'e']);
    });

    it('should not emit if `closingNotifier$` emits error', () => {
      const observeCaptor = new ObserveCaptor();

      const closingNotifier$ = new Subject();
      const source$ = new Subject<string>();
      source$
        .pipe(bufferUntil(closingNotifier$))
        .subscribe(observeCaptor);

      source$.next('a');
      expect(observeCaptor.getValues()).toEqual([]);

      source$.next('b');
      expect(observeCaptor.getValues()).toEqual([]);

      source$.next('c');
      expect(observeCaptor.getValues()).toEqual([]);

      // emit error.
      closingNotifier$.error('Error');
      expect(observeCaptor.getValues()).toEqual([]);

      // emit after notifier error.
      source$.next('d');
      expect(observeCaptor.getValues()).toEqual([]);
    });

    it('should buffer emissions until `closingNotifier` resolves', fakeAsync(() => {
      const observeCaptor = new ObserveCaptor();

      let resolvePromiseFn: () => void;
      const closingNotifier = new Promise<void>(resolve => resolvePromiseFn = resolve);
      const source$ = new Subject<string>();
      source$
        .pipe(bufferUntil(closingNotifier))
        .subscribe(observeCaptor);

      source$.next('a');
      flushMicrotasks();
      expect(observeCaptor.getValues()).toEqual([]);

      source$.next('b');
      flushMicrotasks();
      expect(observeCaptor.getValues()).toEqual([]);

      source$.next('c');
      flushMicrotasks();
      expect(observeCaptor.getValues()).toEqual([]);

      // close the buffer.
      resolvePromiseFn();
      flushMicrotasks();
      expect(observeCaptor.getValues()).toEqual(['a', 'b', 'c']);

      // emit after the buffer is closed.
      source$.next('d');
      flushMicrotasks();
      expect(observeCaptor.getValues()).toEqual(['a', 'b', 'c', 'd']);

      source$.next('e');
      flushMicrotasks();
      expect(observeCaptor.getValues()).toEqual(['a', 'b', 'c', 'd', 'e']);
    }));
  });
});
