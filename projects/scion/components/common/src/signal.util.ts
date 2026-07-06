/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {isSignal, signal, Signal} from '@angular/core';

/**
 * Represents a value or a {@link Signal} of that value.
 */
export type MaybeSignal<T> = T | Signal<T>;

/**
 * Coerces the given value into a {@link Signal}. If the value is already a signal, it is returned as-is; otherwise, it is wrapped in a signal.
 *
 * Passing `undefined` returns `undefined`, unless the option `coerceUndefined` is set to `true`.
 *
 * @param value - Specifies the value to coerece.
 */
export function coerceSignal<T extends MaybeSignal<unknown>>(value: T): T extends Signal<unknown> ? T : T extends undefined ? undefined : Signal<T>;
/**
 * Coerces the given value into a {@link Signal}. If the value is already a signal, it is returned as-is; otherwise, it is wrapped in a signal.
 *
 * @param value - Specifies the value to coerece.
 * @param options - Controls coercion.
 * @param options.coerceUndefined - If `true`, returns `signal(undefined)` for a `undefined` value. Defaults to `false`.
 */
export function coerceSignal<T>(value: MaybeSignal<T> | undefined, options: {coerceUndefined: true}): Signal<T | undefined>;

export function coerceSignal<T>(value: MaybeSignal<T>, options?: {coerceUndefined?: true}): Signal<T> | undefined {
  if (value === undefined && !options?.coerceUndefined) {
    return undefined;
  }
  return isSignal(value) ? value : signal(value);
}
