/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {SciMenuItemLike} from './menu.model';

/**
 * Sorts passed menu items based on its preferred {@link SciMenuItemLike.position}.
 *
 * This function is not recursive, not sorting menu items in submenus or groups.
 */
export function sortMenuItems(menuItems: SciMenuItemLike[]): SciMenuItemLike[] {
  // Note: The standard JavaScript sorting algorithms cannot be used as it requires strict weak element ordering (transitivity), not given for elements positioned relative to each other.
  const sorted = [] as SciMenuItemLike[];
  const queue = new Set(menuItems);

  // Add contributions which do not declare an insertion point or a non-existent insertion point.
  menuItems.forEach(menuItem => {
    // Add contribution if not declaring an insertion point.
    if (!menuItem.position) {
      sorted.push(menuItem);
      queue.delete(menuItem);
    }
    // Add contribution if declaring a non-existent "before" insertion point.
    else if (menuItem.position.before && !menuItems.some(it => it.name === menuItem.position!.before)) {
      sorted.push(menuItem);
      queue.delete(menuItem);
    }
    // Add contribution if declaring a non-existent "after" insertion point.
    else if (menuItem.position.after && !menuItems.some(it => it.name === menuItem.position!.after)) {
      sorted.push(menuItem);
      queue.delete(menuItem);
    }
  });

  // Add contributions at the start or end.
  menuItems.forEach(menuItem => {
    if (menuItem.position?.position === 'start') {
      sorted.unshift(menuItem);
      queue.delete(menuItem);
    }
    else if (menuItem.position?.position === 'end') {
      sorted.push(menuItem);
      queue.delete(menuItem);
    }
  });

  // Add contributions declaring an insertion point. Multiple iterations may be required.
  while (queue.size) {
    const queueSize = queue.size;

    for (const menuItem of queue) {
      // Add contributions declaring a "before" insertion point.
      if (menuItem.position?.before) {
        const index = sorted.findIndex(candidate => candidate.name === menuItem.position!.before);
        if (index !== -1) {
          sorted.splice(index, 0, menuItem);
          queue.delete(menuItem);
        }
      }
      // Add contributions declaring an "after" insertion point.
      else if (menuItem.position?.after) {
        const index = sorted.findIndex(candidate => candidate.name === menuItem.position!.after);
        if (index !== -1) {
          sorted.splice(index + 1, 0, menuItem);
          queue.delete(menuItem);
        }
      }
    }

    if (queue.size === queueSize) {
      console.warn('[@scion/components] Menu contributions reference non-existent menu items.', queue);
      sorted.push(...queue);
      queue.clear();
    }
  }

  return sorted;
}
