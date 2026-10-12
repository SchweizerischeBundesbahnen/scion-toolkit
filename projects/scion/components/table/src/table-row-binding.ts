/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, inject, InjectionToken, Provider, Signal} from '@angular/core';
import {Objects} from '@scion/toolkit/util';

/**
 * Provides row bindings to tables in the scope of the injector providing the bindings.
 *
 * Multiple providers can be registered. Providers at different injector tree levels form a hierarchy.
 */
export function provideTableRowBinding<T = unknown>(bindings: SciTableRowBindingFactoryFn<T>): Provider[] {
  return [
    {
      provide: SCI_TABLE_ROW_BINDING,
      useValue: bindings,
      multi: true,
    },
    {
      provide: SCI_TABLE_ROW_BINDINGS,
      useFactory: (): SciTableRowBindingFactoryFn<unknown>[] => {
        return [
          // Collect bindings registered in parent injectors.
          ...inject<SciTableRowBindingFactoryFn<unknown>[]>(SCI_TABLE_ROW_BINDINGS, {skipSelf: true, optional: true}) ?? [],
          // Collect bindings registered in this injector.
          ...inject<SciTableRowBindingFactoryFn<unknown>[]>(SCI_TABLE_ROW_BINDING),
        ];
      },
    },
  ];
}

/**
 * Signature of a function to configure row bindings.
 *
 * Called per item with a {@link SciTableRowBindingFactory} to register bindings.
 *
 * The function:
 * - Runs in a reactive context and re-evaluates when tracked signals change.
 * - Can call `inject` to get required dependencies.
 */
export type SciTableRowBindingFactoryFn<T> = (row: SciTableRowBindingFactory, item: T, index: number) => void;

/**
 * Factory for configuring row bindings.
 *
 * Row bindings enable associating metadata and icons with a row. Metadata includes CSS shadow parts, CSS classes, and HTML attributes.
 */
export interface SciTableRowBindingFactory {
  /**
   * Binds an icon to the row, displayed in the first column.
   *
   * ```ts
   * import {table} from '@scion/components/table';
   *
   * table({
   *   datasource: data,
   *   columns: table => ...,
   *   rowBindings: bindings => bindings.addIconBinding('account_circle'),
   * });
   * ```
   *
   * SCION uses icon providers to render icons. An icon provider can be registered using {@link provideIconProvider}.
   *
   * Defaults to a Material icon provider if the application has not registered an icon provider, interpreting the icon as a Material Icon font ligature.
   * Refer to https://fonts.google.com/icons for available Material icons and instructions on including the Material icon font.
   */
  addIconBinding(icon: string): this;

  /**
   * Binds a CSS shadow part to the row for custom row/cell styling using the `::part()` CSS pseudo-element selector.
   *
   * Example usage:
   * ```ts
   * import {table} from '@scion/components/table';
   *
   * table({
   *   datasource: data,
   *   columns: table => ...,
   *   rowBindings: (bindings, item, index) => bindings
   *     .addPartBinding(index % 2 === 0 ? 'row:even' : 'row:odd')
   *     .addPartBinding(item.active ? 'row:active' : undefined),
   * });
   * ```
   *
   * ```scss
   * sci-table::part(row\:even row\:not\:selected) {
   *   background-color: lightgray;
   * }
   *
   * sci-table::part(row\:active row\:not\:selected) {
   *   background-color: green;
   * }
   * ```
   */
  addPartBinding(name: `row:${string}` | undefined): this;

  /**
   * Binds an HTML attribute to the row.
   *
   * Useful for end-to-end testing, such as associating a row with an item's primary key.
   *
   * ```ts
   * import {table} from '@scion/components/table';
   *
   * table({
   *   datasource: data,
   *   columns: table => ...,
   *   rowBindings: (bindings, item) => bindings.addAttributeBinding('data-id', item.id),
   * });
   * ```
   */
  addAttributeBinding(name: string, value: unknown | undefined): this;

  /**
   * Binds a CSS class to the row.
   */
  addClassBinding(name: string | undefined): this;
}

export class ɵSciTableRowBindingFactory implements SciTableRowBindingFactory {

  public readonly icons = new Array<string>();
  public readonly parts = new Array<string>();
  public readonly attributes = new Array<[string, unknown]>();
  public readonly classes = new Array<string>();

  public addIconBinding(icon: string | undefined): this {
    if (icon) {
      this.icons.push(icon);
    }
    return this;
  }

  public addPartBinding(name: string | undefined): this {
    if (name) {
      this.parts.push(name);
    }
    return this;
  }

  public addAttributeBinding(name: string, value: unknown | undefined): this {
    if (value !== undefined) {
      this.attributes.push([name, value]);
    }
    return this;
  }

  public addClassBinding(name: string | undefined): this {
    if (name) {
      this.classes.push(name);
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
    icons: computed(() => factory().icons, {equal: Objects.isEqual}),
    parts: computed(() => factory().parts, {equal: Objects.isEqual}),
    attributes: computed(() => Object.fromEntries(factory().attributes), {equal: Objects.isEqual}),
    classes: computed(() => factory().classes, {equal: Objects.isEqual}),
  };
}

export interface SciTableRowBindings {
  icons: Signal<string[]>;
  parts: Signal<string[]>;
  attributes: Signal<{[name: string]: unknown}>;
  classes: Signal<string[]>;
}

/**
 * Multi-DI token for registering a {@link SciTableRowBindingFactory}.
 */
export const SCI_TABLE_ROW_BINDING = new InjectionToken<SciTableRowBindingFactory[]>('SCI_TABLE_ROW_BINDING');

/**
 * DI token to inject {@link SciTableRowBindingFactory} functions provided in the current and parent injectors.
 */
export const SCI_TABLE_ROW_BINDINGS = new InjectionToken<SciTableRowBindingFactory[]>('SCI_TABLE_ROW_BINDINGS');
