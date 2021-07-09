/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {fromEvent, merge, Observable, of, OperatorFunction, pipe} from 'rxjs';
import {auditTime, distinctUntilChanged, map, mapTo, startWith, switchMap} from 'rxjs/operators';
import {fromMutation$} from './mutation.observable';
import {fromDimension$} from './dimension.observable';

/**
 * Allows observing an element's bounding box, providing information about the element's size and position relative to the
 * browser viewport. Refer to https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect for more information.
 *
 * Upon subscription, the Observable emits the element's current bounding box, and then continuously emits when its
 * bounding box changes, e.g., due to a change in the layout. The Observable never completes.
 *
 * ***
 * If you are only interested in element size changes and not position changes, consider using the {@link fromDimension$} Observable
 * as it is more efficient because natively supported by the browser.
 * ***
 *
 * ### Note on the detection of position changes:
 *
 * The Observable uses a relatively simple approach to detecting element position changes. It assumes the browser to support the
 * native {ResizeObserver} API or logs a warning otherwise.
 *
 * There is, unfortunately, no native browser API to detect position changes of an element in a performant and reliable way.
 * Our approach to detecting position changes of an element is based on the premise that it usually involves a parent or a parent's
 * direct child changing in size. Repositioning can further occur when the user scrolls a parent container or when elements are added
 * to or removed from the DOM. This covers most cases, but not all.
 *
 * We are aware that this approach can be quite expensive, mainly because potentially a large number of elements need to be monitored
 * for resizing/scrolling. Therefore, use this Observable only if you need to be informed about position changes. For pure dimension
 * changes use the {@link fromDimension$} Observable instead.
 *
 * @see fromDimension$
 */
export function fromBoundingClientRect$(element: HTMLElement): Observable<ClientRect> {
  if (!supportsNativeResizeObserver()) {
    console?.warn('Cannot monitor the element\'s bounding box as it requires the browser to have native {ResizeObserver} support.');
    return of(captureClientRect(element));
  }

  return fromMutation$(document.body, {childList: true, subtree: true})
    .pipe(
      map(() => collectElements(element)),
      startWith(collectElements(element)),
      detectLayoutChange(),
      map(() => captureClientRect(element)),
      distinctUntilChanged((a, b) => a.left === b.left && a.top === b.top && a.width === b.width && a.height === b.height),
    );
}

/**
 * Collects elements that can affect the given element's size and position.
 */
function collectElements(element: HTMLElement): HTMLElement[] {
  const elements: HTMLElement[] = [];

  for (let el = element.parentElement; el !== null; el = el.parentElement) {
    elements.push(...Array.from(el.children).filter(child => child instanceof HTMLElement) as HTMLElement[]);
  }
  return elements;
}

/**
 * Emits whenever one of the source elements changes in size or scrolls.
 */
function detectLayoutChange(): OperatorFunction<HTMLElement[], void> {
  return pipe(
    switchMap(elements => merge(...elements.map(element => merge(
      fromDimension$(element, {useNativeResizeObserver: true}),
      fromEvent(element, 'scroll', {passive: true})),
    ))),
    mapTo(undefined),
    // Debounce to a single emission as a layout change can cause multiple elements to change.
    auditTime(25),
  );
}

function captureClientRect(element: HTMLElement): ClientRect {
  const {top, right, bottom, left, width, height} = element.getBoundingClientRect();
  return {top, right, bottom, left, width, height};
}

function supportsNativeResizeObserver(): boolean {
  return 'ResizeObserver' in window;
}
