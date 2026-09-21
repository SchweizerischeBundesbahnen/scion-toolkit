/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, InjectionToken, Provider, Signal} from '@angular/core';
import {Objects} from '@scion/toolkit/util';

export function provideTableRowBinding<T = unknown>(bindings: SciTableRowBindingFactoryFn<T>): Provider {
  return {
    provide: SCI_TABLE_ROW_BINDING,
    useValue: bindings,
    multi: true,
  };
}

export type SciTableRowBindingFactoryFn<T> = (bindings: SciTableRowBindingFactory, item: T, index: number) => void;

export interface SciTableRowBindingFactory {
  addAttributeBinding(name: string, value: unknown | undefined): this;

  addClassBinding(name: string | undefined): this;

  /**
   * Adds the specified values as part attributes to the row, enabling for custom styling of the row, e.g., based on a condition.
   *
   * Example usage:
   * ```ts
   * table({
   *   datasource: data,
   *   rowBindings: (bindings, item, index) => bindings
   *     .addPartBinding(index % 2 === 0 ? 'row:even' : 'row:odd')
   *     .addPartBinding(item.active ? 'row:active' : undefined),
   *   columns: table => ...,
   * });
   * ```
   *
   * ```scss
   * sci-table::part(row\:even) {
   *   background-color: lightgray;
   * }
   *
   * sci-table::part(row\:active) {
   *   background-color: green;
   * }
   * ```
   */
  addPartBinding(name: `row:${string}` | undefined): this;
}

class ɵSciTableRowBindingFactory implements SciTableRowBindingFactory {

  public readonly attributeBindings = new Array<[string, unknown]>();
  public readonly classBindings = new Array<string>();
  public readonly partBindings = new Array<`row:${string}`>();

  public addAttributeBinding(name: string, value: unknown | undefined): this {
    if (value !== undefined) {
      this.attributeBindings.push([name, value]);
    }
    return this;
  }

  public addClassBinding(name: string | undefined): this {
    if (name) {
      this.classBindings.push(name);
    }
    return this;
  }

  public addPartBinding(name: `row:${string}` | undefined): this {
    if (name) {
      this.partBindings.push(name);
    }
    return this;
  }
}

export function coerceTableRowBindings<T>(bindingsFn: SciTableRowBindingFactoryFn<T>[], item: T, index: number): SciTableRowBindings {
  const factory = computed(() => {
    const factory = new ɵSciTableRowBindingFactory();
    bindingsFn.forEach(fn => fn(factory, item, index));
    return factory;
  });

  return {
    attributes: computed(() => Object.fromEntries(factory().attributeBindings), {equal: Objects.isEqual}),
    cssClass: computed(() => factory().classBindings, {equal: Objects.isEqual}),
    part: computed(() => factory().partBindings, {equal: Objects.isEqual}),
  };
}

export interface SciTableRowBindings {
  cssClass: Signal<string[]>;
  attributes: Signal<{[name: string]: unknown}>;
  part: Signal<`row:${string}`[]>;
}

export const SCI_TABLE_ROW_BINDING = new InjectionToken<SciTableRowBindingFactory[]>('SCI_TABLE_ROW_BINDING');
