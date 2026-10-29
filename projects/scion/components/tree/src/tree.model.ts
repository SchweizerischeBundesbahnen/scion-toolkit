import {SciComponentDescriptor, SciTemplateDescriptor} from '@scion/components/common';
import {Signal, WritableSignal} from '@angular/core';
import {SciTableEvent, SciTableRowActionFactoryFn} from '@scion/components/table';
import {MaybeArray} from '@scion/toolkit/types';
import {SciTreeDatasourceFactory} from './tree-datasource';

export interface SciTreeDescriptor<T, ID> {
  label: ((item: T) => string) | SciTreeNodeComponentDescriptor<T> | SciTreeNodeTemplateDescriptor<T>;
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

export interface SciTreeNodeContext<T> {
  item: T;
  label: string | void;
}

export interface SciTree<ID> {
  /**
   * Currently active item.
   */
  readonly activeItem: Signal<ID | undefined>;

  /**
   * Selected items.
   */
  readonly selectedItems: Signal<Array<ID>>;

  readonly filterable: WritableSignal<boolean>;
  readonly selectable: WritableSignal<'single' | 'multi' | false>;

  filter(text: string | null): void;

  select(id: MaybeArray<ID>): void;

  expandAll(): void;

  collapseAll(): void;
}

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
