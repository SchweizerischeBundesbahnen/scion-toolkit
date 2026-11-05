import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Signal, WritableSignal} from '@angular/core';
import {SciTableCellContext, SciTableEvent, SciTableRowActionFactoryFn} from '@scion/components/table';
import {MaybeArray} from '@scion/toolkit/types';
import {SciTreeDatasourceFactory} from './tree-datasource';
import {Translatable} from '@scion/components/text';

/**
 * Configures a tree.
 * @experimental since 22.4.0; API and behavior may change in any version without notice.
 */
export interface SciTreeDescriptor<T, ID> {
  /**
   * Function, {@link SciTreeNodeComponentDescriptor} or {@link SciTreeNodeTemplateDescriptor} which specifies how tree data should be displayed.
   *
   * The function return value can be plain text or a translation key. A translation key starts with the percent symbol (`%`)
   * and may include parameters in matrix notation for text interpolation.
   *
   * SCION uses text providers to resolve translation keys. A text provider can be registered using {@link provideTextProvider}.
   */
  label: ((item: T) => Translatable | undefined) | SciTreeNodeComponentDescriptor<T> | SciTreeNodeTemplateDescriptor<T>;
  datasource: SciTreeDatasourceFactory<T, ID>;

  /**
   * TODO: external filter only with matcher, how?
   */
  filterable?: boolean | {matcher: (text: string, context: SciTreeNodeContext<T>) => boolean};

  /**
   * Specifies the selection mode for the tree. Defaults to `multi`.
   */
  selectable?: false | 'single' | 'multi';

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
   * Configures node bindings for table nodes.
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
   * Amount of items to render before and after the viewport during virtual scrolling. Defaults to 10.
   */
  bufferSize?: number;

  /**
   * Specifies the number of items to load per page. Defaults to 50.
   */
  pageSize?: number;
  trackBy?: (item: T) => ID;
}

export interface SciTree<ID> {
  /**
   * TODO [tree]: does this need to be public?
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
