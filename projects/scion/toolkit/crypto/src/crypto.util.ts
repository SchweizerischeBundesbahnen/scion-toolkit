/*
 * Copyright (c) 2018-2022 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

/**
 * Provides cryptographic functions.
 */
export namespace Crypto {

  /**
   * Generates a digest of the given data using the specified algorithm (or SHA-256 by default) and converts it to a hex string.
   *
   * Can only be used in secure contexts (HTTPS) or on localhost. For more information, refer to https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts.
   *
   * Credits: https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest
   */
  export async function digest(data: string | BufferSource, options?: {algorithm?: 'SHA-256' | 'SHA-384' | 'SHA-512'}): Promise<string> {
    if (!isSecureContext) {
      throw Error('Function "digest" of @scion/toolkit/crypto is available only in secure contexts (HTTPS) or on localhost. For more information, refer to https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts.');
    }
    data = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    // Hash the data.
    const hashBuffer = await crypto.subtle.digest(options?.algorithm ?? 'SHA-256', data);
    // Convert buffer to byte array.
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // Convert bytes to hex string.
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
}
