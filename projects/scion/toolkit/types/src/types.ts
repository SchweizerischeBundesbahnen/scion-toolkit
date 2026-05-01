/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Observable} from 'rxjs';

/**
 * Requires at least one key from T.
 */
export type RequireOne<T> = {
  [K in keyof T]: Required<Pick<T, K>> & Partial<Omit<T, K>>
}[keyof T];

/**
 * Allows maximum one property of T.
 */
export type OneOf<T> = {
  [K in keyof T]: {[P in K]: T[P]} & {[P in Exclude<keyof T, K>]?: never};
}[keyof T];

/**
 * Represents a value or an array of that value.
 */
export type MaybeArray<T> = T | T[];

export type MaybeObservable<T> = T | Observable<T>;

/**
 * Represents an object that can be disposed of to free up resources.
 */
export interface Disposable {
  /**
   * Disposes of the object, releasing any allocated resources.
   */
  dispose(): void;
}

/**
 * Signature of a function to clean up allocated resources.
 */
export type DisposeFn = () => void;
