/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Signal, untracked} from '@angular/core';
import {MaybeSignal} from '@scion/components/common';
import {text, Translatable} from '@scion/components/text';

/**
 * Translates the given {@link Translatable}, passed as string or Signal.
 */
export function translate(translatable: MaybeSignal<Translatable>): Signal<Translatable>;
export function translate(translatable: MaybeSignal<Translatable> | undefined): Signal<Translatable> | undefined;
export function translate(translatable: MaybeSignal<Translatable> | undefined): Signal<Translatable> | undefined {
  return translatable !== undefined ? untracked(() => text(translatable)) : undefined;
}
