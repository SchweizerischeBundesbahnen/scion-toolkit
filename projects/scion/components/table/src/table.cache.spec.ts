/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {signal} from '@angular/core';
import {TableCache, TableCacheRow} from './table.cache';

describe('TableCache', () => {
  it('should project loaded rows at their flattened index', () => {
    const cache = new TableCache<string>();
    cache.setTotalCount(4);
    cache.set('2-4', {
      start: 2,
      end: 4,
      rows: signal([createRow('two'), createRow('three')]),
      dispose: () => void 0,
    });

    expect([...cache.rowsByIndex()]).toEqual([
      [2, jasmine.objectContaining({id: 'two'})],
      [3, jasmine.objectContaining({id: 'three'})],
    ]);
  });

  it('should include expanded child slots in the flattened projection', () => {
    const cache = new TableCache<string>();
    const root = createRow('root', true);
    const sibling = createRow('sibling');
    root.childrenCache.setTotalCount(3);
    root.childrenCache.set('0-2', {
      start: 0,
      end: 2,
      rows: signal([createRow('child-0'), createRow('child-1')]),
      dispose: () => void 0,
    });
    cache.setTotalCount(2);
    cache.set('0-2', {
      start: 0,
      end: 2,
      rows: signal([root, sibling]),
      dispose: () => void 0,
    });

    expect(cache.totalCount()).toBe(5);
    expect([...cache.rowsByIndex()].map(([index, row]) => [index, row.id])).toEqual([
      [0, 'root'],
      [1, 'child-0'],
      [2, 'child-1'],
      [4, 'sibling'],
    ]);
  });

  it('should find missing pages in the visible range', () => {
    const cache = new TableCache<string>();
    const root = createRow('root', true);
    root.childrenCache.setTotalCount(6);
    root.childrenCache.set('0-2', {
      start: 0,
      end: 2,
      rows: signal([createRow('child-0'), createRow('child-1')]),
      dispose: () => void 0,
    });
    cache.setTotalCount(1);
    cache.set('0-2', {start: 0, end: 2, rows: signal([root]), dispose: () => void 0});

    expect(cache.findPagesToLoad(3, 7, 2)).toEqual([
      {cache: root.childrenCache, parent: root, page: 1},
      {cache: root.childrenCache, parent: root, page: 2},
    ]);
  });

  it('should find deep missing pages', () => {
    const cache = new TableCache<string>();
    cache.setTotalCount(1);
    const root = createRow('root', true);
    root.childrenCache.setTotalCount(1);
    cache.set('0-1', {start: 0, end: 1, rows: signal([root]), dispose: () => void 0});

    const level1 = createRow('level-1', true);
    level1.childrenCache.setTotalCount(1);
    root.childrenCache.set('0-1', {start: 0, end: 1, rows: signal([level1]), dispose: () => void 0});

    const level2 = createRow('level-2', true);
    level2.childrenCache.setTotalCount(2);
    level1.childrenCache.set('0-1', {start: 0, end: 1, rows: signal([level2]), dispose: () => void 0});

    const level3 = createRow('level-3', true);
    level3.childrenCache.setTotalCount(2);
    level2.childrenCache.set('0-1', {start: 0, end: 1, rows: signal([level3]), dispose: () => void 0});

    expect(cache.findPagesToLoad(0, 10, 1)).toEqual([
      {cache: level3.childrenCache, parent: level3, page: 0},
      {cache: level3.childrenCache, parent: level3, page: 1},
      {cache: level2.childrenCache, parent: level2, page: 1},
    ]);
  });

  it('should find an missing expanded subtree before the visible range', () => {
    const cache = new TableCache<string>();
    const root = createRow('root', true);
    cache.setTotalCount(10);
    cache.set('0-2', {
      start: 0,
      end: 2,
      rows: signal([root, createRow('sibling')]),
      dispose: () => void 0,
    });

    expect(cache.findPagesToLoad(5, 7, 2)).toContain({cache: root.childrenCache, parent: root, page: 0});
  });
});

function createRow(id: string, expanded: boolean = false): TableCacheRow<string> {
  return {
    id,
    item: id,
    level: 0,
    expanded: signal(expanded),
    childrenCache: new TableCache<string>(),
  };
}
