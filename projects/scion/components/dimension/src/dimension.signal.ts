/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, assertNotInReactiveContext, computed, DestroyRef, effect, ElementRef, inject, Injector, isSignal, signal, Signal} from '@angular/core';
import {SciDimension} from './dimension';
import {coerceElement} from '@angular/cdk/coercion';
import {Objects} from '@scion/toolkit/util';

/**
 * Creates a signal to observe the size of an element.
 *
 * The element can be passed as a signal, useful for observing a view child as view children cannot be read in the constructor.
 *
 * The signal uses to the native {@link ResizeObserver} to monitor element size changes. Destroying the injection context will unsubscribe from {@link ResizeObserver}.
 *
 * Usage:
 * - Must be called within an injection context or with an injector provided for automatic unsubscription.
 * - Must NOT be called within a reactive context to avoid repeated subscriptions.
 */
export function dimension(elementLike: HTMLElement | ElementRef<HTMLElement> | Signal<HTMLElement | ElementRef<HTMLElement>>, options?: {injector?: Injector}): Signal<SciDimension>;
export function dimension(elementLike: HTMLElement | ElementRef<HTMLElement> | Signal<HTMLElement | ElementRef<HTMLElement> | undefined>, options?: {injector?: Injector}): Signal<SciDimension | undefined>;
export function dimension(elementLike: HTMLElement | ElementRef<HTMLElement> | Signal<HTMLElement | ElementRef<HTMLElement> | undefined>, options?: {injector?: Injector}): Signal<SciDimension | undefined> {
  assertNotInReactiveContext(dimension, 'Invoking `dimension` causes new subscriptions every time. Move `dimension` outside of the reactive context and read the signal value where needed.');
  if (!options?.injector) {
    assertInInjectionContext(dimension);
  }

  const injector = options?.injector ?? inject(Injector);
  const element = computed(() => coerceElement(isSignal(elementLike) ? elementLike() : elementLike));
  const onResize = signal<void>(undefined, {equal: () => false});

  // Signal 'onResize' when the element size changes.
  // Note: Run callback in animation frame to avoid the error: "ResizeObserver loop completed with undelivered notifications".
  const resizeObserver = new ResizeObserver(() => requestAnimationFrame(() => onResize.set()));
  injector.get(DestroyRef).onDestroy(() => resizeObserver.disconnect());

  // Connnect to the element.
  effect(onCleanup => {
    const el = element();
    if (el) {
      resizeObserver.observe(el);
      onCleanup(() => resizeObserver.unobserve(el));
    }
  }, {injector});

  return computed(() => {
    const el = element();
    if (!el) {
      return undefined;
    }

    // Track when the element is resized.
    onResize();

    return {
      clientWidth: el.clientWidth,
      offsetWidth: el.offsetWidth,
      clientHeight: el.clientHeight,
      offsetHeight: el.offsetHeight,
      element: el,
    };
  }, {equal: Objects.isEqual});
}
