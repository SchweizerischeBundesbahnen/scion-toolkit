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
import {SashboxAnimationPagePO} from './sashbox-animation-page.po';
import {waitUntilStable} from '../../helper/testing.utils';

test.describe('sci-sashbox', () => {

  test.describe('Direction Row', () => {

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

  test.describe('Direction Column', () => {

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

  test.describe('Sash Key', () => {

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

  test.describe('Sash Animation', () => {

    test('should animate entering of sash (animation enabled)', async ({page, consoleLogs}) => {
      const sashboxPage = new SashboxAnimationPagePO(page);
      await sashboxPage.navigate({
        sash1Visible: false, sash2Visible: false, sash3Visible: false,
        sash1Animated: true, sash2Animated: true, sash3Animated: true,
      });

      await test.step('Opening sash 1', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-1', true);

        // Expect sash content to grow with animation.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-1] resize'}).length).toBeGreaterThan(3);
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-1] resize'}).at(-1)).toEqual('[SashContentComponent][sash-1] resize to 200');
      });

      await test.step('Opening sash 2', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-2', true);

        // Expect sash content to grow with animation.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-2] resize'}).length).toBeGreaterThan(3);
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-2] resize'}).at(-1)).toEqual('[SashContentComponent][sash-2] resize to 200');
      });

      await test.step('Opening sash 3', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-3', true);

        // Expect sash content to grow with animation.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-3] resize'}).length).toBeGreaterThan(3);
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-3] resize'}).at(-1)).toEqual('[SashContentComponent][sash-3] resize to 200');
      });
    });

    test('should not animate entering of sash (animation disabled)', async ({page, consoleLogs}) => {
      const sashboxPage = new SashboxAnimationPagePO(page);
      await sashboxPage.navigate({
        sash1Visible: false, sash2Visible: false, sash3Visible: false,
        sash1Animated: false, sash2Animated: false, sash3Animated: false,
      });

      await test.step('Opening sash 1', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-1', true);

        // Expect sash content to display immediately.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent]'})).toEqual(['[SashContentComponent][sash-1] resize to 200']);
      });

      await test.step('Opening sash 2', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-2', true);

        // Expect sash content to display immediately.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent]'})).toEqual(['[SashContentComponent][sash-2] resize to 200']);
      });

      await test.step('Opening sash 3', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-3', true);

        // Expect sash content to display immediately.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent]'})).toEqual(['[SashContentComponent][sash-3] resize to 200']);
      });
    });

    test('should animate leaving of sash (animation enabled)', async ({page, consoleLogs}) => {
      const sashboxPage = new SashboxAnimationPagePO(page);
      await sashboxPage.navigate({
        sash1Visible: true, sash2Visible: true, sash3Visible: true,
        sash1Animated: true, sash2Animated: true, sash3Animated: true,
      });

      await test.step('Removing sash 1', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-1', false);

        // Expect sash content to shrink with animation.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-1] resize'}).length).toBeGreaterThan(3);

        // Expect sash content to be destroyed after shrinking.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-1]'}).at(-1)).toEqual('[SashContentComponent][sash-1] destroy');
      });

      await test.step('Removing sash 2', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-2', false);

        // Expect sash content to shrink with animation.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-2] resize'}).length).toBeGreaterThan(3);

        // Expect sash content to be destroyed after shrinking.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-2'}).at(-1)).toEqual('[SashContentComponent][sash-2] destroy');
      });

      await test.step('Removing sash 3', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-3', false);

        // Expect sash content to shrink with animation.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-3] resize'}).length).toBeGreaterThan(3);

        // Expect sash content to be destroyed after shrinking.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-3]'}).at(-1)).toEqual('[SashContentComponent][sash-3] destroy');
      });
    });

    test('should not animate leaving of sash (animation disabled)', async ({page, consoleLogs}) => {
      const sashboxPage = new SashboxAnimationPagePO(page);
      await sashboxPage.navigate({
        sash1Visible: true, sash2Visible: true, sash3Visible: true,
        sash1Animated: false, sash2Animated: false, sash3Animated: false,
      });

      await test.step('Removing sash 1', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-1', false);

        // Expect sash content to remove immediately.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent]'})).toEqual(['[SashContentComponent][sash-1] destroy']);
      });

      await test.step('Removing sash 2', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-2', false);

        // Expect sash content to remove immediately.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent]'})).toEqual(['[SashContentComponent][sash-2] destroy']);
      });

      await test.step('Removing sash 3', async () => {
        await waitUntilStable(() => consoleLogs.get().length);
        consoleLogs.clear();

        await sashboxPage.setVisible('sash-3', false);

        // Expect sash content to remove immediately.
        await expect.poll(() => consoleLogs.get({message: '[SashContentComponent]'})).toEqual(['[SashContentComponent][sash-3] destroy']);
      });
    });

    test('should not animate sash on first render (animation enabled)', async ({page, consoleLogs}) => {
      const sashboxPage = new SashboxAnimationPagePO(page);
      await sashboxPage.navigate({sash1Visible: true, sash1Animated: true});

      // Expect sash content to display immediately.
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent]'})).toEqual(['[SashContentComponent][sash-1] resize to 200']);

      // Remove sash.
      await sashboxPage.setVisible('sash-1', false);

      await waitUntilStable(() => consoleLogs.get().length);
      consoleLogs.clear();

      // Open sash.
      await sashboxPage.setVisible('sash-1', true);
      await waitUntilStable(() => consoleLogs.get().length);

      // Expect sash to animate when opened.
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-1] resize'}).length).toBeGreaterThan(3);
    });

    test('should not animate sash on first render (animation disabled)', async ({page, consoleLogs}) => {
      const sashboxPage = new SashboxAnimationPagePO(page);
      await sashboxPage.navigate({sash1Visible: true, sash1Animated: false});

      // Expect sash content to display immediately.
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent]'})).toEqual(['[SashContentComponent][sash-1] resize to 200']);

      // Remove sash.
      await sashboxPage.setVisible('sash-1', false);

      await waitUntilStable(() => consoleLogs.get().length);
      consoleLogs.clear();

      // Open sash.
      await sashboxPage.setVisible('sash-1', true);
      await waitUntilStable(() => consoleLogs.get().length);

      // Expect sash not to animate when opened.
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-1] resize'})).toHaveLength(1);
    });

    test('should not animate sash when toggling animation flag', async ({page, consoleLogs}) => {
      const sashboxPage = new SashboxAnimationPagePO(page);
      await sashboxPage.navigate({sash1Visible: true, sash1Animated: false});

      // Clear log.
      await waitUntilStable(() => consoleLogs.get().length);
      consoleLogs.clear();

      // Enable animation.
      await sashboxPage.enableAnimation('sash-1', true);

      // Expect sash not to animate.
      await waitUntilStable(() => consoleLogs.get().length);
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-1] resize'})).toHaveLength(0);

      // Disable animation.
      await sashboxPage.enableAnimation('sash-1', false);

      // Expect sash not to animate.
      await waitUntilStable(() => consoleLogs.get().length);
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-1] resize'})).toHaveLength(0);

      // Enable animation.
      await sashboxPage.enableAnimation('sash-1', true);

      // Expect sash not to animate.
      await waitUntilStable(() => consoleLogs.get().length);
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-1] resize'})).toHaveLength(0);
    });

    test('should not disable inner Angular animations', async ({page, consoleLogs}) => {
      const sashboxPage = new SashboxAnimationPagePO(page);
      await sashboxPage.navigate({sash4Visible: true, sash4Animated: false});

      await waitUntilStable(() => consoleLogs.get().length);
      consoleLogs.clear();

      // Run inner animation.
      await sashboxPage.animateContent();

      // Expect inner animation to run.
      await waitUntilStable(() => consoleLogs.get().length);
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-4] resize'}).length).toBeGreaterThan(3);

      // Enable sash animation.
      await sashboxPage.enableAnimation('sash-4', true);

      await waitUntilStable(() => consoleLogs.get().length);
      consoleLogs.clear();

      // Run inner animation.
      await sashboxPage.animateContent();

      // Expect inner animation to run.
      await waitUntilStable(() => consoleLogs.get().length);
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-4] resize'}).length).toBeGreaterThan(3);
    });

    test('should disable change detector on sash leave', async ({page, consoleLogs}) => {
      const sashboxPage = new SashboxAnimationPagePO(page);
      await sashboxPage.navigate({sash5Visible: true, sash5Animated: true});

      await waitUntilStable(() => consoleLogs.get().length);
      consoleLogs.clear();

      await sashboxPage.setVisible('sash-5', false);

      // Expect sash content to shrink with animation.
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-5] resize'}).length).toBeGreaterThan(3);

      // Expect sash content to be destroyed after shrinking.
      await expect.poll(() => consoleLogs.get({message: '[SashContentComponent][sash-5]'}).at(-1)).toEqual('[SashContentComponent][sash-5] destroy');
    });
  });
});
