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
 * Wraps the native {@link MutationObserver} in an RxJS Observable to observe mutations of an element.
 *
 * For more details, see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver.
 *
 * @param element - Specifies the element to observe.
 * @param options - Configures {@link MutationObserver}.
 *                  For more details, see https://developer.mozilla.org/en-US/docs/Web/API/MutationObserverInit.
 */
export function fromMutation$(element: Node, options?: MutationObserverInit): Observable<MutationRecord[]> {
  return new Observable(observer => {
    const mutationObserver = new MutationObserver((mutations: MutationRecord[]): void => observer.next(mutations));
    mutationObserver.observe(element, options);
    return () => mutationObserver.disconnect();
  });
}
