/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ApplicationRef, Component, computed, createComponent, DestroyRef, ElementRef, EnvironmentInjector, inject, Injector, input, inputBinding, output} from '@angular/core';
import {SciTree} from './tree.model';
import {ɵSciTree} from './ɵtree.model';
import {SciTableComponent} from '@scion/components/table';

@Component({
  selector: 'sci-tree',
  template: '',
  imports: [],
})
export class SciTreeComponent<T = unknown> {

  /**
   * Specifies a unique tree identifier, used as the key for storing user preferences.
   */
  public readonly name = input.required<`tree:${string}`>();

  /**
   * Specifies the tree definition and datasource.
   */
  public readonly tree = input.required({transform: (tree: SciTree<T>) => tree as ɵSciTree<T>});

  /**
   * Emits when the user performs a primary action on a node (double-clicking or pressing `Enter`).
   */
  public readonly primaryAction = output<T>();

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
        inputBinding('name', computed((): `table:${string}` => `table:${this.name()}`)),
        inputBinding('table', computed(() => this.tree().table)),
      ],
    });

    // Attach component to Angular component tree for change detection.
    inject(ApplicationRef).attachView(componentRef.hostView);

    // Destroy component when host is destroyed.
    inject(DestroyRef).onDestroy(() => componentRef.destroy());
  }
}
