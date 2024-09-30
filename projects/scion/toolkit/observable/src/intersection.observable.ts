/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Observable} from 'rxjs';

/**
 * Wraps the native {@link IntersectionObserver} in an RxJS Observable to observe intersection of an element.
 *
 * Upon subscription, emits the current intersection state, and then continuously when the intersection state changes. The Observable never completes.
 *
 * For more details, see https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API.
 *
 * @param element - Specifies the element to observe.
 * @param options - Configures {@link IntersectionObserver}.
 *                  For more details, see https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API.
 */
export function fromIntersection$(element: Element, options?: IntersectionObserverInit): Observable<IntersectionObserverEntry[]> {
  return new Observable(observer => {
    const intersectionObserver = new IntersectionObserver(entries => observer.next(entries), options);
    intersectionObserver.observe(element);
    return () => intersectionObserver.disconnect();
  });
}
