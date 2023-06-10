/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {randomUUID} from './uuid.util';

describe('UUID', () => {

  it('should generate an UUID with 36 characters', () => {
    const uuid = randomUUID();
    expect(uuid).not.toBeNull();
    expect(uuid.length === 36).toBeTrue();
  });

  it('should generate 500_000 unique UUIDs', () => {
    // check uniqueness of 500.000 UUIDs
    const uuids = new Set();
    for (let i = 0; i < 500_000; i++) {
      const uuid = randomUUID();
      expect(uuids.has(uuid)).toBeFalse();
      uuids.add(uuid);
    }
  });
});
