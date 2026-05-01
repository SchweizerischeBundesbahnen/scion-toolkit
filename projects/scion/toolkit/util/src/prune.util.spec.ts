/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {prune} from './prune.util';

describe('prune', () => {

  describe('prune(object)', () => {

    it('should delete `undefined` values (default options)', () => {
      const object = {
        key1: undefined,
        key2: null,
        key3: new Map<string, unknown>(),
        key4: new Set<unknown>(),
        key5: new Array<unknown>(),
        key6: {},
        key7: new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        key8: new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        key9: [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        key10: {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      };

      expect(prune(object)).toEqual({
        key2: null,
        key3: new Map<string, unknown>(),
        key4: new Set<unknown>(),
        key5: new Array<unknown>(),
        key6: {},
        key7: new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        key8: new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        key9: [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        key10: {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      } as typeof object);
    });

    it('should delete `undefined` values (recursive=true)', () => {
      const object = {
        key1: undefined,
        key2: null,
        key3: new Map<string, unknown>(),
        key4: new Set<unknown>(),
        key5: new Array<unknown>(),
        key6: {},
        key7: new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        key8: new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        key9: [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        key10: {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      };

      expect(prune(object, {recursive: true})).toEqual({
        key2: null,
        key3: new Map<string, unknown>(),
        key4: new Set<unknown>(),
        key5: new Array<unknown>(),
        key6: {},
        key7: new Map<string, unknown>()
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        key8: new Set<unknown>()
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        key9: [
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        key10: {
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      } as typeof object);
    });

    it('should delete `undefined` values (recursive=true, pruneIfEmpty=true)', () => {
      const object = {
        key1: undefined,
        key2: null,
        key3: new Map<string, unknown>(),
        key4: new Set<unknown>(),
        key5: new Array<unknown>(),
        key6: {},
        key7: new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        key8: new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        key9: [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        key10: {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      };

      expect(prune(object, {recursive: true, pruneIfEmpty: true})).toEqual({
        key2: null,
        key7: new Map<string, unknown>().set('key2', null),
        key8: new Set<unknown>().add(null),
        key9: [null],
        key10: {key2: null},
      } as typeof object);
    });

    it('should delete `undefined` values (recursive=true, pruneIfEmpty=true) (only `undefined` and empty values)', () => {
      const object = {
        key1: undefined,
        key3: new Map<string, unknown>(),
        key4: new Set<unknown>(),
        key5: new Array<unknown>(),
        key6: {},
        key7: new Map<string, unknown>()
          .set('key1', undefined)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        key8: new Set<unknown>()
          .add(undefined)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        key9: [
          undefined,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        key10: {
          key1: undefined,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      };

      expect(prune(object, {recursive: true, pruneIfEmpty: true})).toEqual(undefined);
    });

    it('should delete `undefined` values (pruneIfEmpty=true)', () => {
      const object = {
        key1: undefined,
        key2: null,
        key3: new Map<string, unknown>(),
        key4: new Set<unknown>(),
        key5: new Array<unknown>(),
        key6: {},
        key7: new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        key8: new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        key9: [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        key10: {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      };

      expect(prune(object, {pruneIfEmpty: true})).toEqual({
        key2: null,
        key3: new Map<string, unknown>(),
        key4: new Set<unknown>(),
        key5: new Array<unknown>(),
        key6: {},
        key7: new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        key8: new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        key9: [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        key10: {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      } as typeof object);
    });
  });

  describe('prune(Map)', () => {

    it('should delete `undefined` values (default options)', () => {
      const map = new Map()
        .set('key1', undefined)
        .set('key2', null)
        .set('key3', new Map<string, unknown>())
        .set('key4', new Set<unknown>())
        .set('key5', new Array<unknown>())
        .set('key6', {})
        .set('key7', new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .set('key8', new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .set('key9', [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .set('key10', {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        });

      expect(prune(map)).toEqual(new Map()
        .set('key2', null)
        .set('key3', new Map<string, unknown>())
        .set('key4', new Set<unknown>())
        .set('key5', new Array<unknown>())
        .set('key6', {})
        .set('key7', new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .set('key8', new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .set('key9', [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .set('key10', {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        }));
    });

    it('should delete `undefined` values (recursive=true)', () => {
      const map = new Map()
        .set('key1', undefined)
        .set('key2', null)
        .set('key3', new Map<string, unknown>())
        .set('key4', new Set<unknown>())
        .set('key5', new Array<unknown>())
        .set('key6', {})
        .set('key7', new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .set('key8', new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .set('key9', [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .set('key10', {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        });

      expect(prune(map, {recursive: true})).toEqual(new Map()
        .set('key2', null)
        .set('key3', new Map<string, unknown>())
        .set('key4', new Set<unknown>())
        .set('key5', new Array<unknown>())
        .set('key6', {})
        .set('key7', new Map<string, unknown>()
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .set('key8', new Set<unknown>()
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .set('key9', [
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .set('key10', {
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        }));
    });

    it('should delete `undefined` values (recursive=true, pruneIfEmpty=true)', () => {
      const map = new Map()
        .set('key1', undefined)
        .set('key2', null)
        .set('key3', new Map<string, unknown>())
        .set('key4', new Set<unknown>())
        .set('key5', new Array<unknown>())
        .set('key6', {})
        .set('key7', new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .set('key8', new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .set('key9', [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .set('key10', {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        })
        .set('key10', {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        });

      expect(prune(map, {recursive: true, pruneIfEmpty: true})).toEqual(new Map()
        .set('key2', null)
        .set('key7', new Map<string, unknown>().set('key2', null))
        .set('key8', new Set<unknown>().add(null))
        .set('key9', [null])
        .set('key10', {key2: null}));
    });

    it('should delete `undefined` values (recursive=true, pruneIfEmpty=true) (only `undefined` and empty values)', () => {
      const map = new Map()
        .set('key1', undefined)
        .set('key3', new Map<string, unknown>())
        .set('key4', new Set<unknown>())
        .set('key5', new Array<unknown>())
        .set('key6', {})
        .set('key7', new Map<string, unknown>()
          .set('key1', undefined)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .set('key8', new Set<unknown>()
          .add(undefined)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .set('key9', [
          undefined,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .set('key10', {
          key1: undefined,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        });

      expect(prune(map, {recursive: true, pruneIfEmpty: true})).toEqual(undefined);
    });

    it('should delete `undefined` values (pruneIfEmpty=true)', () => {
      const map = new Map()
        .set('key1', undefined)
        .set('key2', null)
        .set('key3', new Map<string, unknown>())
        .set('key4', new Set<unknown>())
        .set('key5', new Array<unknown>())
        .set('key6', {})
        .set('key7', new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .set('key8', new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .set('key9', [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .set('key10', {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        });

      expect(prune(map, {pruneIfEmpty: true})).toEqual(new Map()
        .set('key2', null)
        .set('key3', new Map<string, unknown>())
        .set('key4', new Set<unknown>())
        .set('key5', new Array<unknown>())
        .set('key6', {})
        .set('key7', new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .set('key8', new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .set('key9', [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .set('key10', {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        }));
    });
  });

  describe('prune(Set)', () => {

    it('should delete `undefined` values (default options)', () => {
      const set = new Set()
        .add(undefined)
        .add(null)
        .add(new Map<string, unknown>())
        .add(new Set<unknown>())
        .add(new Array<unknown>())
        .add({})
        .add(new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .add(new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .add([
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .add({
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        });

      expect(prune(set)).toEqual(new Set()
        .add(null)
        .add(new Map<string, unknown>())
        .add(new Set<unknown>())
        .add(new Array<unknown>())
        .add({})
        .add(new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .add(new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .add([
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .add({
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        }));
    });

    it('should delete `undefined` values (recursive=true)', () => {
      const set = new Set()
        .add(undefined)
        .add(null)
        .add(new Map<string, unknown>())
        .add(new Set<unknown>())
        .add(new Array<unknown>())
        .add({})
        .add(new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .add(new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .add([
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .add({
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        });

      expect(prune(set, {recursive: true})).toEqual(new Set()
        .add(null)
        .add(new Map<string, unknown>())
        .add(new Set<unknown>())
        .add(new Array<unknown>())
        .add({})
        .add(new Map<string, unknown>()
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .add(new Set<unknown>()
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .add([
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .add({
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        }));
    });

    it('should delete `undefined` values (recursive=true, pruneIfEmpty=true)', () => {
      const set = new Set()
        .add(undefined)
        .add(null)
        .add(new Map<string, unknown>())
        .add(new Set<unknown>())
        .add(new Array<unknown>())
        .add({})
        .add(new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .add(new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .add([
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .add({
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        });

      expect(prune(set, {recursive: true, pruneIfEmpty: true})).toEqual(new Set()
        .add(null)
        .add(new Map<string, unknown>().set('key2', null))
        .add(new Set<unknown>().add(null))
        .add([null])
        .add({key2: null}));
    });

    it('should delete `undefined` values (recursive=true, pruneIfEmpty=true) (only `undefined` and empty values)', () => {
      const set = new Set()
        .add(undefined)
        .add(new Map<string, unknown>())
        .add(new Set<unknown>())
        .add(new Array<unknown>())
        .add({})
        .add(new Map<string, unknown>()
          .set('key1', undefined)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .add(new Set<unknown>()
          .add(undefined)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .add([
          undefined,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .add({
          key1: undefined,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        });

      expect(prune(set, {recursive: true, pruneIfEmpty: true})).toEqual(undefined);
    });

    it('should delete `undefined` values (pruneIfEmpty=true)', () => {
      const set = new Set()
        .add(undefined)
        .add(null)
        .add(new Map<string, unknown>())
        .add(new Set<unknown>())
        .add(new Array<unknown>())
        .add({})
        .add(new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .add(new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .add([
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .add({
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        });

      expect(prune(set, {pruneIfEmpty: true})).toEqual(new Set()
        .add(null)
        .add(new Map<string, unknown>())
        .add(new Set<unknown>())
        .add(new Array<unknown>())
        .add({})
        .add(new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        )
        .add(new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        )
        .add([
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ])
        .add({
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        }));
    });
  });

  describe('prune(Array)', () => {

    it('should delete `undefined` values (default options)', () => {
      const array = [
        undefined,
        null,
        new Map<string, unknown>(),
        new Set<unknown>(),
        new Array<unknown>(),
        {},
        new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      ];

      expect(prune(array)).toEqual([
        null,
        new Map<string, unknown>(),
        new Set<unknown>(),
        new Array<unknown>(),
        {},
        new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      ] as typeof array);
    });

    it('should delete `undefined` values (recursive=true)', () => {
      const array = [
        undefined,
        null,
        new Map<string, unknown>(),
        new Set<unknown>(),
        new Array<unknown>(),
        {},
        new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      ];

      expect(prune(array, {recursive: true})).toEqual([
        null,
        new Map<string, unknown>(),
        new Set<unknown>(),
        new Array<unknown>(),
        {},
        new Map<string, unknown>()
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        new Set<unknown>()
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        [
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        {
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      ] as typeof array);
    });

    it('should delete `undefined` values (recursive=true, pruneIfEmpty=true)', () => {
      const array = [
        undefined,
        null,
        new Map<string, unknown>(),
        new Set<unknown>(),
        new Array<unknown>(),
        {},
        new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      ];

      expect(prune(array, {recursive: true, pruneIfEmpty: true})).toEqual([
        null,
        new Map<string, unknown>().set('key2', null),
        new Set<unknown>().add(null),
        [null],
        {key2: null},
      ] as typeof array);
    });

    it('should delete `undefined` values (recursive=true, pruneIfEmpty=true) (only `undefined` and empty values)', () => {
      const array = [
        undefined,
        new Map<string, unknown>(),
        new Set<unknown>(),
        new Array<unknown>(),
        {},
        new Map<string, unknown>()
          .set('key1', undefined)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        new Set<unknown>()
          .add(undefined)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        [
          undefined,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        {
          key1: undefined,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      ];

      expect(prune(array, {recursive: true, pruneIfEmpty: true})).toEqual(undefined);
    });

    it('should delete `undefined` values (pruneIfEmpty=true)', () => {
      const array = [
        undefined,
        null,
        new Map<string, unknown>(),
        new Set<unknown>(),
        new Array<unknown>(),
        {},
        new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      ];

      expect(prune(array, {pruneIfEmpty: true})).toEqual([
        null,
        new Map<string, unknown>(),
        new Set<unknown>(),
        new Array<unknown>(),
        {},
        new Map<string, unknown>()
          .set('key1', undefined)
          .set('key2', null)
          .set('key3', new Map<string, unknown>())
          .set('key4', new Set<unknown>())
          .set('key5', new Array<unknown>())
          .set('key6', {}),
        new Set<unknown>()
          .add(undefined)
          .add(null)
          .add(new Map<string, unknown>())
          .add(new Set<unknown>())
          .add(new Array<unknown>())
          .add({}),
        [
          undefined,
          null,
          new Map<string, unknown>(),
          new Set<unknown>(),
          new Array<unknown>(),
          {},
        ],
        {
          key1: undefined,
          key2: null,
          key3: new Map<string, unknown>(),
          key4: new Set<unknown>(),
          key5: new Array<unknown>(),
          key6: {},
        },
      ] as typeof array);
    });
  });

  it('should preserve object type (no type error)', () => {
    const map = new Map<string, unknown>();
    expect(prune(map) satisfies typeof map).toBe(map);

    const set = new Set<unknown>();
    expect(prune(set) satisfies typeof set).toBe(set);

    const array = new Array<unknown>();
    expect(prune(array) satisfies typeof array).toBe(array);

    const object = {key1: 'value1', key2: undefined, key3: 'value3'};
    expect(prune(object) satisfies typeof object).toBe(object);
  });

  it('should preserve object type and undefined (no type error)', () => {
    const map: Map<string, unknown> | undefined = undefined;
    expect(prune(map)?.size).toBeUndefined();

    const set = undefined as unknown as Set<unknown> | undefined;
    expect(prune(set)?.size).toBeUndefined();

    const array = undefined as unknown as Array<unknown> | undefined;
    expect(prune(array)?.length).toBeUndefined();

    const object = undefined as unknown as {key: unknown} | undefined;
    expect(prune(object)?.key).toBeUndefined();
  });
});
