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
 * Runs the given function, catching and logging any thrown error.
 */
export function runSafe<T>(fn: () => T): T | void;
/**
 * Runs the given function, and if it throws, catches the error and delegates execution to the given error handler, returning the handler's result.
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
      console.error('An unexpected error occurred.', error);
    }
  }
}
