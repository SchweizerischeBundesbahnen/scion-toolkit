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
import {combineLatest, concat, EMPTY, from, identity, MonoTypeOperatorFunction, noop, Observable, Observer, of, OperatorFunction, pipe, SchedulerLike, Subscriber, Subscription, TeardownLogic} from 'rxjs';
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
export function filterArray<T, S extends T>(predicate?: (item: T) => item is S): OperatorFunction<T[], S[]>;
export function filterArray<T>(predicate?: (item: T) => Observable<boolean> | Promise<boolean> | boolean): MonoTypeOperatorFunction<T[]>;
export function filterArray<T>(predicate?: (item: T) => Observable<boolean> | Promise<boolean> | boolean): MonoTypeOperatorFunction<T[]> {
  if (!predicate) {
    return identity;
  }

  return switchMap((items: T[]): Observable<T[]> => {
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
 * Maps each element in the source array to its extracted property.
 *
 * Like rxjs 'pluck' but based on an array with a function to extract the property.
 *
 * @deprecated since version 10.0.0-beta.3. Use {@link mapArray} instead.
 */
export function pluckArray<I, P>(extractor: (item: I) => P): OperatorFunction<I[], P[]> {
  return map((items: I[]): P[] => items.map(item => extractor(item)));
}

/**
 * Maps each element in the source array to its mapped value.
 */
export function mapArray<I, P>(projectFn: (item: I) => P): OperatorFunction<I[], P[]> {
  return map((items: I[]): P[] => items.map(item => projectFn(item)));
}

/**
 * Sorts items in the source array and emits an array with those items sorted.
 */
export function sortArray<T>(comparator: (item1: T, item2: T) => number): MonoTypeOperatorFunction<T[]> {
  return map((items: T[]): T[] => [...items].sort(comparator));
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
export function distinctArray<T>(keySelector: (item: T) => any = identity): MonoTypeOperatorFunction<T[]> {
  return pipe(map((items: T[]): T[] => Arrays.distinct(items, keySelector)));
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
  return map(((value: T, index: number): T => {
    if (index === 0) {
      scheduler ? scheduler.schedule(tapFn) : tapFn(value);
    }
    return value;
  }));
}

/**
 * Mirrors the source Observable, but runs downstream operators (operators below the `observeInside` operator) and subscription handlers
 * (next, error, complete) inside the given execution context.
 *
 * This operator is particularly useful in Angular applications to run downstream operators inside or outside the Angular zone,
 * as following: `observeInside(continueFn => ngzone.run(continueFn))`.
 *
 * This operator is similar to RxJS's `observeOn` operator, but instead of a scheduler, it accepts an executor. An executor is a function to
 * create an execution context in which downstream operators are then executed. The function is called with a single argument, a function
 * to continue the execution chain.
 *
 * #### Example showing in which Angular zone operators run:
 * ```
 * // Code running outside Angular
 *
 * interval(1000) // Observable creation outside Angular
 *   .pipe(
 *     tap(() => ...), // outside Angular
 *     tap(() => ...), // outside Angular
 *     observeInside(continueFn => zone.run(continueFn)),
 *     tap(() => ...), // inside Angular
 *   )
 *   .subscribe(); // inside Angular
 * ```
 *
 * @param   executionFn - Function for setting up a context in which to continue the execution chain.
 * @return  An Observable mirroring the source, but running downstream operators in a context.
 */
export function observeInside<T>(executionFn: ExecutionFn): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => {
    return new Observable((observer: Observer<T>): TeardownLogic => {
      const subscription = source.subscribe({
        next: next => executionFn(() => observer.next(next)),
        error: error => executionFn(() => observer.error(error)),
        complete: () => executionFn(() => observer.complete()),
      });

      return () => subscription.unsubscribe();
    });
  };
}

/**
 * Mirrors the source Observable, but uses the given execution context to subscribe/unsubscribe to the source. It further runs all operators of the
 * execution chain (operators above and below the `subscribeInside` operator) as well as subscription handlers (next, error, complete) in the given
 * context.
 *
 * Unlike `observeInside` operator, the `subscribeInside` also acts upstream. By using the {@link observeInside} operator after the
 * {@link subscribeInside}, you can change the execution context for downstream operators.
 *
 * This operator is particularly useful in Angular applications to subscribe to the source inside or outside the Angular zone, as following:
 * `subscribeInside(continueFn => ngzone.run(continueFn))`.
 *
 * This operator is similar to RxJS's `subscribeOn` operator, but instead of a scheduler, it accepts an executor. An executor is a function to
 * create an execution context in which upstream and downstream operators are then executed. The function is called with a single argument,
 * a function to continue the execution chain.
 *
 * #### Example showing in which Angular zone operators run:
 * ```
 * // Code running outside Angular
 *
 * interval(1000) // Observable creation inside Angular
 *   .pipe(
 *     tap(() => ...), // inside Angular
 *     tap(() => ...), // inside Angular
 *     subscribeInside(continueFn => zone.run(continueFn)),
 *     tap(() => ...), // inside Angular
 *   )
 *   .subscribe(); // inside Angular
 * ```
 *
 * @param   executionFn - Function for setting up a context in which to continue the execution chain.
 * @return  An Observable mirroring the source, but running upstream and downstream operators in a context.
 */
export function subscribeInside<T>(executionFn: ExecutionFn): MonoTypeOperatorFunction<T> {
  return (source: Observable<T>): Observable<T> => {
    return new Observable((observer: Observer<T>): TeardownLogic => {
      let subscription: Subscription;

      executionFn(() => {
        subscription = source.subscribe(new class extends Subscriber<T> {

          constructor() {
            super(observer);
          }

          protected override _next(value: T): void {
            executionFn(() => super._next(value));
          }

          protected override _error(err: any): void {
            executionFn(() => super._error(err));
          }

          protected override _complete(): void {
            executionFn(() => super._complete());
          }

          public override unsubscribe(): void {
            executionFn(() => this.closed ? noop() : super.unsubscribe());
          }
        });
      });

      return () => {
        executionFn(() => subscription?.unsubscribe());
      };
    });
  };
}

/**
 * Function to continue the operator chain.
 *
 * @see observeInside
 * @see subscribeInside
 */
export type ContinueExecutionFn = () => void;

/**
 * Function for setting up a context in which to continue the execution chain.
 *
 * @see observeInside
 * @see subscribeInside
 */
export type ExecutionFn = (fn: ContinueExecutionFn) => void;
