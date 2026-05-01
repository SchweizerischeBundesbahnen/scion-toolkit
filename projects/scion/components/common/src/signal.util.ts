/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {effect, inject, Injector, isSignal, signal, Signal, untracked} from '@angular/core';
import {Observable, of} from 'rxjs';

export function coerceSignal<T>(value: MaybeSignal<NonNullable<T>>): Signal<NonNullable<T>>;
export function coerceSignal<T>(value: MaybeSignal<T> | undefined): Signal<NonNullable<T>> | undefined;
export function coerceSignal<T>(value: MaybeSignal<T> | undefined, options: {defaultValue: T}): Signal<T>;
export function coerceSignal<T>(value: MaybeSignal<T> | undefined, options?: {defaultValue?: T}): Signal<T> | undefined {
  if (value === undefined) {
    return options?.defaultValue !== undefined ? signal(options.defaultValue) : undefined;
  }
  return isSignal(value) ? value : signal(value);
}

/**
 * Represents a value or a {@link Signal} of that value.
 */
export type MaybeSignal<T> = T | Signal<T>;

/**
 * Like {@link toSignal}, but lazily creates the effect upon subscription, binding it to the subscription lifecycle instead of the injection context, plus, emits the signal's initial value synchronously.
 */
export function toLazyObservable<T>(signal: MaybeSignal<NonNullable<T>>, options?: {injector?: Injector}): Observable<NonNullable<T>>;
export function toLazyObservable<T>(signal: MaybeSignal<NonNullable<T>> | undefined, options?: {injector?: Injector}): Observable<NonNullable<T>> | undefined;
export function toLazyObservable<T>(signal: MaybeSignal<NonNullable<T>> | undefined, options?: {injector?: Injector}): Observable<NonNullable<T>> | undefined {
  if (signal === undefined) {
    return undefined;
  }
  if (!isSignal(signal)) {
    return of(signal);
  }

  const injector = options?.injector ?? inject(Injector);
  return new Observable(observer => {
    const initialValue = signal();
    let isFirstEffectRun = true;

    // Emit initial value synchronously.
    observer.next(initialValue);

    const effectRef = effect(() => {
      const value = signal();

      untracked(() => {
        if (!isFirstEffectRun || initialValue !== value) {
          observer.next(value);
        }
        isFirstEffectRun = false;
      });
    }, {injector, manualCleanup: true});

    return () => effectRef.destroy();
  });
}
