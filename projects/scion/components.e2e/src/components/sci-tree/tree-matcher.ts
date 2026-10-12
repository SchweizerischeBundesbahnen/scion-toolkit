/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {TreePO} from './tree.po';
import {expect} from '@playwright/test';

export function expectTree(tree: TreePO): TreeMatcher {
  return {
    async toEqual(nodes: Array<ExpectedNode | string>): Promise<void> {

      let nth = 0;

      for (const node of nodes) {
        await assertNode(node);
      }

      async function assertNode(expectedNode: ExpectedNode | string): Promise<void> {
        const node = tree.node({nth: nth++});

        if (typeof expectedNode === 'string') {
          await expect.poll(() => node.label()).toEqual(expectedNode);
        }
        else {
          if (expectedNode.label) {
            await expect.poll(() => node.label()).toEqual(expectedNode.label);
          }

          switch (expectedNode.expansionControl) {
            case 'expanded':
              await expect(node.expansionControl.expanded).toBeAttached();
              break;
            case 'collapsed':
              await expect(node.expansionControl.collapsed).toBeAttached();
              break;
            case 'notAttached':
              await expect(node.expansionControl.locator).not.toBeAttached();
              break;
          }

          for (const child of expectedNode.children ?? []) {
            await assertNode(child);
          }
        }
      }
    },
  };
}

export interface TreeMatcher {

  toEqual(nodes: Array<ExpectedNode | string>): Promise<void>;
}

interface ExpectedNode {
  label?: string;
  expansionControl?: 'expanded' | 'collapsed' | 'notAttached';
  children?: Array<ExpectedNode | string>;
}
