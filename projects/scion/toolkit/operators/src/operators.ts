/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {catchError, defaultIfEmpty, distinctUntilChanged, map, mergeMap, share, switchMap, take} from 'rxjs/operators';
import {combineLatest, concat, EMPTY, from, identity, MonoTypeOperatorFunction, Observable, Observer, of, OperatorFunction, pipe, ReplaySubject, SchedulerLike, takeUntil, TeardownLogic} from 'rxjs';
import {Arrays, Observables} from '@scion/toolkit/util';

/**
 * Filters items in the source array and emits an array with items satisfying given predicate.
 *
 * - If passing `undefined` as predicate, the filter matches all items.
 * - If passing an asynchronous predicate:
 *   - Waits for all predicates to emit at least once or to complete.
 *     TIP: If you want to emit as soon as a predicate emits, use the `startWith(false)` operator in combination with
 *     the `skip` operator. Consequently, there will be a separate emission per item, in the order in which predicates
 *     emit.
 *
 *     ```ts
 *     source$
 *       .pipe(
 *         filterArray(item => matchesItem$(item).pipe(startWith(false))), // make the predicate immediately emit `false`
 *         skip(1), // skip initial emission caused by `startWith(false)`.
 *       )
 *       .subscribe(items => {});
 *     ```
 *   - Continues filtering the source Observable even if some predicate complete without first emission. Such items are not included in the emission.
 *   - Continues filtering the source Observable even if some predicate error. Such items are not included in the emission and the error is not propagated.
 */
export function filterArray<T, S extends T>(predicate?: (item: T) => item is S): OperatorFunction<T[] | readonly T[], S[]>;
export function filterArray<T>(predicate?: (item: T) => Observable<boolean> | Promise<boolean> | boolean): OperatorFunction<T[] | readonly T[], T[]>;
export function filterArray<T>(predicate?: (item: T) => Observable<boolean> | Promise<boolean> | boolean): OperatorFunction<T[] | readonly T[], T[]> {
  if (!predicate) {
    return source$ => source$ as Observable<T[]>;
  }

  return switchMap((items: T[] | readonly T[]): Observable<T[]> => {
    if (!items.length) {
      return of([]);
    }

    // Filter items if all predicates return a boolean value.
    const matches = items.map(predicate);
    if (matches.every(match => typeof match === 'boolean')) {
      return of(items.filter((item, i) => matches[i]));
    }

    /*
     * Notes about `combineLatest` operator:
     * - Passing an empty array will result in an Observable that completes immediately.
     * - Waits for all Observables to emit at least once.
     * - If some Observable does not emit a value but completes, resulting Observable will complete at the same moment without emitting anything.
     * - If some Observable does not emit any value and never completes, `combineLatest` will also never emit and never complete.
     * - If any Observable errors, `combineLatest` will error immediately as well, and all other Observables will be unsubscribed.
     */
    return combineLatest(matches.map(match => Observables.coerce(match).pipe(defaultIfEmpty(false), catchError(() => of(false)))))
      .pipe(
        distinctUntilChanged((previous, current) => Arrays.isEqual(previous, current)),
        map(matches => items.filter((item, i) => matches[i])),
      );
  });
}

/**
 * Maps each element in the source array to its mapped value.
 */
export function mapArray<I, P>(projectFn: (item: I) => P): OperatorFunction<I[] | readonly I[], P[]> {
  return map((items: I[] | readonly I[]): P[] => items.map(item => projectFn(item)));
}

/**
 * Sorts items in the source array and emits an array with those items sorted.
 */

export function sortArray<T>(comparator: (item1: T, item2: T) => number): OperatorFunction<T[] | readonly T[], T[]> {
  return map((items: T[] | readonly T[]): T[] => [...items].sort(comparator));
}

/**
 * Combines the Observables contained in the source array by applying {@link combineLatest}, emitting an array with the latest
 * value of each Observable of the source array. Combines only the Observables of the most recently emitted array.
 *
 * <span class=“informal”>Each time the source emits an array of Observables, combines its Observables by subscribing to each
 * of them, cancelling any subscription of a previous source emission.</span>
 */
export function combineArray<T>(): OperatorFunction<Array<Observable<T[]>>, T[]> {
  return pipe(
    switchMap((items: Array<Observable<T[]>>) => items.length ? combineLatest(items) : of([])),
    map((items: Array<T[]>) => new Array<T>().concat(...items)),
  );
}

/**
 * Removes duplicates of elements in the source array.
 *
 * <span class=“informal”>Each time the source emits, maps the array to a new array with duplicates removed.</span>
 */
