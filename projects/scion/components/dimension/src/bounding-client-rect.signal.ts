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
import {coerceElement} from '@angular/cdk/coercion';
import {fromBoundingClientRect$} from '@scion/toolkit/observable';
import {subscribeIn} from '@scion/toolkit/operators';

/**
 * Creates a signal observing the bounding box of an element.
 *
 * The bounding box includes the element's position relative to the top-left of the viewport and its size.
 * Refer to https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect for more details.
 *
 * The element can be passed as a signal, enabling observation of view children in the component constructor.
 *
 * There is no native browser API to observe the position of an element. The signal uses {@link IntersectionObserver} and
 * {@link ResizeObserver} to detect position changes. For tracking only size changes, use the {@link dimension} signal instead.
 *
 * Usage:
 * - Must be called within an injection context or an injector provided. Destroying the injector will unsubscribe the signal.
 * - Must not be called within a reactive context to avoid repeated subscriptions.
 * - The element and the document root (`<html>`) must be positioned `relative` or `absolute`. If not, a warning is logged, and positioning changed to `relative`.
 */
export function boundingClientRect(elementLike: HTMLElement | ElementRef<HTMLElement> | Signal<HTMLElement | ElementRef<HTMLElement>>, options?: {injector?: Injector}): Signal<DOMRect>;
export function boundingClientRect(elementLike: HTMLElement | ElementRef<HTMLElement> | Signal<HTMLElement | ElementRef<HTMLElement> | undefined>, options?: {injector?: Injector}): Signal<DOMRect | undefined>;
export function boundingClientRect(elementLike: HTMLElement | ElementRef<HTMLElement> | Signal<HTMLElement | ElementRef<HTMLElement> | undefined>, options?: {injector?: Injector}): Signal<DOMRect | undefined> {
  assertNotInReactiveContext(boundingClientRect, 'Invoking `boundingClientRect` causes new subscriptions every time. Move `boundingClientRect` outside of the reactive context and read the signal value where needed.');
  if (!options?.injector) {
    assertInInjectionContext(boundingClientRect);
  }

  const injector = options?.injector ?? inject(Injector);
  const zone = injector.get(NgZone);
  const element = computed(() => coerceElement(isSignal(elementLike) ? elementLike() : elementLike));
  const onBoundingBoxChange = signal<void>(undefined, {equal: () => false});

  // Subscribe to element bounding box changes.
  effect(onCleanup => {
    const el = element();
    if (!el) {
      return;
    }

    untracked(() => {
      const subscription = fromBoundingClientRect$(el)
        // Avoid triggering change detection cycle.
        .pipe(subscribeIn(fn => zone.runOutsideAngular(fn)))
        .subscribe(() => {
          NgZone.assertNotInAngularZone();
          onBoundingBoxChange.set();
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }, {injector});

  // Create signal that recomputes each time the bounding box changes.
  return computed(() => {
    const el = element();
    if (!el) {
      return undefined;
    }

    // Track bounding box.
    onBoundingBoxChange();

    return el.getBoundingClientRect();
  }, {equal: isEqualDomRect});
}

function isEqualDomRect(a: DOMRect | undefined, b: DOMRect | undefined): boolean {
  return a?.top === b?.top && a?.right === b?.right && a?.bottom === b?.bottom && a?.left === b?.left;
}
