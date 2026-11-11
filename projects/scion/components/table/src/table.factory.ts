/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, assertNotInReactiveContext, DestroyRef, inject, Injector, isSignal, runInInjectionContext, Signal} from '@angular/core';
import {SciTable, SciTableDescriptor} from './table.model';
import {SciTableColumnFactory} from './table-column.factory';
import {ɵSciTable} from './ɵtable.model';

export type SciTableColumnFactoryFn<T> = (table: SciTableColumnFactory<T>) => void;

// IMPORTANT: Do not change order of factory functions for better IntelliSense.

/**
 * Creates a table for displaying tabular or hierarchical data in {@link SciTableComponent}.
 *
 * Pass a descriptor to define the columns, datasource, and display options. Requires at minimum a datasource and columns.
 *
 * ```ts
 * import {table} from '@scion/components/table';
 * import {httpResource} from '@angular/common/http';
 *
 * const users = httpResource<User[]>(() => '/api/users', {defaultValue: []});
 *
 * const userTable = table({
 *   datasource: users.value,
 *   columns: table => table
 *     .addStringColumn('Name', user => user.name)
 *     .addBooleanColumn('Inactive', user => user.inactive)
 *     .addDateColumn('Expiration', user => user.expiration),
 * });
 * ```
 *
 * In the HTML, bind the created table instance to `<sci-table>`.
 *
 * ```html
 * <sci-table name="table:users" [table]="userTable"/>
 * ```
 *
 * To display a tree structure, provide a hierarchical datasource via {@link provideTableDatasource}, passing a signal
 * containing the root items and a function that returns the children of a given item.
 *
 * ```ts
 * import {table, provideTableDatasource} from '@scion/components/table';
 * import {httpResource} from '@angular/common/http';
 *
 * const users = httpResource<User[]>(() => '/api/users', {defaultValue: []});
 *
 * const userTable = table({
 *   datasource: provideTableDatasource(users.value, user => user.children),
 *   columns: table => table
 *     .addStringColumn('Name', user => user.name)
 *     .addBooleanColumn('Inactive', user => user.inactive)
 *     .addDateColumn('Expiration', user => user.expiration),
 * });
 * ```
 *
 * Callback functions:
 * - Run in a reactive context and re-evaluate when tracked signals change.
 * - Can call `inject` to get required dependencies. The injection context is destroyed each time the function is called anew.
 *
 * This function:
 * - Must be called within an injection context, or an explicit {@link Injector} passed.
 * - Must be called in a non-reactive (non-tracking) context.
 *
 * @see SciTableComponent
 * @experimental since 22.3.0; API and behavior may change in any version without notice.
 *
 * @param descriptor - Configures the table. Requires a datasource and columns.
 * @return Handle to bind to `<sci-table>` and interact with the table.
 */
export function table<T>(descriptor: SciTableDescriptor<T>): SciTable<T>;

/**
 * Creates a table for displaying tabular or hierarchical data in {@link SciTableComponent}.
 *
 * Pass a descriptor to define the columns, datasource, and display options. Requires at minimum a datasource and columns.
 *
 * ```ts
 * import {table} from '@scion/components/table';
 * import {httpResource} from '@angular/common/http';
 *
 * const users = httpResource<User[]>(() => '/api/users', {defaultValue: []});
 *
 * const userTable = table({
 *   datasource: users.value,
 *   columns: table => table
 *     .addStringColumn('Name', user => user.name)
 *     .addBooleanColumn('Inactive', user => user.inactive)
 *     .addDateColumn('Expiration', user => user.expiration),
 * });
 * ```
 *
 * In the HTML, bind the created table instance to `<sci-table>`.
 *
 * ```html
 * <sci-table name="table:users" [table]="userTable"/>
 * ```
 *
 * To display a tree structure, provide a hierarchical datasource via {@link provideTableDatasource}, passing a signal
 * containing the root items and a function that returns the children of a given item.
 *
 * ```ts
 * import {table, provideTableDatasource} from '@scion/components/table';
 * import {httpResource} from '@angular/common/http';
 *
 * const users = httpResource<User[]>(() => '/api/users', {defaultValue: []});
 *
 * const userTable = table({
 *   datasource: provideTableDatasource(users.value, user => user.children),
 *   columns: table => table
 *     .addStringColumn('Name', user => user.name)
 *     .addBooleanColumn('Inactive', user => user.inactive)
 *     .addDateColumn('Expiration', user => user.expiration),
 * });
 * ```
 *
 * Callback functions:
 * - Run in a reactive context and re-evaluate when tracked signals change.
 * - Can call `inject` to get required dependencies. The injection context is destroyed each time the function is called anew.
 *
 * This function:
 * - Must be called within an injection context, or an explicit {@link Injector} passed.
 * - Must be called in a non-reactive (non-tracking) context.
 *
 * @see SciTableComponent
 * @experimental since 22.3.0; API and behavior may change in any version without notice.
 *
 * @param descriptor - Configures the table. Requires a datasource and columns.
 * @return Handle to bind to `<sci-table>` and interact with the table.
 */
