/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, assertNotInReactiveContext, computed, effect, ElementRef, inject, Injector, isSignal, NgZone, signal, Signal, untracked} from '@angular/core';
import {SciDimension} from './dimension';
import {coerceElement} from '@angular/cdk/coercion';
import {Objects} from '@scion/toolkit/util';
import {fromResize$} from '@scion/toolkit/observable';
import {animationFrameScheduler, observeOn} from 'rxjs';
import {subscribeInside} from '@scion/toolkit/operators';

/**
 * Creates a signal observing the size of an element.
 *
 * The element can be passed as a signal, enabling observation of view children in the component constructor.
 *
 * The signal subscribes to the native {@link ResizeObserver} to monitor element size changes. Destroying the injection context will unsubscribe the observer.
 *
 * Usage:
 * - Must be called within an injection context or an injector provided. Destroying the injector will unsubscribe the signal.
 * - Must not be called within a reactive context to avoid repeated subscriptions.
 */
export function dimension(elementLike: HTMLElement | ElementRef<HTMLElement> | Signal<HTMLElement | ElementRef<HTMLElement>>, options?: {injector?: Injector}): Signal<SciDimension>;
export function dimension(elementLike: HTMLElement | ElementRef<HTMLElement> | Signal<HTMLElement | ElementRef<HTMLElement> | undefined>, options?: {injector?: Injector}): Signal<SciDimension | undefined>;
export function dimension(elementLike: HTMLElement | ElementRef<HTMLElement> | Signal<HTMLElement | ElementRef<HTMLElement> | undefined>, options?: {injector?: Injector}): Signal<SciDimension | undefined> {
  assertNotInReactiveContext(dimension, 'Invoking `dimension` causes new subscriptions every time. Move `dimension` outside of the reactive context and read the signal value where needed.');
  if (!options?.injector) {
    assertInInjectionContext(dimension);
  }

  const injector = options?.injector ?? inject(Injector);
  const zone = injector.get(NgZone);
  const element = computed(() => coerceElement(isSignal(elementLike) ? elementLike() : elementLike));
  const onResize = signal<void>(undefined, {equal: () => false});

  // Subscribe to element size changes.
  effect(onCleanup => {
    const el = element();
    if (!el) {
      return;
    }

    untracked(() => {
      const subscription = fromResize$(el)
        .pipe(
          subscribeInside(fn => zone.runOutsideAngular(fn)),
          observeOn(animationFrameScheduler), // do not block resize callback (ResizeObserver loop completed with undelivered notifications)
        )
        .subscribe(() => {
          NgZone.assertNotInAngularZone();
          onResize.set();
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }, {injector});

  // Create signal that recomputes each time the size changes.
  return computed(() => {
    const el = element();
    if (!el) {
      return undefined;
    }

    // Track element size.
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
