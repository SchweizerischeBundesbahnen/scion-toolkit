/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {assertInInjectionContext, DestroyRef, inject, Injector, runInInjectionContext} from '@angular/core';
import {SciTree, SciTreeDescriptor} from './tree.model';
import {ɵSciTree} from './ɵtree.model';

export function tree<T>(descriptor: SciTreeDescriptor<T>, options?: {injector?: Injector}): SciTree<T> {
  if (!options?.injector) {
    assertInInjectionContext(tree);
  }

  const injector = options?.injector ?? inject(Injector);

  const sciTree = runInInjectionContext(injector, () => new ɵSciTree(descriptor));
  injector.get(DestroyRef).onDestroy(() => sciTree.dispose());

  return sciTree;
}
