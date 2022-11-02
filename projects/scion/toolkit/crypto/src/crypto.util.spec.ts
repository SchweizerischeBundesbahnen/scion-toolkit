/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Crypto} from './crypto.util';

describe('Crypto', () => {

  it('should hash data', async () => {
    const hash = await Crypto.digest('A');
    expect(hash).toEqual('559aead08264d5795d3909718cdd05abd49572e84fe55590eef31a88a08fdffd');
  });
});
