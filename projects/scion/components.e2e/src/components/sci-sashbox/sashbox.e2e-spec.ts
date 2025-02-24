/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {test} from '../../fixtures';
import {SashboxPagePO} from './sashbox-page.po';
import {expect} from '@playwright/test';

test.describe('sci-sashbox', () => {

  test.describe('direction row', () => {

    test('should shrink sash to 0', async ({page}) => {
      const sashboxPage = new SashboxPagePO(page);
      await sashboxPage.navigate();

      await sashboxPage.enterDirection('row');
      await sashboxPage.enterSashProperties('sash-1', {size: '1'});
      await sashboxPage.enterSashProperties('sash-2', {size: '1'});
      await sashboxPage.enterSashProperties('sash-3', {size: '1'});

      const sash1 = await sashboxPage.getSashBoundingBox('sash-1');
      const sash2 = await sashboxPage.getSashBoundingBox('sash-2');
      const sash3 = await sashboxPage.getSashBoundingBox('sash-3');

      // Move splitter-1 beyond sash size.
      await sashboxPage.moveSplitter('splitter-1', {distance: sash2.width + 100, steps: 5});

      // Expect sash-2 to have size 0.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-2').then(bounds => bounds.width)).toBe(0);

      // Expect sash-1 to have size of sash-1 and sash-2.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-1').then(bounds => bounds.width)).toBeCloseTo(sash1.width + sash2.width, 0);

      // Expect sash-3 to have same size.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-3').then(bounds => bounds.width)).toBeCloseTo(sash3.width, 0);
    });

    test('should shrink sash to min size', async ({page}) => {
      const sashboxPage = new SashboxPagePO(page);
      await sashboxPage.navigate();

      await sashboxPage.enterDirection('row');
      await sashboxPage.enterSashProperties('sash-1', {size: '1'});
      await sashboxPage.enterSashProperties('sash-2', {size: '1', minSize: '50px'});
      await sashboxPage.enterSashProperties('sash-3', {size: '1'});

      const sash1 = await sashboxPage.getSashBoundingBox('sash-1');
      const sash2 = await sashboxPage.getSashBoundingBox('sash-2');
      const sash3 = await sashboxPage.getSashBoundingBox('sash-3');

      // Move splitter-1 beyond sash size.
      await sashboxPage.moveSplitter('splitter-1', {distance: sash2.width + 100, steps: 5});

      // Expect sash-2 to have size 0.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-2').then(bounds => bounds.width)).toBeCloseTo(50, 0);

      // Expect sash-1 to have size of sash-1 and sash-2.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-1').then(bounds => bounds.width)).toBeCloseTo(sash1.width + sash2.width - 50, 0);

      // Expect sash-3 to have same size.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-3').then(bounds => bounds.width)).toBeCloseTo(sash3.width, 0);
    });
  });

  test.describe('direction column', () => {

    test('should shrink sash to 0', async ({page}) => {
      const sashboxPage = new SashboxPagePO(page);
      await sashboxPage.navigate();

      await sashboxPage.enterDirection('column');
      await sashboxPage.enterSashProperties('sash-1', {size: '1'});
      await sashboxPage.enterSashProperties('sash-2', {size: '1'});
      await sashboxPage.enterSashProperties('sash-3', {size: '1'});

      const sash1 = await sashboxPage.getSashBoundingBox('sash-1');
      const sash2 = await sashboxPage.getSashBoundingBox('sash-2');
      const sash3 = await sashboxPage.getSashBoundingBox('sash-3');

      // Move splitter-1 beyond sash size.
      await sashboxPage.moveSplitter('splitter-1', {distance: sash2.height + 100, steps: 5});

      // Expect sash-2 to have size 0.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-2').then(bounds => bounds.height)).toBe(0);

      // Expect sash-1 to have size of sash-1 and sash-2.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-1').then(bounds => bounds.height)).toBeCloseTo(sash1.height + sash2.height, 0);

      // Expect sash-3 to have same size.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-3').then(bounds => bounds.height)).toBeCloseTo(sash3.height, 0);
    });

    test('should shrink sash to min size', async ({page}) => {
      const sashboxPage = new SashboxPagePO(page);
      await sashboxPage.navigate();

      await sashboxPage.enterDirection('column');
      await sashboxPage.enterSashProperties('sash-1', {size: '1'});
      await sashboxPage.enterSashProperties('sash-2', {size: '1', minSize: '50px'});
      await sashboxPage.enterSashProperties('sash-3', {size: '1'});

      const sash1 = await sashboxPage.getSashBoundingBox('sash-1');
      const sash2 = await sashboxPage.getSashBoundingBox('sash-2');
      const sash3 = await sashboxPage.getSashBoundingBox('sash-3');

      // Move splitter-1 beyond sash size.
      await sashboxPage.moveSplitter('splitter-1', {distance: sash2.height + 100, steps: 5});

      // Expect sash-2 to have size 0.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-2').then(bounds => bounds.height)).toBeCloseTo(50, 0);

      // Expect sash-1 to have size of sash-1 and sash-2.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-1').then(bounds => bounds.height)).toBeCloseTo(sash1.height + sash2.height - 50, 0);

      // Expect sash-3 to have same size.
      await expect.poll(() => sashboxPage.getSashBoundingBox('sash-3').then(bounds => bounds.height)).toBeCloseTo(sash3.height, 0);
    });
  });

  test('should emit sash size on sash end (sashes with key)', async ({page, consoleLogs}) => {
    const sashboxPage = new SashboxPagePO(page);
    await sashboxPage.navigate();

    await sashboxPage.enterDirection('row');
    await sashboxPage.enterSashProperties('sash-1', {size: '100px', key: 'sash1'});
    await sashboxPage.enterSashProperties('sash-2', {size: '500px', key: 'sash2'});
    await sashboxPage.enterSashProperties('sash-3', {size: '50px', key: 'sash3'});

    // Move splitter 100px to the right.
    await sashboxPage.moveSplitter('splitter-1', {distance: 100, steps: 5});

    await expect.poll(() => consoleLogs.get({message: /\[SciSashboxPageComponent:onSashEnd]/})).toEqual([
      `[SciSashboxPageComponent:onSashEnd] [200,400,50]`,
    ]);
    await expect.poll(() => consoleLogs.get({message: /\[SciSashboxPageComponent:onSashEnd2]/})).toEqual([
      `[SciSashboxPageComponent:onSashEnd2] {"sash1":200,"sash2":400,"sash3":50}`,
    ]);
  });

  test('should emit sash size on sash end (sashes with and without keys)', async ({page, consoleLogs}) => {
    const sashboxPage = new SashboxPagePO(page);
    await sashboxPage.navigate();

    await sashboxPage.enterDirection('row');
    await sashboxPage.enterSashProperties('sash-1', {size: '100px', key: 'sash1'});
    await sashboxPage.enterSashProperties('sash-2', {size: '500px'});
    await sashboxPage.enterSashProperties('sash-3', {size: '50px', key: 'sash3'});

    // Move splitter 100px to the right.
    await sashboxPage.moveSplitter('splitter-1', {distance: 100, steps: 5});

    await expect.poll(() => consoleLogs.get({message: /\[SciSashboxPageComponent:onSashEnd]/})).toEqual([
      `[SciSashboxPageComponent:onSashEnd] [200,400,50]`,
    ]);
    await expect.poll(() => consoleLogs.get({message: /\[SciSashboxPageComponent:onSashEnd2]/})).toEqual([
      `[SciSashboxPageComponent:onSashEnd2] {"1":400,"sash1":200,"sash3":50}`,
    ]);
  });

  test('should emit sash size on sash end (sashes without key)', async ({page, consoleLogs}) => {
    const sashboxPage = new SashboxPagePO(page);
    await sashboxPage.navigate();

    await sashboxPage.enterDirection('row');
    await sashboxPage.enterSashProperties('sash-1', {size: '100px'});
    await sashboxPage.enterSashProperties('sash-2', {size: '500px'});
    await sashboxPage.enterSashProperties('sash-3', {size: '50px'});

    // Move splitter 100px to the right.
    await sashboxPage.moveSplitter('splitter-1', {distance: 100, steps: 5});

    await expect.poll(() => consoleLogs.get({message: /\[SciSashboxPageComponent:onSashEnd]/})).toEqual([
      `[SciSashboxPageComponent:onSashEnd] [200,400,50]`,
    ]);
    await expect.poll(() => consoleLogs.get({message: /\[SciSashboxPageComponent:onSashEnd2]/})).toEqual([
      `[SciSashboxPageComponent:onSashEnd2] {"0":200,"1":400,"2":50}`,
    ]);
  });
});
