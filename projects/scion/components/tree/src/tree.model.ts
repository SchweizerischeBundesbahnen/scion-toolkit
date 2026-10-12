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
export type SciTreeNodeBindingFactoryFn<T> = (bindings: SciTreeNodeBindingFactory, item: T, index: number) => void;

export interface SciTreeNodeBindingFactory {
  addAttributeBinding(name: string, value: unknown | undefined): this;

  addClassBinding(name: string | undefined): this;

  /**
   * Adds the specified values as part attributes to the node, enabling for custom styling of the node, e.g., based on a condition.
   *
   * Example usage:
   * ```ts
   * tree({
   *   datasource: data,
   *   nodeBindings: (bindings, item, index) => bindings
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
}

interface SciTreeNodeComponentDescriptor<T> {
  component: (item: T) => SciComponentDescriptor;
  padding?: boolean;
}

interface SciTreeNodeTemplateDescriptor<T> {
  template: (item: T) => SciTemplateDescriptor;
  padding?: boolean;
}
