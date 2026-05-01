/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {inject, Signal} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {map} from 'rxjs/operators';
import {toSignal} from '@angular/core/rxjs-interop';

/**
 * Reads specified flag from query parameters.
 */
export function readQueryParamFlag<T>(param: string, options: {transform: (value: string | null) => T}): Signal<T | string | null> {
  const route = inject(ActivatedRoute);
  const flag$ = route.queryParamMap.pipe(map(params => options.transform(params.get(param))));
  return toSignal(flag$, {requireSync: true});
}
