/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, InjectionToken, Provider, Signal} from '@angular/core';
import {coerceSignal, MaybeSignal} from '@scion/components/common';
import {Arrays} from '@scion/toolkit/util';
import {MaybeArray} from '@scion/toolkit/types';

export const SCI_TABLE_ROW_BINDING = new InjectionToken<SciTableRowBinding[]>('SCI_TABLE_ROW_BINDING');

export function provideTableRowBinding<T = unknown>(bindings: MaybeArray<SciTableRowBinding<T>>): Provider[] {
  return Arrays.coerce(bindings).map(binding => {
    return {
      provide: SCI_TABLE_ROW_BINDING,
      useValue: binding,
      multi: true,
    };
  });
}

export function attributeBinding<T>(binding: (item: T, index: number) => MaybeSignal<{[name: string]: unknown | undefined} | undefined>): SciTableRowBinding<T> {
  return new SciTableRowAttributeBinding<T>(binding);
}

export function classBinding<T>(binding: (item: T, index: number) => MaybeSignal<string | string[] | undefined>): SciTableRowBinding<T> {
  return new SciTableRowClassBinding<T>(binding);
}

/**
 * Adds the specified values as part attributes to the row, enabling for custom styling of the row, e.g., based on a condition.
 *
 * Example usage:
 * ```ts
 * table({
 *   name: 'table:persons',
 *   data: persons,
 *   rowBindings: person => ({
 *     part: person.active ? 'row:active' : undefined,
 *   }),
 * }, table => ...);
 * ```
 *
 * ```scss
 * sci-table::part(row\:active) {
 *   background-color: green;
 * }
 * ```
 *
 * Example usage:
 * ```ts
 * table({
 *   name: 'table:persons',
 *   data: persons,
 *   rowBindings: (person, index) => ({
 *     part: index % 2 === 0 ? 'row:even' : 'row:odd',
 *   }),
 * }, table => ...);
 * ```
 *
 * ```scss
 * sci-table::part(row\:even) {
 *   background-color: lightgray;
 * }
 * ```
 */
export function partBinding<T>(binding: (item: T, index: number) => MaybeSignal<`row:${string}` | `row:${string}`[] | undefined>): SciTableRowBinding<T> {
  return new SciTableRowPartBinding<T>(binding);
}

export type SciTableRowBinding<T = unknown> = SciTableRowAttributeBinding<T> | SciTableRowClassBinding<T> | SciTableRowPartBinding<T>;

const SCI_TABLE_ROW_BINDING_TYPE: unique symbol = Symbol('SCI_TABLE_ROW_BINDING_TYPE');

/** @internal */
class SciTableRowAttributeBinding<T> {

  public readonly [SCI_TABLE_ROW_BINDING_TYPE] = 'attribute';

  constructor(public readonly binding: (item: T, index: number) => MaybeSignal<{[name: string]: unknown | undefined} | undefined>) {
  }
}

/** @internal */
class SciTableRowClassBinding<T> {

  public readonly [SCI_TABLE_ROW_BINDING_TYPE] = 'class';

  constructor(public readonly binding: (item: T, index: number) => MaybeSignal<string | string[] | undefined>) {
  }
}

/** @internal */
class SciTableRowPartBinding<T> {

  public readonly [SCI_TABLE_ROW_BINDING_TYPE] = 'part';

  constructor(public readonly binding: (item: T, index: number) => MaybeSignal<`row:${string}` | `row:${string}`[] | undefined>) {
  }
}

export function coerceTableRowBindings<T>(bindings: SciTableRowBinding<T>[], item: T, index: number): SciRowBindings {
  return {
    cssClass: computed(() => bindings
      .filter(binding => binding[SCI_TABLE_ROW_BINDING_TYPE] === 'class')
      .map(binding => coerceSignal(binding.binding(item, index)))
      .reduce((acc, binding) => acc.concat(Arrays.coerce(binding?.())), new Array<string>())),
    attributes: computed(() => bindings
      .filter(binding => binding[SCI_TABLE_ROW_BINDING_TYPE] === 'attribute')
      .map(binding => coerceSignal(binding.binding(item, index)))
      .reduce((acc, binding) => ({...acc, ...binding?.()}), {} as {[name: string]: unknown | undefined})),
    part: computed(() => bindings
      .filter(binding => binding[SCI_TABLE_ROW_BINDING_TYPE] === 'part')
      .map(binding => coerceSignal(binding.binding(item, index)))
      .reduce((acc, binding) => acc.concat(Arrays.coerce(binding?.())), new Array<`row:${string}`>())),
  };
}

export interface SciRowBindings {
  cssClass: Signal<string[]>;
  attributes: Signal<{[name: string]: unknown | undefined}>;
  part: Signal<`row:${string}`[]>;
}
