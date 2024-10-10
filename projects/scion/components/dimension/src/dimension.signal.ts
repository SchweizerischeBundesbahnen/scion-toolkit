/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, assertNotInReactiveContext, DestroyRef, ElementRef, inject, signal, Signal} from '@angular/core';
import {coerceElement} from '@angular/cdk/coercion';
import {SciDimension} from './dimension';

/**
 * Creates a signal to observe the size of an element.
 *
 * The signal subscribes to the native {@link ResizeObserver} to monitor element size changes.
 * The subscription is automatically disposed of when the current context is destroyed.
 *
 * The function:
 * - must be called within an injection context or with a `DestroyRef` passed for automatic unsubscription.
 * - must NOT be called within a reactive context to avoid repeated subscriptions.
 */
export function fromDimension(elementRef: HTMLElement | ElementRef<HTMLElement>, options?: {destroyRef?: DestroyRef}): Signal<SciDimension> {
  assertNotInReactiveContext(fromDimension, 'Invoking `fromDimension` causes new subscriptions every time. Move `fromDimension` outside of the reactive context and read the signal value where needed.');
  if (!options?.destroyRef) {
    assertInInjectionContext(fromDimension);
  }

  const element = coerceElement(elementRef);
  const dimension = signal(getDimension(element));
  // Update signal in animation frame to not block the resize callback (ResizeObserver loop completed with undelivered notifications).
  const resizeObserver = new ResizeObserver(() => requestAnimationFrame(() => dimension.set(getDimension(element))));
  resizeObserver.observe(element);

  const destroyRef = options?.destroyRef ?? inject(DestroyRef);
  destroyRef.onDestroy(() => resizeObserver.disconnect());
  return dimension;
}

function getDimension(element: HTMLElement): SciDimension {
  return {
    clientWidth: element.clientWidth,
    offsetWidth: element.offsetWidth,
    clientHeight: element.clientHeight,
    offsetHeight: element.offsetHeight,
    element: element,
  };
}
