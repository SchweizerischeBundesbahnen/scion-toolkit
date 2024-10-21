/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {BehaviorSubject, concat, EMPTY, NEVER, Observable, Observer, of, Subject, TeardownLogic, throwError} from 'rxjs';
import {fakeAsync, flushMicrotasks, TestBed} from '@angular/core/testing';
import {NgZone} from '@angular/core';
import {finalize, tap} from 'rxjs/operators';
import {bufferUntil, combineArray, distinctArray, filterArray, mapArray, observeInside, subscribeInside} from './operators';
import {ObserveCaptor} from '@scion/toolkit/testing';

describe('Operators', () => {

  beforeEach(() => TestBed.configureTestingModule({}));

  describe('filterArray', () => {

    it('should filter items', () => {
      const observeCaptor = new ObserveCaptor();

      of(['a', 'b', 'c'])
        .pipe(filterArray(item => item === 'a'))
        .subscribe(observeCaptor);

      expect(observeCaptor.getValues()).toEqual([
        ['a'],
      ]);
    });

    it('should not filter items if predicate is undefined', () => {
      const observeCaptor = new ObserveCaptor();

      of(['a', 'b', 'c'])
        .pipe(filterArray(undefined))
        .subscribe(observeCaptor);

      expect(observeCaptor.getValues()).toEqual([
        ['a', 'b', 'c'],
      ]);
    });

    it('should not filter `null` values', () => {
      const observeCaptor = new ObserveCaptor();

      of(['a', null, null, 'b'])
        .pipe(filterArray(() => true))
        .subscribe(observeCaptor);

      expect(observeCaptor.getValues()).toEqual([
        ['a', null, null, 'b'],
      ]);
    });

    it('should not filter `undefined` values', () => {
      const observeCaptor = new ObserveCaptor();

      of(['a', undefined, undefined, 'b'])
        .pipe(filterArray(() => true))
        .subscribe(observeCaptor);

      expect(observeCaptor.getValues()).toEqual([
        ['a', undefined, undefined, 'b'],
      ]);
    });

    describe('promise predicate', () => {

      it('should filter items with promise as predicate', async () => {
        const observeCaptor = new ObserveCaptor();

        const predicates = new Map<string, Promise<boolean>>()
          .set('a', Promise.resolve(true))
          .set('b', Promise.resolve(true))
          .set('c', Promise.resolve(false));

        of(['a', 'b', 'c'])
          .pipe(filterArray(item => predicates.get(item)!))
          .subscribe(observeCaptor);

        await observeCaptor.waitUntilCompletedOrErrored();
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'b'],
        ]);
      });

      it('should not error when predicate errors', async () => {
        const observeCaptor = new ObserveCaptor();

        const predicates = new Map<string, Promise<boolean>>()
          .set('a', Promise.resolve(true))
          .set('b', Promise.reject('error'))
          .set('c', Promise.resolve(true));

        concat(of(['a', 'b', 'c']), NEVER)
          .pipe(filterArray(item => predicates.get(item)!))
          .subscribe(observeCaptor);

        await observeCaptor.waitUntilEmitCount(1);
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'c'],
        ]);
        expect(observeCaptor.hasErrored()).toBeFalse();
        expect(observeCaptor.hasCompleted()).toBeFalse();
      });
    });

    describe('observable predicate', () => {

      it('should filter items with observable as predicate', () => {
        const observeCaptor = new ObserveCaptor();

        const predicates = new Map<string, Subject<boolean>>()
          .set('a', new Subject<boolean>())
          .set('b', new Subject<boolean>())
          .set('c', new Subject<boolean>());

        of(['a', 'b', 'c'])
          .pipe(filterArray(item => predicates.get(item)!))
          .subscribe(observeCaptor);

        // WHEN predicate 'a' emits true
        predicates.get('a')!.next(true);
        // THEN expect no emission
        expect(observeCaptor.getValues()).toEqual([]);

        // WHEN predicate 'b' emits true
        predicates.get('b')!.next(true);
        // THEN expect no emission
        expect(observeCaptor.getValues()).toEqual([]);

        // WHEN predicate 'c' emits true
        predicates.get('c')!.next(true);
        // THEN expect emission
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'b', 'c'],
        ]);

        observeCaptor.reset();

        // WHEN predicate 'b' emits true
        predicates.get('b')!.next(true);
        // THEN expect no emission
        expect(observeCaptor.getValues()).toEqual([]);

        observeCaptor.reset();

        // WHEN predicate 'b' emits false
        predicates.get('b')!.next(false);
        // THEN expect emission
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'c'],
        ]);

        observeCaptor.reset();

        // WHEN predicate 'a' emits false
        predicates.get('a')!.next(false);
        // THEN expect emission
        expect(observeCaptor.getValues()).toEqual([
          ['c'],
        ]);

        observeCaptor.reset();

        // WHEN predicate 'c' emits false
        predicates.get('c')!.next(false);
        // THEN expect emission
        expect(observeCaptor.getValues()).toEqual([
          [],
        ]);
      });

      it('should distinct predicate emissions, but not item emissions', () => {
        const observeCaptor = new ObserveCaptor();

        const predicates = new Map<string, Subject<boolean>>()
          .set('a', new Subject<boolean>())
          .set('b', new Subject<boolean>())
          .set('c', new Subject<boolean>());

        const items$ = new BehaviorSubject<string[]>(['a', 'b', 'c']);
        items$
          .pipe(filterArray(item => predicates.get(item)!))
          .subscribe(observeCaptor);

        // GIVEN
        predicates.get('a')!.next(true);
        predicates.get('b')!.next(true);
        predicates.get('c')!.next(true);
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'b', 'c'],
        ]);

        observeCaptor.reset();

        // WHEN predicate 'a' emits true again
        predicates.get('a')!.next(true);
        // THEN expect no emission
        expect(observeCaptor.getValues()).toEqual([]);

        observeCaptor.reset();

        // WHEN emitting the same items again
        items$.next(['a', 'b', 'c']);
        predicates.get('a')!.next(true);
        predicates.get('b')!.next(true);
        predicates.get('c')!.next(true);
        // THEN expect items to be emitted
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'b', 'c'],
        ]);
      });

      it('should not complete when predicates complete', () => {
        const observeCaptor = new ObserveCaptor();

        const predicates = new Map<string, Subject<boolean>>()
          .set('a', new Subject<boolean>())
          .set('b', new Subject<boolean>());

        concat(of(['a', 'b']), NEVER)
          .pipe(filterArray(item => predicates.get(item)!))
          .subscribe(observeCaptor);

        // GIVEN
        predicates.get('a')!.next(true);
        predicates.get('b')!.next(true);
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'b'],
        ]);

        // WHEN predicate 'b' completes
        predicates.get('b')!.complete();
        // THEN expect no emission
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'b'],
        ]);
        expect(observeCaptor.hasCompleted()).toBeFalse();

        // WHEN predicate 'a' completes
        predicates.get('a')!.complete();
        // THEN expect no emission
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'b'],
        ]);
        expect(observeCaptor.hasCompleted()).toBeFalse();
      });

      it('should not error when predicate errors', () => {
        const observeCaptor = new ObserveCaptor();

        const predicates = new Map<string, Subject<boolean>>()
          .set('a', new Subject<boolean>())
          .set('b', throwError(() => 'error') as any)
          .set('c', new Subject<boolean>())
          .set('d', new Subject<boolean>())
          .set('e', new Subject<boolean>());

        of(['a', 'b', 'c', 'd', 'e'])
          .pipe(filterArray(item => predicates.get(item)!))
          .subscribe(observeCaptor);

        // GIVEN
        predicates.get('a')!.next(true);
        predicates.get('c')!.next(true);
        predicates.get('d')!.next(false);
        predicates.get('e')!.next(false);
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'c'],
        ]);
        expect(observeCaptor.hasErrored()).toBeFalse();

        observeCaptor.reset();

        // WHEN subject 'a' errors
        predicates.get('a')!.error('error');
        // THEN expect emission (because 'a' had a `true` predicate) and observable not to error
        expect(observeCaptor.getValues()).toEqual([
          ['c'],
        ]);
        expect(observeCaptor.hasErrored()).toBeFalse();
        expect(observeCaptor.hasCompleted()).toBeFalse();

        observeCaptor.reset();

        // WHEN subject 'e' errors
        predicates.get('e')!.error('error');
        // THEN expect no emission because 'e' had a `false` predicate
        expect(observeCaptor.getValues()).toEqual([]);
        expect(observeCaptor.hasErrored()).toBeFalse();
        expect(observeCaptor.hasCompleted()).toBeFalse();

        observeCaptor.reset();

        // WHEN subject 'd' emits
        predicates.get('d')!.next(true);
        // THEN expect emission
        expect(observeCaptor.getValues()).toEqual([
          ['c', 'd'],
        ]);
        expect(observeCaptor.hasErrored()).toBeFalse();
        expect(observeCaptor.hasCompleted()).toBeFalse();
      });

      it('should continue filtering the source even if some predicate complete without first emission', () => {
        const observeCaptor = new ObserveCaptor();

        const predicates = new Map<string, Subject<boolean>>()
          .set('a', new Subject<boolean>())
          .set('b', new Subject<boolean>())
          .set('c', new Subject<boolean>())
          .set('d', EMPTY as any);

        of(['a', 'b', 'c', 'd'])
          .pipe(filterArray(item => predicates.get(item)!))
          .subscribe(observeCaptor);

        // WHEN predicate 'a' emits true
        predicates.get('a')!.next(true);
        // THEN expect no emission
        expect(observeCaptor.getValues()).toEqual([]);

        // WHEN predicate 'b' emits true
        predicates.get('b')!.next(true);
        // THEN expect no emission
        expect(observeCaptor.getValues()).toEqual([]);

        // WHEN predicate 'c' completes
        predicates.get('c')!.complete();
        // THEN expect emission
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'b'],
        ]);

        observeCaptor.reset();

        // WHEN predicate 'b' emits false
        predicates.get('b')!.next(false);
        // THEN expect emission
        expect(observeCaptor.getValues()).toEqual([
          ['a'],
        ]);

        observeCaptor.reset();

        // WHEN predicate 'b' emits true
        predicates.get('b')!.next(true);
        // THEN expect emission
        expect(observeCaptor.getValues()).toEqual([
          ['a', 'b'],
        ]);
      });
    });
  });

  describe('mapArray', () => {

    it('should map items of an array', () => {
      const observeCaptor = new ObserveCaptor();

      of(['a', 'b', 'c'])
        .pipe(mapArray(a => a.toUpperCase()))
        .subscribe(observeCaptor);

      expect(observeCaptor.getLastValue()).toEqual(['A', 'B', 'C']);
    });
  });

  describe('observeInside', () => {

    it('should execute downstream, next operators and the next subscription handler inside the Angular zone', () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      interface InsideNgZoneCaptor {
        onObservableCreate?: boolean;
        onObservableTeardown?: boolean;
        onNextBeforeObserveInside?: boolean;
        onNextAfterObserveInside?: boolean;
        onNext?: boolean;
        onFinalize?: boolean;
      }

      const insideAngularCaptor: InsideNgZoneCaptor = {};

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
      expect(NgZone.isInAngularZone()).toBeFalse();
      expect(insideAngularCaptor.onObservableCreate).toBeFalse();
      expect(insideAngularCaptor.onNextBeforeObserveInside).toBeFalse();
      expect(insideAngularCaptor.onNextAfterObserveInside).toBeTrue();
      expect(insideAngularCaptor.onNext).toBeTrue();

      subscription.unsubscribe();

      expect(insideAngularCaptor.onObservableTeardown).toBeFalse();
      expect(insideAngularCaptor.onFinalize).toBeFalse();
    });

    it('should execute downstream complete operators and the complete subscription handler inside the Angular zone', () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      interface InsideNgZoneCaptor {
        onObservableCreate?: boolean;
        onObservableTeardown?: boolean;
        onCompleteBeforeObserveInside?: boolean;
        onCompleteAfterObserveInside?: boolean;
        onComplete?: boolean;
        onFinalize?: boolean;
      }

      const insideAngularCaptor: InsideNgZoneCaptor = {};

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.complete(); // complete the Observable
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap({complete: () => insideAngularCaptor.onCompleteBeforeObserveInside = NgZone.isInAngularZone()}),
          // use `observeInside` operator to continue operator chain inside the Angular zone
          observeInside(continueFn => zone.run(continueFn)),
          tap({complete: () => insideAngularCaptor.onCompleteAfterObserveInside = NgZone.isInAngularZone()}),
        );

      // WHEN
      const subscription = observable$.subscribe({
        complete: () => insideAngularCaptor.onComplete = NgZone.isInAngularZone(),
      });

      // THEN
      expect(NgZone.isInAngularZone()).toBeFalse();
      expect(insideAngularCaptor.onObservableCreate).toBeFalse();
      expect(insideAngularCaptor.onCompleteBeforeObserveInside).toBeFalse();
      expect(insideAngularCaptor.onCompleteAfterObserveInside).toBeTrue();
      expect(insideAngularCaptor.onComplete).toBeTrue();

      subscription.unsubscribe();

      expect(insideAngularCaptor.onObservableTeardown).toBeFalse();
      expect(insideAngularCaptor.onFinalize).toBeFalse();
    });

    it('should execute downstream error operators and the error subscription handler inside the Angular zone', () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      interface InsideNgZoneCaptor {
        onObservableCreate?: boolean;
        onObservableTeardown?: boolean;
        onErrorBeforeObserveInside?: boolean;
        onErrorAfterObserveInside?: boolean;
        onError?: boolean;
        onFinalize?: boolean;
      }

      const insideAngularCaptor: InsideNgZoneCaptor = {};

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.error('error'); // emit an error
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap({error: () => insideAngularCaptor.onErrorBeforeObserveInside = NgZone.isInAngularZone()}),
          // use `observeInside` operator to continue operator chain inside the Angular zone
          observeInside(continueFn => zone.run(continueFn)),
          tap({error: () => insideAngularCaptor.onErrorAfterObserveInside = NgZone.isInAngularZone()}),
        );

      // WHEN
      const subscription = observable$.subscribe({
        error: () => insideAngularCaptor.onError = NgZone.isInAngularZone(),
      });

      // THEN
      expect(NgZone.isInAngularZone()).toBeFalse();
      expect(insideAngularCaptor.onObservableCreate).toBeFalse();
      expect(insideAngularCaptor.onErrorBeforeObserveInside).toBeFalse();
      expect(insideAngularCaptor.onErrorAfterObserveInside).toBeTrue();
      expect(insideAngularCaptor.onError).toBeTrue();

      subscription.unsubscribe();

      expect(insideAngularCaptor.onObservableTeardown).toBeFalse();
      expect(insideAngularCaptor.onFinalize).toBeFalse();
    });
  });

  describe('subscribeInside', () => {

    it('should create the Observable and execute next operators and the next handler inside the Angular zone', () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      interface InsideNgZoneCaptor {
        onObservableCreate?: boolean;
        onObservableTeardown?: boolean;
        onNextBeforeSubscribeInside?: boolean;
        onNextAfterSubscribeInside?: boolean;
        onNext?: boolean;
        onFinalize?: boolean;
      }

      const insideAngularCaptor: InsideNgZoneCaptor = {};

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
      expect(NgZone.isInAngularZone()).toBeFalse();
      expect(insideAngularCaptor.onObservableCreate).toBeTrue();
      expect(insideAngularCaptor.onNextBeforeSubscribeInside).toBeTrue();
      expect(insideAngularCaptor.onNextAfterSubscribeInside).toBeTrue();
      expect(insideAngularCaptor.onNext).toBeTrue();

      subscription.unsubscribe();

      expect(insideAngularCaptor.onObservableTeardown).toBeTrue();
      expect(insideAngularCaptor.onFinalize).toBeTrue();
    });

    it('should create the Observable and execute error operators and the error handler inside the Angular zone', () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      interface InsideNgZoneCaptor {
        onObservableCreate?: boolean;
        onObservableTeardown?: boolean;
        onErrorBeforeSubscribeInside?: boolean;
        onErrorAfterSubscribeInside?: boolean;
        onError?: boolean;
        onFinalize?: boolean;
      }

      const insideAngularCaptor: InsideNgZoneCaptor = {};

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.error('error'); // emit an error
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap({error: () => insideAngularCaptor.onErrorBeforeSubscribeInside = NgZone.isInAngularZone()}),
          // use `subscribeInside` operator to run downstream and upstream operators inside the Angular zone
          subscribeInside(continueFn => zone.run(continueFn)),
          tap({error: () => insideAngularCaptor.onErrorAfterSubscribeInside = NgZone.isInAngularZone()}),
        );

      // WHEN
      const subscription = observable$.subscribe({
        error: () => insideAngularCaptor.onError = NgZone.isInAngularZone(),
      });

      // THEN
      expect(NgZone.isInAngularZone()).toBeFalse();
      expect(insideAngularCaptor.onObservableCreate).toBeTrue();
      expect(insideAngularCaptor.onErrorBeforeSubscribeInside).toBeTrue();
      expect(insideAngularCaptor.onErrorAfterSubscribeInside).toBeTrue();
      expect(insideAngularCaptor.onError).toBeTrue();

      subscription.unsubscribe();

      expect(insideAngularCaptor.onObservableTeardown).toBeTrue();
      expect(insideAngularCaptor.onFinalize).toBeTrue();
    });

    it('should create the Observable and execute complete operators and the complete handler inside the Angular zone', () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      interface InsideNgZoneCaptor {
        onObservableCreate?: boolean;
        onObservableTeardown?: boolean;
        onCompleteBeforeSubscribeInside?: boolean;
        onCompleteAfterSubscribeInside?: boolean;
        onComplete?: boolean;
        onFinalize?: boolean;
      }

      const insideAngularCaptor: InsideNgZoneCaptor = {};

      const observable$ = new Observable((observer: Observer<void>): TeardownLogic => {
        insideAngularCaptor.onObservableCreate = NgZone.isInAngularZone();
        observer.complete(); // complete the Observable
        return () => insideAngularCaptor.onObservableTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
          tap({complete: () => insideAngularCaptor.onCompleteBeforeSubscribeInside = NgZone.isInAngularZone()}),
          // use `subscribeInside` operator to run downstream and upstream operators inside the Angular zone
          subscribeInside(continueFn => zone.run(continueFn)),
          tap({complete: () => insideAngularCaptor.onCompleteAfterSubscribeInside = NgZone.isInAngularZone()}),
        );

      // WHEN
      const subscription = observable$.subscribe({
        complete: () => insideAngularCaptor.onComplete = NgZone.isInAngularZone(),
      });

      // THEN
      expect(NgZone.isInAngularZone()).toBeFalse();
      expect(insideAngularCaptor.onObservableCreate).toBeTrue();
      expect(insideAngularCaptor.onCompleteBeforeSubscribeInside).toBeTrue();
      expect(insideAngularCaptor.onCompleteAfterSubscribeInside).toBeTrue();
      expect(insideAngularCaptor.onComplete).toBeTrue();

      subscription.unsubscribe();

      expect(insideAngularCaptor.onObservableTeardown).toBeTrue();
      expect(insideAngularCaptor.onFinalize).toBeTrue();
    });
  });

  describe('subscribeInside and observeInside', () => {

    it('should subscribe outside the Angular zone, but observe inside of the Angular zone ', () => {
      const zone = TestBed.inject(NgZone);

      // GIVEN
      interface InsideNgZoneCaptor {
        onObservableCreate?: boolean;
        onObservableTeardown?: boolean;
        onNextBeforeSubscribeInside?: boolean;
        onNextAfterSubscribeInside?: boolean;
        onNextAfterObserveInside?: boolean;
        onNext?: boolean;
        onComplete?: boolean;
        onFinalize?: boolean;
      }

      const insideAngularCaptor: InsideNgZoneCaptor = {};

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
      zone.run(() => {
        const subscription = observable$.subscribe({
          next: () => insideAngularCaptor.onNext = NgZone.isInAngularZone(),
          complete: () => insideAngularCaptor.onComplete = NgZone.isInAngularZone(),
        });

        // THEN
        expect(NgZone.isInAngularZone()).toBeTrue();
        expect(insideAngularCaptor.onObservableCreate).toBeFalse();
        expect(insideAngularCaptor.onNextBeforeSubscribeInside).toBeFalse();
        expect(insideAngularCaptor.onNextAfterSubscribeInside).toBeFalse();
        expect(insideAngularCaptor.onNextAfterObserveInside).toBeTrue();
        expect(insideAngularCaptor.onNext).toBeTrue();
        expect(insideAngularCaptor.onComplete).toBeTrue();

        subscription.unsubscribe();

        expect(insideAngularCaptor.onObservableTeardown).toBeFalse();
        expect(insideAngularCaptor.onFinalize).toBeFalse();
      });
    });
  });

  describe('combineArray', () => {

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

  describe('distinctArray', () => {

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

  describe('bufferUntil', () => {

    it('should buffer emissions until `closingNotifier$` emits', () => {
      const observeCaptor = new ObserveCaptor();

      const closingNotifier$ = new Subject<void>();
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

      const closingNotifier$ = new Subject<never>();
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

    it('should error if `closingNotifier$` errors', () => {
      const observeCaptor = new ObserveCaptor();

      const closingNotifier$ = new Subject<void>();
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
      expect(observeCaptor.hasErrored()).toBeTrue();

      // emit after notifier error.
      source$.next('d');
      expect(observeCaptor.getValues()).toEqual([]);
      expect(observeCaptor.hasErrored()).toBeTrue();
    });

    it('should share buffer status among subscriptions', () => {
      const closingNotifier$ = new Subject<void>();
      const source$ = new Subject<string>();
      const testee$ = source$.pipe(bufferUntil(closingNotifier$));

      // Subscribe captor 1.
      const observeCaptor1 = new ObserveCaptor();
      const subscription1 = testee$.subscribe(observeCaptor1);

      source$.next('a');
      expect(observeCaptor1.getValues()).toEqual([]);

      source$.next('b');
      expect(observeCaptor1.getValues()).toEqual([]);

      // close the buffer by emitting, not completing.
      closingNotifier$.next();
      expect(observeCaptor1.getValues()).toEqual(['a', 'b']);

      source$.next('c');
      expect(observeCaptor1.getValues()).toEqual(['a', 'b', 'c']);

      // Subscribe captor 2.
      const observeCaptor2 = new ObserveCaptor();
      const subscription2 = testee$.subscribe(observeCaptor2);
      expect(observeCaptor2.getValues()).toEqual([]);

      source$.next('d');
      expect(observeCaptor1.getValues()).toEqual(['a', 'b', 'c', 'd']);
      expect(observeCaptor2.getValues()).toEqual(['d']);

      // Unsubscribe captor 1.
      subscription1.unsubscribe();

      source$.next('e');
      expect(observeCaptor1.getValues()).toEqual(['a', 'b', 'c', 'd']);
      expect(observeCaptor2.getValues()).toEqual(['d', 'e']);

      // Unsubscribe captor 2.
      subscription2.unsubscribe();

      source$.next('f');
      expect(observeCaptor1.getValues()).toEqual(['a', 'b', 'c', 'd']);
      expect(observeCaptor2.getValues()).toEqual(['d', 'e']);

      // Subscribe captor 3.
      const observeCaptor3 = new ObserveCaptor();
      testee$.subscribe(observeCaptor3);
      expect(observeCaptor3.getValues()).toEqual([]);

      source$.next('g');
      expect(observeCaptor1.getValues()).toEqual(['a', 'b', 'c', 'd']);
      expect(observeCaptor2.getValues()).toEqual(['d', 'e']);
      expect(observeCaptor3.getValues()).toEqual(['g']);
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
      resolvePromiseFn!();
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
