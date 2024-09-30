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
 * Wraps the native {@link ResizeObserver} in an RxJS Observable to observe resizing of an element.
 *
 * Upon subscription, emits the current size, and then continuously when the size changes. The Observable never completes.
 *
 * For more details, see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver.
 *
 * @param element - Specifies the element to observe.
 * @param options - Configures {@link ResizeObserver}.
 *                  For more details, see https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver.
 */
export function fromResize$(element: Element, options?: ResizeObserverOptions): Observable<ResizeObserverEntry[]> {
  return new Observable(observer => {
    const resizeObserver = new ResizeObserver(entries => observer.next(entries));
    resizeObserver.observe(element, options);
    return () => resizeObserver.disconnect();
  });
}