export function distinctArray<T>(keySelector: (item: T) => any = identity): OperatorFunction<T[] | readonly T[], T[]> {
  return pipe(map((items: T[] | readonly T[]): T[] => Arrays.distinct(items, keySelector)));
}

/**
 * Buffers the source Observable values until `closingNotifier$` notifier resolves, emits or completes.
 *
 * Once closed the buffer, emits its buffered values as a separate emission per buffered value, in the
 * order as collected. After that, this operator mirrors the source Observable, i.e., emits values as they
 * arrive.
 *
 * Unlike {@link bufferWhen} RxJS operator, the buffer is not re-opened once closed.
 *
 * @param closingNotifier$ Closes the buffer when the passed Promise resolves, or when the passed Observable
 *                         emits or completes.
 */
export function bufferUntil<T>(closingNotifier$: Observable<any> | Promise<any>): MonoTypeOperatorFunction<T> {
  const guard$ = from(closingNotifier$)
    .pipe(
      take(1),
      mergeMap(() => EMPTY),
      share({resetOnComplete: false, resetOnError: false, resetOnRefCountZero: false}),
    );
  return mergeMap((item: T) => concat(guard$, of(item)));
}

/**
 * Executes a tap-function for the first percolating value.
 */
export function tapFirst<T>(tapFn: (value?: T) => void, scheduler?: SchedulerLike): MonoTypeOperatorFunction<T> {
  return map((value: T, index: number): T => {
    if (index === 0) {
      scheduler ? scheduler.schedule(tapFn) : tapFn(value);
    }
    return value;
  });
}

/**
 * Mirrors the source observable, running downstream operators (operators after the `observeIn` operator) and subscription handlers
 * (next, error, complete) in the given function.
 *
 * This operator is similar to RxJS's {@link observeOn} operator, but instead of a scheduler, it accepts a function.
 * The function is invoked each time the source emits, errors or completes and must call the provided `doContinue` function
 * to continue.
 *
 * Use this operator to set up a context for downstream operators, such as inside or outside the Angular zone.
 *
 * **Usage**
 *
 * The following example runs downstream operators inside Angular:
 *
 * ```ts
 * // Code running outside the Angular zone.
 * const zone = inject(NgZone);
 *
 * interval(1000)
 *   .pipe(
 *     tap(() => ...), // runs outside Angular
 *     observeIn(doContinue => zone.run(doContinue)),
 *     tap(() => ...), // runs inside Angular
 *   )
 *   .subscribe(() => ...); // runs inside Angular
 * ```
 *
 * @param fn - A function to set up the execution context. The function must call the provided `doContinue` function to continue.
 * @return An Observable that mirrors the source, but with downstream operators executed in the provided function.
 */
export function observeIn<T>(fn: (doContinue: () => void) => void): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => {
    return new Observable((observer: Observer<T>): TeardownLogic => {
      const subscription = source.subscribe({
        next: next => fn(() => observer.next(next)),
        error: error => fn(() => observer.error(error)),
        complete: () => fn(() => observer.complete()),
      });

      return () => subscription.unsubscribe();
    });
  };
}

/**
 * Mirrors the source observable, subscribing to the source in the given function.
 *
 * This operator is similar to RxJS's {@link subscribeOn} operator, but instead of a scheduler, it accepts a function.
 * The function is invoked when subscribing to the source and must call the provided `doSubscribe` function to subscribe.
 *
 * Use this operator to set up a context for the subscription, such as inside or outside the Angular zone.
 *
 * **Usage**
 *
 * The following example illustrates subscribing outside Angular:
 *
 * ```ts
 * // Code running inside the Angular zone.
 * const zone = inject(NgZone);
 *
 * interval(1000)
 *   .pipe(subscribeIn(doSubscribe => zone.runOutsideAngular(doSubscribe)))
 *   .subscribe(() => ...);
 * ```
 *
 * @param fn - A function to set up the subscription context. The function must call the provided `doSubscribe` function to subscribe.
 * @return An Observable that mirrors the source, but with the subscription executed in the provided function.
 */
export function subscribeIn<T>(fn: (doSubscribe: () => void) => void): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => {
    return new Observable((observer: Observer<T>): TeardownLogic => {
      const unsubscribe$ = new ReplaySubject<void>(1);
      fn(() => source.pipe(takeUntil(unsubscribe$)).subscribe(observer));
      return () => unsubscribe$.next();
    });
  };
}
