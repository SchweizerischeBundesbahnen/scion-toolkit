/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Locator} from '@playwright/test';

/**
 * Returns `true` if given element is the active element.
 */
export async function isActiveElement(testee: Locator): Promise<boolean> {
  return await testee.evaluate(el => el === document.activeElement);
}

/**
 * Creates a {@link DomRect} from given rectangle.
 *
 * Similar to {@link DOMRect#fromRect} but can be used in e2e-tests executed in NodeJS.
 */
export function fromRect(rect: DOMRectInit | null): DomRect {
  const width = rect?.width ?? 0;
  const height = rect?.height ?? 0;
  const x = rect?.x ?? 0;
  const y = rect?.y ?? 0;
  return {
    x,
    y,
    width,
    height,
    top: y,
    bottom: y + height,
    left: x,
    right: x + width,
    hcenter: x + width / 2,
    vcenter: y + height / 2,
  };
}

/**
 * Position and size of an element.
 */
export interface DomRect {
  x: number;
  y: number;
  width: number;
  height: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  hcenter: number;
  vcenter: number;
}
