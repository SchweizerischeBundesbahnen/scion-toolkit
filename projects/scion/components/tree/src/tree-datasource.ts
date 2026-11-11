import {provideTableDatasource, SciTableDatasourceProvider, SciTreeTableNode, ɵprovideTableDatasource} from '@scion/components/table';
import {MaybeAsync} from '@scion/toolkit/types';
import {Signal} from '@angular/core';

export type SciTreeDatasourceProvider<T, ID = never> = SciTableDatasourceProvider<T, ID>;
export type SciTreeNode<T> = SciTreeTableNode<T>;

/**
 * Provides an in-memory datasource for {@link SciTree} with built-in filtering.
 *
 * A datasource provides data to {@link SciTree}, passing each item to {@link SciTreeDescriptor.label} for display.
 *
 * This datasource requires all data to be loaded upfront. It invokes the passed child selector function for each item
 * to construct the tree. Data is filtered in memory.
 *
 * If using custom labels, a {@link SciTreeDescriptor.matcher} is required to support {@link SciTree.filter}.
 *
 * For large datasets requiring pagination or server-side filtering and sorting, prefer implementing a custom datasource using {@link ɵprovideTreeDatasource}.
 *
 * IMPORTANT: Custom datasource support is experimental and currently exposed only as `ɵprovideTableDatasource`. The API and behavior may change in any version without notice.
 *
 * @example - Usage
 * ```ts
 * import {tree, provideTreeDatasource} from '@scion/components/tree';
 * import {httpResource} from '@angular/common/http';
 *
 * const files = httpResource<File[]>(() => '/api/files', {defaultValue: []});
 *
 * const fileTree = tree({
 *   label: file => file.name,
 *   datasource: provideTreeDatasource(files.value, file => file.children),
 * });
 * ```
 *
 * @param root - Provides the root items to display in the tree.
 * @param children - Function returning an item's children, or an empty array if the item has no children or is a leaf.
 *                   Called eagerly for each item when initializing the tree, inside a reactive context that re-evaluates when tracked signals change.
 *
 * @see SciTreeDescriptor.datasource
 */
export function provideTreeDatasource<T>(root: Signal<T[]>, children: (item: T) => T[]): SciTreeDatasourceProvider<T> {
  return provideTableDatasource(root, children);
}

/**
 * Provides a datasource for {@link SciTree}.
 *
 * A datasource provides data to {@link SciTree}, passing each item to {@link SciTreeDescriptor.label} for display.
 * Filtering and sorting must be implemented by the datasource based on the provided filter and sort criteria.
 *
 * A tree is a hierarchical structure of nodes, represented by the datasource as a flat list of tree nodes.
 * Each node references an item and its parent by ID, without containing the item itself. The tree requests items on demand when scrolled into view,
 * allowing large datasets to be displayed without loading all items upfront. If the entire dataset is available locally, use {@link provideTreeDatasource}.
 *
 * {@link SciTree} constructs the tree from the returned nodes, starting with root nodes (nodes without a parent) and appending child nodes in array order.
 * Child nodes can appear anywhere in the nodes list; they do not need to follow their parent.
 *
 * @example - Usage
 * ```ts
 * import {tree, provideTreeDatasource} from '@scion/components/tree';
 * import {SciTreeNode} from '@scion/components/table';
 * import {httpResource} from '@angular/common/http';
 * import {toObservable} from '@angular/core/rxjs-interop';
 *
 * const files = httpResource<File[]>(() => '/api/files', {defaultValue: []});
 *
 * const fileTree = tree<File, string>({
 *   label: file => file.name,
 *   datasource: provideTreeDatasource({
 *     getTreeNodes: query => toObservable(httpResource<SciTreeNode<string>[]>(() => `/api/files?filter=${query.filter}`, {defaultValue: []}).value),
 *     getItems: guids => toObservable(httpResource<File[]>(() => ({url: `/api/files`, params: {guids}}), {defaultValue: []}).value),
 *   }),
 *   trackBy: file => file.guid,
 * });
 * ```
 *
 * @param datasource - Specifies the datasource.
 *
 * @docs-private Not public API. For internal use only.
 * @experimental since 22.6.0; API and behavior may change in any version without notice.
 */
export function ɵprovideTreeDatasource<T, ID>(datasource: SciTreeDatasource<T, ID>): SciTableDatasourceProvider<T, ID> {
  return ɵprovideTableDatasource({
    getTreeTableNodes: query => datasource.getTreeNodes({filter: query.tableFilter}),
    getItems: ids => datasource.getItems(ids),
  });
}

export interface SciTreeDatasourceQuery {
  filter?: string;
}

/**
 * Represents a datasource for {@link SciTree}.
 *
 * A datasource provides data to {@link SciTree}, passing each item to {@link SciTreeDescriptor.label} for display.
 * Filtering and sorting must be implemented by the datasource based on the provided filter and sort criteria.
 *
 * A tree is a hierarchical structure of nodes, represented by the datasource as a flat list of tree nodes.
 * Each node references an item and its parent by ID, without containing the item itself. The tree requests items on demand when scrolled into view,
 * allowing large datasets to be displayed without loading all items upfront. If the entire dataset is available locally, use {@link provideTreeDatasource}.
 *
 * {@link SciTree} constructs the tree from the returned nodes, starting with root nodes (nodes without a parent) and appending child nodes in array order.
 * Child nodes can appear anywhere in the nodes list; they do not need to follow their parent.
 */
export interface SciTreeDatasource<T, ID> {

  /**
   * Returns a flat list of tree nodes matching the given filter and sort criteria.
   *
   * A tree node references an item and its parent by ID, without containing the item itself.
   *
   * Child nodes can appear anywhere in the list; they do not need to follow their parent. Siblings are added in the order they appear in the list.
   *
   * If a filter is set, return only the directly matching nodes (leaf or intermediate). Do not include their ancestors.
   */
  getTreeNodes(query: SciTreeDatasourceQuery): MaybeAsync<SciTreeNode<ID>[]>;

  /**
   * Resolves items for the specified IDs. Called as nodes scroll into view.
   */
  getItems(ids: ID[]): MaybeAsync<T[]>;
}
