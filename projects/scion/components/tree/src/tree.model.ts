import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Signal, WritableSignal} from '@angular/core';
import {SciTableCellContext, SciTableEvent, SciTableRowActionFactoryFn} from '@scion/components/table';
import {MaybeArray} from '@scion/toolkit/types';
import {SciTreeDatasourceFactory} from './tree-datasource';
import {Translatable} from '@scion/components/text';

export interface SciTreeDescriptor<T, ID> {
  label: ((item: T) => Translatable | undefined) | SciTreeNodeComponentDescriptor<T> | SciTreeNodeTemplateDescriptor<T>;
  datasource: SciTreeDatasourceFactory<T, ID>;
  filterable?: boolean | {matcher: (text: string, context: SciTreeNodeContext<T>) => boolean};
  selectable?: false | 'single' | 'multi';
  nodeActions?: SciTreeNodeActionFactoryFn<T>;
  nodeBindings?: SciTreeNodeBindingFactoryFn<T>;
  /**
   * Amount of items to render before and after the viewport during virtual scrolling. Defaults to 10.
   */
  bufferSize?: number;
  pageSize?: number;
  trackBy?: (item: T) => ID;
}

export interface SciTree<ID> {
  // TODO [tree]: does this need to be public?
  /**
   * The ID of the active node, or `undefined` if no node is active.
   *
   * The active node is the target of keyboard navigation and may differ from the selected nodes.
   */
  readonly activeItem: Signal<ID | undefined>;

  /**
   * The IDs of the selected nodes.
   */
  readonly selectedItems: Signal<Array<ID>>;

  /**
   * Controls whether the built-in filter is enabled.
   *
   * Initialized from {@link SciTreeDescriptor.filterable}. Defaults to `false`.
   */
  readonly filterable: WritableSignal<boolean>;

  /**
   * Controls whether the user can select a single node, multiple nodes, or nothing.
   *
   * Initialized from {@link SciTreeDescriptor.selectable}. Defaults to `multi`.
   */
  readonly selectable: WritableSignal<'single' | 'multi' | false>;

  /**
   * Filters nodes by the specified text.
   *
   * Can be used to connect an external filter field to the tree.
   *
   * When using {@link provideTreeDatasource}, matches node labels, or uses the custom matcher, if one is configured in {@link SciTreeDescriptor.filterable}. Component and template labels require a custom matcher.
   * When using {@link provideAsyncTreeDatasource}, filtering is delegated to the datasource.
   *
   * @param text - Text to filter by, or `null` to clear the filter.
   */
  filter(text: string | null): void;

  /**
   * Selects the specified nodes, replacing the current selection.
   *
   * Expands parent nodes and activates the last selected node that is not filtered out.
   *
   * @param id - ID or IDs of the nodes to select, or an empty array to clear the selection.
   */
  select(id: MaybeArray<ID>): void;

  /**
   * Expands all nodes in the tree.
   */
  expandAll(): void;

  /**
   * Collapses all nodes in the tree.
   */
  collapseAll(): void;
}

export type SciTreeNodeContext<T> = SciTableCellContext<T, string | void>;
export type SciTreeEvent<ID> = SciTableEvent<ID>;
export type SciTreeNodeActionFactoryFn<T> = SciTableRowActionFactoryFn<T>;
export type SciTreeNodeBindingFactoryFn<T> = (node: SciTreeNodeBindingFactory, item: T, index: number) => void;

export interface SciTreeNodeBindingFactory {
  /**
   * Binds an icon to the node, displayed in the first column.
   *
   * ```ts
   * import {tree} from '@scion/components/tree';
   *
   * tree({
   *   datasource: data,
   *   nodeBindings: node => node.addIconBinding('mail'),
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
   * Adds the specified values as part attributes to the node, enabling for custom styling of the node, e.g., based on a condition.
   *
   * Example usage:
   * ```ts
   * tree({
   *   datasource: data,
   *   nodeBindings: (node, item, index) => node
   *     .addPartBinding(item.active ? 'node:active' : undefined),
   * });
   * ```
   *
   * ```scss
   * sci-tree::part(node\:active node\:not\:selected) {
   *   background-color: green;
   * }
   * ```
   */
  addPartBinding(name: `node:${string}` | undefined): this;

  /**
   * Binds an HTML attribute to the node.
   *
   * Useful for end-to-end testing, such as associating a node with an item's primary key.
   *
   * ```ts
   * import {tree} from '@scion/components/tree';
   *
   * tree({
   *   datasource: data,
   *   nodeBindings: (node, item) => node.addAttributeBinding('data-id', item.id),
   * });
   * ```
   */
  addAttributeBinding(name: string, value: unknown | undefined): this;

  /**
   * Binds a CSS class to the node.
   */
  addClassBinding(name: string | undefined): this;
}

interface SciTreeNodeComponentDescriptor<T> {
  component: (item: T) => SciComponentDescriptor;
  padding?: boolean;
}

interface SciTreeNodeTemplateDescriptor<T> {
  template: (item: T) => SciTemplateDescriptor;
  padding?: boolean;
}
