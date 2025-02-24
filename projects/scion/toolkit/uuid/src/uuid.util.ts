/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

const uuidIterator = generateUUID();

function* generateUUID(): IterableIterator<string, string, string> {
  const lut = [];
  for (let i = 0; i < 256; i++) {
    lut[i] = (i < 16 ? '0' : '') + (i).toString(16);
  }

  while (true) { // eslint-disable-line @typescript-eslint/no-unnecessary-condition
    const d0 = Math.random() * 0xffffffff | 0;
    const d1 = Math.random() * 0xffffffff | 0;
    const d2 = Math.random() * 0xffffffff | 0;
    const d3 = Math.random() * 0xffffffff | 0;

    const uuid = lut[d0 & 0xff]! + lut[d0 >> 8 & 0xff]! + lut[d0 >> 16 & 0xff]! + lut[d0 >> 24 & 0xff]! + '-' +
      lut[d1 & 0xff]! + lut[d1 >> 8 & 0xff]! + '-' + lut[d1 >> 16 & 0x0f | 0x40]! + lut[d1 >> 24 & 0xff]! + '-' +
      lut[d2 & 0x3f | 0x80]! + lut[d2 >> 8 & 0xff]! + '-' + lut[d2 >> 16 & 0xff]! + lut[d2 >> 24 & 0xff]! +
      lut[d3 & 0xff]! + lut[d3 >> 8 & 0xff]! + lut[d3 >> 16 & 0xff]! + lut[d3 >> 24 & 0xff]!;

    yield uuid;
  }
}

/**
 * Generates a UUID (universally unique identifier) compliant with the RFC 4122 version 4.
 */
export function randomUUID(): string {
  return uuidIterator.next().value;
}
