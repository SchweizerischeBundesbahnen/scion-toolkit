import {MaybeSignal, SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Injector, Signal, WritableSignal} from '@angular/core';
import {SciTableCellContext, SciTableEvent, SciTableRowActionFactoryFn} from '@scion/components/table';
import {MaybeArray} from '@scion/toolkit/types';
import {SciTreeDatasourceProvider} from './tree-datasource';
import {Translatable} from '@scion/components/text';

/**
 * Represents a descriptor to configure {@link SciTreeComponent}.
 *
 * Defines the datasource, the display of node labels, and other display options. Requires a datasource and node label function.
 */
export interface SciTreeDescriptor<T, ID = T> {
  /**
   * Specifies the datasource to provide data to {@link SciTree}.
   *
   * Create a datasource using the {@link provideTreeDatasource} function and pass a signal containing the root items
   * and a function that returns the children of a given item.
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
   * @see provideTreeDatasource
   */
  datasource: SciTreeDatasourceProvider<T, ID>;
  /**
   * Specifies the text or custom content to display for a tree node.
   *
   * Can be text or a translation key, or a {@link SciTreeNodeComponentDescriptor} or {@link SciTreeNodeTemplateDescriptor}.
   *
   * A translation key starts with the percent symbol (`%`) and may include parameters in matrix notation for text interpolation.
   * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
   *
   * The function:
   * - Can call `inject` to get required dependencies.
   * - Can call `toSignal` to convert an {@link Observable} to a {@link Signal}.
   */
  label: ((item: T) => MaybeSignal<Translatable | undefined>) | SciTreeNodeComponentDescriptor<T> | SciTreeNodeTemplateDescriptor<T>;

  /**
   * Specifies a custom matcher for {@link SciTree.filter}.
   *
   * If using the built-in in-memory datasource, defaults to matching node labels. Component and template labels require a custom matcher.
   * For all other datasources, filtering is delegated to the datasource and this matcher is not used.
   */
  matcher?: (text: string, context: SciTreeNodeContext<T>) => boolean;

  /**
   * Controls whether the user can select a single node (`single`), multiple nodes (`multi`), or no nodes (`false`). Defaults to `multi`.
   *
   * Does not affect selection via {@link SciTree.select}.
   */
  selectable?: 'single' | 'multi' | false;

  /**
   * Configures actions to show when hovering over a node.
   *
   * @example
   * ```ts
   * import {tree} from '@scion/components/tree';
   *
   * tree({
   *   datasource: provideTreeDatasource(data, item => item.children),
   *   label: item => item.name,
   *   rowActions: (toolbar, item) => toolbar.addToolbarButton({
   *     icon: 'delete',
   *     onSelect: () => ...,
   *   }),
   * });
   * ```
   *
   * The function:
   * - Is called per item with a {@link SciToolbarFactory} to contribute actions.
   * - Runs in a reactive context and re-evaluates when tracked signals change.
   * - Can call `inject` to get required dependencies.
   */
  nodeActions?: SciTreeNodeActionFactoryFn<T>;

  /**
   * Configures node bindings for tree nodes.
   *
   * Node bindings enable associating metadata and icons with a node. Metadata includes CSS shadow parts, CSS classes, and HTML attributes.
   *
   * @example
   * ```ts
   * import {tree} from '@scion/components/tree';
   *
   * tree({
   *   datasource: provideTreeDatasource(data, item => item.children),
   *   label: item => item.name,
   *   nodeBindings: (bindings, item, index) => bindings
   *     .addIconBinding(item.type === 'file' ? 'format_align_left' : 'folder')
   *     .addPartBinding(item.active ? 'node:active' : undefined),
   *     .addAttributeBinding('data-id', item.id)
   *     .addClassBinding(item.inactive ? 'inactive' : undefined),
   * });
   * ```
   *
   * Part attribute bindings make a node stylable by associating its cells with one or more HTML part attributes that can be referenced in CSS using the `::part()` CSS pseudo-element selector.
   *
   * ```scss
   * sci-tree::part(node\:active node\:not\:selected) {
   *   background-color: lightgray;
   * }
   * ```
   *
   * The function:
   * - Is called per item with a {@link SciTreeNodeBindingFactory} to register bindings.
   * - Runs in a reactive context and re-evaluates when tracked signals change.
   * - Can call `inject` to get required dependencies.
   *
   * @param bindings - Factory providing methods to register node bindings.
   * @param item - Item associated with the node.
   * @param index - Index of the node, zero-based.
   */
  nodeBindings?: SciTreeNodeBindingFactoryFn<T>;

  /**
   * Specifies the number of items to render before and after the viewport. Defaults to 10.
   */
  bufferSize?: number;

  /**
   * Specifies the number of items to load per page. Defaults to 50.
   */
  pageSize?: number;

  /**
   * Computes a unique and stable identity for items in the tree.
   *
   * Defaults to the item object reference. Used to identify items when loading data from the datasource and when tracking tree selection.
   */
  trackBy?: (item: T) => ID;

  /**
   * Specifies an injector used to create the tree. Defaults to the current injection context.
   * The tree is disposed when the passed injector is destroyed.
   */
  injector?: Injector;
}

/**
 * Represents a table for {@link SciTreeComponent}.
 *
 * Can be constructed using the {@link tree} function.
 * Use to bind to `<sci-tree>` and interact with the tree.
 *
 * @see tree
 * @see SciTreeComponent
 */
export interface SciTree<ID = unknown> {
  /**
   * Provides the active item, if any.
   *
   * The active item may differ from the selected items and is used as the target for keyboard navigation.
   */
  readonly activeItem: Signal<ID | undefined>;

  /**
   * Provides the selected items.
   */
  readonly selectedItems: Signal<Array<ID>>;

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
   * If using the built-in in-memory datasource, matches node labels, or uses the custom matcher, if one is configured in {@link SciTreeDescriptor.matcher}. Component and template labels require a custom matcher.
   * For all other datasources, filtering is delegated to the datasource.
   *
   * @param text - Text to filter by, or `null` to clear the filter.
   */
  filter(text: string | null): void;

  /**
   * Selects the specified nodes, replacing the current selection.
   *
   * Expands parent nodes of the selected nodes.
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
