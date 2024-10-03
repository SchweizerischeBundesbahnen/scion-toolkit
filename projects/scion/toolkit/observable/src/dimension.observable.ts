/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Observable, Observer, TeardownLogic} from 'rxjs';

/**
 * Allows observing the dimension of an element. Upon subscription, it emits the element's dimension, and then continuously
 * emits when the dimension of the element changes. It never completes.
 *
 * The Observable uses the native `ResizeObserver` to detect size changes of the passed element.
 *
 * @param  target - HTMLElement to observe its dimension.
 * @return Observable that emits dimension changes of the passed element.
 *
 * @deprecated since version 1.5.0; use `fromResize$` instead; API will be removed in version 2.0.
 */
export function fromDimension$(target: HTMLElement): Observable<Dimension> {
  return new Observable((observer: Observer<Dimension>): TeardownLogic => {
    const resizeObserver = new ResizeObserver(() => observer.next(captureElementDimension(target)));
    resizeObserver.observe(target); // emits the current dimension directly upon subscription

    return (): void => {
      resizeObserver.disconnect();
    };
  });
}

/**
 * Captures the dimension of the given element.
 *
 * @deprecated since version 1.5.0; use {@link HTMLElement.getBoundingClientRect} instead; API will be removed in version 2.0.
 */
export function captureElementDimension(element: HTMLElement): Dimension {
  return {
    clientWidth: element.clientWidth,
    offsetWidth: element.offsetWidth,
    clientHeight: element.clientHeight,
    offsetHeight: element.offsetHeight,
    element,
  };
}

/**
 * Represents the dimension of an element.
 */
export interface Dimension {
  offsetWidth: number;
  offsetHeight: number;
  clientWidth: number;
  clientHeight: number;
  element: HTMLElement;
}
