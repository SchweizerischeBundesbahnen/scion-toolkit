/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

/**
 * Runs the passed function, catching and logging any thrown error.
 */
export function runSafe<T>(fn: () => T): T | void;
/**
 * Runs the passed function.
 *
 * If the function throws an error, catches the error and delegates execution to the passed error handler, returning the handler's result.
 */
export function runSafe<T>(fn: () => T, onErrorFn: (error: unknown) => T): T;
export function runSafe<T>(fn: () => T, onErrorFn?: (error: unknown) => T): T | void {
  try {
    return fn();
  }
  catch (error) {
    if (onErrorFn) {
      return onErrorFn(error);
    }
    else {
      console.error('[UnexpectedError] An unexpected error occurred.', error);
    }
  }
}
