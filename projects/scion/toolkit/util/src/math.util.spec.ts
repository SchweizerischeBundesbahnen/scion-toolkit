/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {clamp} from '@scion/toolkit/util';

describe('Math.clamp', () => {

  it('should return clamped value', () => {
    expect(clamp(8, {min: 9, max: 11})).toBe(9);
    expect(clamp(9, {min: 9, max: 11})).toBe(9);
    expect(clamp(10, {min: 9, max: 11})).toBe(10);
    expect(clamp(11, {min: 9, max: 11})).toBe(11);
    expect(clamp(12, {min: 9, max: 11})).toBe(11);
  });

  it('should return clamped value (no max)', () => {
    expect(clamp(8, {min: 9})).toBe(9);
    expect(clamp(9, {min: 9})).toBe(9);
    expect(clamp(10, {min: 9})).toBe(10);
    expect(clamp(11, {min: 9})).toBe(11);
    expect(clamp(12, {min: 9})).toBe(12);
  });

  it('should return clamped value (no min)', () => {
    expect(clamp(8, {max: 11})).toBe(8);
    expect(clamp(9, {max: 11})).toBe(9);
    expect(clamp(10, {max: 11})).toBe(10);
    expect(clamp(11, {max: 11})).toBe(11);
    expect(clamp(12, {max: 11})).toBe(11);
  });

  it('should error if min is larger than max', () => {
    expect(() => clamp(1, {min: 3, max: 2})).toThrowError(/ClampError/);
  });
});