export function table<T, ID>(descriptor: SciTableDescriptor<T, ID> & {trackBy: (item: T) => ID}): SciTable<ID>;

/**
 * Creates a table for displaying tabular data in {@link SciTableComponent}.
 *
 * Pass a signal containing the items to display in the table and a factory function to define the columns.
 * The table calls the passed function with a factory that has methods for adding columns to the table.
 *
 * NOTE: This function is a shorthand for creating a table directly from data and columns; pass a descriptor instead to display a tree structure, configure a custom datasource, or set additional options.
 *
 * ```ts
 * import {SciTableComponent, table} from '@scion/components/table';
 * import {httpResource} from '@angular/common/http';
 *
 * // Load data to display in the table.
 * const users = httpResource<User[]>(() => '/api/users', {defaultValue: []});
 *
 * // Create the table and pass data.
 * const userTable = table(users.value, table => table
 *   .addStringColumn('Name', user => user.name)
 *   .addBooleanColumn('Inactive', user => user.inactive)
 *   .addDateColumn('Expiration', user => user.expiration),
 * );
 * ```
 *
 * In the HTML, bind the created table instance to `<sci-table>`.
 *
 * ```html
 * <sci-table name="table:users" [table]="userTable"/>
 * ```
 *
 * Callback functions:
 * - Run in a reactive context and re-evaluate when tracked signals change.
 * - Can call `inject` to get required dependencies. The injection context is destroyed each time the function is called anew.
 *
 * This function:
 * - Must be called within an injection context, or an explicit {@link Injector} passed.
 * - Must be called in a non-reactive (non-tracking) context.
 *
 * @see SciTableComponent
 * @experimental since 22.3.0; API and behavior may change in any version without notice.
 *
 * @param data - Specifies items to display in the table.
 * @param columnFactoryFn - Specifies a factory function to add columns to the table.
 * @param options - Controls table creation.
 * @param options.injector - Injector used to create the table. Defaults to the current injection context. The table is disposed when the passed injector is destroyed.
 * @return Handle to bind to `<sci-table>` and interact with the table.
 */
export function table<T>(data: Signal<T[]>, columnFactoryFn: SciTableColumnFactoryFn<T>, options?: {injector?: Injector}): SciTable<T>;

export function table<T, ID = T>(dataOrDescriptor: Signal<T[]> | SciTableDescriptor<T, ID>, columnFactoryFn?: SciTableColumnFactoryFn<T>, options?: {injector?: Injector}): SciTable<ID> {
  assertNotInReactiveContext(table, 'Call table in a non-reactive (non-tracking) context, such as within the untracked() function.');

  const descriptor = isSignal(dataOrDescriptor) ? ({datasource: dataOrDescriptor, columns: columnFactoryFn!, injector: options?.injector}) satisfies SciTableDescriptor<T> : dataOrDescriptor;
  if (!descriptor.injector) {
    assertInInjectionContext(table);
  }

  const injector = descriptor.injector ?? inject(Injector);
  const sciTable = runInInjectionContext(injector, () => new ɵSciTable(descriptor));
  injector.get(DestroyRef).onDestroy(() => sciTable.dispose());

  return sciTable;
}
