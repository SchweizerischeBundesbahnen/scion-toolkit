/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, assertNotInReactiveContext, DestroyRef, inject, Injector, runInInjectionContext} from '@angular/core';
import {SciTree, SciTreeDescriptor} from './tree.model';
import {ɵSciTree} from './ɵtree.model';

/**
 * Creates a tree for displaying a tree structure in {@link SciTreeComponent}.
 *
 * Pass a descriptor to configure the datasource and the display of node labels.
 *
 * Use the {@link provideTreeDatasource} function to create a datasource, passing a signal containing the root items and a
 * function that returns the children of a given item.
 *
 * ```ts
 * import {SciTreeComponent, tree, provideTreeDatasource} from '@scion/components/tree';
 * import {httpResource} from '@angular/common/http';
 *
 * // Load data to display in the tree.
 * const files = httpResource<File[]>(() => '/api/files', {defaultValue: []});
 *
 * // Create the tree and pass data.
 * const fileTree = tree({
 *   label: file => file.name,
 *   datasource: provideTreeDatasource(files.value, file => file.children),
 * });
 * ```
 *
 * In the HTML, bind the created tree instance to `<sci-tree>`.
 *
 * ```html
 * <sci-tree name="tree:files" [tree]="fileTree"/>
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
 * @see SciTreeComponent
 * @experimental since 22.6.0; API and behavior may change in any version without notice.
 *
 * @param descriptor - Configures the tree. Requires a datasource and node label function.
 * @return Handle to bind to `<sci-tree>` and interact with the tree.
 */
export function tree<T>(descriptor: SciTreeDescriptor<T>): SciTree<T>;

/**
 * Creates a tree for displaying a tree structure in {@link SciTreeComponent}.
 *
 * Pass a descriptor to configure the datasource and the display of node labels.
 *
 * Use the {@link provideTreeDatasource} function to create a datasource, passing a signal containing the root items and a
 * function that returns the children of a given item.
 *
 * ```ts
 * import {SciTreeComponent, tree, provideTreeDatasource} from '@scion/components/tree';
 * import {httpResource} from '@angular/common/http';
 *
 * // Load data to display in the tree.
 * const files = httpResource<File[]>(() => '/api/files', {defaultValue: []});
 *
 * // Create the tree and pass data.
 * const fileTree = tree({
 *   label: file => file.name,
 *   datasource: provideTreeDatasource(files.value, file => file.children),
 * });
 * ```
 *
 * In the HTML, bind the created tree instance to `<sci-tree>`.
 *
 * ```html
 * <sci-tree name="tree:files" [tree]="fileTree"/>
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
 * @see SciTreeComponent
 * @experimental since 22.6.0; API and behavior may change in any version without notice.
 *
 * @param descriptor - Configures the tree. Requires a datasource and node label function.
 * @return Handle to bind to `<sci-tree>` and interact with the tree.
 */
export function tree<T, ID = T>(descriptor: SciTreeDescriptor<T, ID> & {trackBy: (item: T) => ID}): SciTree<ID>;

export function tree<T, ID = T>(descriptor: SciTreeDescriptor<T, ID>): SciTree<ID> {
  assertNotInReactiveContext(tree, 'Call tree in a non-reactive (non-tracking) context, such as within the untracked() function.');

  if (!descriptor.injector) {
    assertInInjectionContext(tree);
  }

  const injector = descriptor.injector ?? inject(Injector);
  const sciTree = runInInjectionContext(injector, () => new ɵSciTree(descriptor));
  injector.get(DestroyRef).onDestroy(() => sciTree.dispose());

  return sciTree;
}
