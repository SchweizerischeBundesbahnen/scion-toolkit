/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
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
