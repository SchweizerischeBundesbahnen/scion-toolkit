/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationRef, Component, computed, createComponent, DestroyRef, ElementRef, EnvironmentInjector, inject, Injector, input, inputBinding, output, outputBinding} from '@angular/core';
import {SciTree, SciTreeEvent} from './tree.model';
import {ɵSciTree} from './ɵtree.model';
import {SciTableComponent, SciTableEvent} from '@scion/components/table';

/**
 * Provides a tree to display a tree structure.
 *
 * ### Usage
 *
 * Create a tree using the `tree()` function, passing a descriptor to configure the datasource and the display of node labels.
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
 * In the HTML, bind the created tree instance to `<sci-tree>` and assign it a name.
 * The name must start with the `tree:` prefix and is used to store user settings.
 *
 * ```html
 * <sci-tree name="tree:files" [tree]="fileTree"/>
 * ```
 *
 * ### Fixed Node Height
 *
 * All nodes in the tree must have equal height, which is `2em` by default. The height can be changed per tree using the CSS variable `--sci-tree-node-height`.
 *
 * ```scss
 * sci-tree {
 *   --sci-tree-node-height: 30px;
 * }
 * ```
 *
 * ### Styling
 *
 * The appearance of the tree can be customized using the following CSS variables, either globally in the `:root` or at the tree level.
 *
 * - `--sci-tree-node-height`
 * - `--sci-tree-node-indent`
 * - `--sci-tree-node-background-color-hover`
 * - `--sci-tree-node-background-color-selected`
 * - `--sci-tree-node-border-radius`
 * - `--sci-tree-node-outline-color`
 * - `--sci-tree-node-outline-width`
 * - `--sci-tree-node-outline-style`
 * - `--sci-tree-node-action-background-color`
 * - `--sci-tree-node-action-background-color-selected`
 *
 * @experimental since 22.7.0; API and behavior may change in any version without notice.
 */
@Component({
  selector: 'sci-tree',
  template: '',
  styleUrl: './tree.component.scss',
})
export class SciTreeComponent<T = unknown, ID = T> {

  /**
   * Specifies a unique tree identifier, used as the key for storing user preferences.
   */
  public readonly name = input.required<`tree:${string}`>();

  /**
   * Specifies the tree definition and datasource.
   */
  public readonly tree = input.required({transform: (tree: SciTree<ID>) => tree as ɵSciTree<T, ID>});

  /**
   * Emits when the user double-clicks a node or presses `Enter` on selected nodes.
   */
  public readonly primaryAction = output<SciTreeEvent<ID>>();

  constructor() {
    this.attachVirtualTable();
  }

  /**
   * Creates and attaches a {@link SciTableComponent} using this component as host.
   */
  private attachVirtualTable(): void {
    const componentRef = createComponent(SciTableComponent, {
      elementInjector: inject(Injector),
      environmentInjector: inject(EnvironmentInjector),
      hostElement: inject(ElementRef).nativeElement as HTMLElement,
      bindings: [
        inputBinding('name', computed(() => this.name())),
        inputBinding('table', computed(() => this.tree().table)),
        outputBinding('primaryAction', (event: SciTableEvent<ID>) => this.primaryAction.emit(event)),
      ],
    });

    // Attach component to Angular component tree for change detection.
    inject(ApplicationRef).attachView(componentRef.hostView);

    // Destroy component when host is destroyed.
    inject(DestroyRef).onDestroy(() => componentRef.destroy());
  }
}
