/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {isSignal, signal, Signal} from '@angular/core';
import {firstValueFrom, from, isObservable, Observable, of} from 'rxjs';

export type MaybeSignal<T> = T | Signal<T>;
export function coerceSignal<T>(value: MaybeSignal<T>): Signal<T>;
export function coerceSignal<T>(value: MaybeSignal<T> | undefined): Signal<T> | undefined;
export function coerceSignal<T>(value: MaybeSignal<T> | undefined, options: {defaultValue: T}): Signal<T>;
export function coerceSignal<T>(value: MaybeSignal<T> | undefined, options?: {defaultValue?: T}): Signal<T> | undefined {
  if (value === undefined) {
    return options?.defaultValue !== undefined ? signal(options.defaultValue) : undefined;
  }
  return isSignal(value) ? value : signal(value);
}

export type MaybeAsync<T> = T | Promise<T> | Observable<T>;
export function coerceObservable<T>(input: MaybeAsync<T>): Observable<T> {
  if (input instanceof Promise || isObservable(input)) {
    return from(input);
  }
  return of(input);
}

export function coercePromise<T>(input: MaybeAsync<T>): Promise<T> {
  if (input instanceof Promise) {
    return input;
  }

  if (isObservable(input)) {
    return firstValueFrom(input);
  }

  return Promise.resolve(input);
}

/**
 * CSS clamp for use in a CSS grid.
 */
export function clamp(min: string, preferred: string, max: string | null): string {
  const maxDef = max === null ? preferred : `min(${preferred}, ${max})`;
  return `minmax(${min}, ${maxDef})`;
}

export function rangeInclusive(start: number, end: number): number[] {
  const range: number[] = [];
  for (let i = start; i <= end; i++) {
    range.push(i);
  }
  return range;
}
