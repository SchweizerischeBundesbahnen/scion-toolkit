/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {fromBoundingClientRect$} from './bounding-client-rect.observable';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {Arrays} from '@scion/toolkit/util';

const disposables = new Array<() => void>();

describe('fromBoundingClientRect$', () => {

  it('should detect position change', async () => {
    const testee = createDiv({
      parent: document.body,
      style: {position: 'absolute', top: '150px', left: '0', height: '100px', width: '100px', background: 'blue'},
    });

    let emissionCount = 0;
    const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
    const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
    onDestroy(() => subscription.unsubscribe());

    const {x, y} = testee.getBoundingClientRect();
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

    // Move element to the right.
    await waitUntilIdle();
    testee.style.transform = 'translate(1px, 0)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 1, y}));

    await waitUntilIdle();
    testee.style.transform = 'translate(2px, 0)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 2, y}));

    await waitUntilIdle();
    testee.style.transform = 'translate(3px, 0)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 3, y}));

    // Move element to the bottom.
    await waitUntilIdle();
    testee.style.transform = 'translate(3px, 1px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 3, y: y + 1}));

    await waitUntilIdle();
    testee.style.transform = 'translate(3px, 2px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 3, y: y + 2}));

    await waitUntilIdle();
    testee.style.transform = 'translate(3px, 3px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 3, y: y + 3}));

    // Move element to the left.
    await waitUntilIdle();
    testee.style.transform = 'translate(2px, 3px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 2, y: y + 3}));

    await waitUntilIdle();
    testee.style.transform = 'translate(1px, 3px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 1, y: y + 3}));

    await waitUntilIdle();
    testee.style.transform = 'translate(0, 3px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x, y: y + 3}));

    // Move element to the top.
    await waitUntilIdle();
    testee.style.transform = 'translate(0, 2px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x, y: y + 2}));

    await waitUntilIdle();
    testee.style.transform = 'translate(0, 1px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x, y: y + 1}));

    await waitUntilIdle();
    testee.style.transform = 'translate(0, 0px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x, y: y}));
  });

  it('should detect position change (element has border)', async () => {
    const testee = createDiv({
      parent: document.body,
      style: {position: 'absolute', top: '150px', left: '0', height: '100px', width: '100px', border: '1px solid red', background: 'blue'},
    });

    let emissionCount = 0;
    const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
    const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
    onDestroy(() => subscription.unsubscribe());

    const {x, y} = testee.getBoundingClientRect();
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

    // Move element to the right.
    await waitUntilIdle();
    testee.style.transform = 'translate(1px, 0)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 1, y}));

    await waitUntilIdle();
    testee.style.transform = 'translate(2px, 0)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 2, y}));

    await waitUntilIdle();
    testee.style.transform = 'translate(3px, 0)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 3, y}));

    // Move element to the bottom.
    await waitUntilIdle();
    testee.style.transform = 'translate(3px, 1px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 3, y: y + 1}));

    await waitUntilIdle();
    testee.style.transform = 'translate(3px, 2px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 3, y: y + 2}));

    await waitUntilIdle();
    testee.style.transform = 'translate(3px, 3px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 3, y: y + 3}));

    // Move element to the left.
    await waitUntilIdle();
    testee.style.transform = 'translate(2px, 3px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 2, y: y + 3}));

    await waitUntilIdle();
    testee.style.transform = 'translate(1px, 3px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 1, y: y + 3}));

    await waitUntilIdle();
    testee.style.transform = 'translate(0, 3px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x, y: y + 3}));

    // Move element to the top.
    await waitUntilIdle();
    testee.style.transform = 'translate(0, 2px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x, y: y + 2}));

    await waitUntilIdle();
    testee.style.transform = 'translate(0, 1px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x, y: y + 1}));

    await waitUntilIdle();
    testee.style.transform = 'translate(0, 0px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x, y: y}));
  });

  it('should detect position change when layout changes', async () => {
    // Layout:
    // +---------------+
    // |     top       |
    // +------+--------+
    // | left | testee |
    // +------+--------+
    createDiv({
      parent: document.body,
      style: {position: 'absolute', top: '150px', left: '0', width: '500px', background: 'gray'},
      children: [
        createDiv({id: 'top', style: {height: '50px', background: 'red'}}),
        createDiv({
          style: {display: 'flex'},
          children: [
            createDiv({id: 'left', style: {flex: 'none', width: '50px', background: 'yellow'}}),
            createDiv({id: 'testee', style: {flex: 'auto', height: '100px', background: 'blue'}}),
          ],
        }),
      ],
    });

    let emissionCount = 0;
    const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
    const testee = queryElement('div#testee');
    const top = queryElement('div#top');
    const left = queryElement('div#left');
    const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
    onDestroy(() => subscription.unsubscribe());

    const {x, y} = testee.getBoundingClientRect();
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

    // Change height of 'div#top' from 50px to 75px.
    await waitUntilIdle();
    top.style.height = '75px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 25}));

    // Change width of 'div#left' from 50px to 75px.
    await waitUntilIdle();
    left.style.width = '75px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 25, y: y + 25}));
  });

  it('should detect position change when viewport overflows horizontally', async () => {
    const container = createDiv({
      parent: document.body,
      style: {position: 'absolute', top: '150px', left: '0', width: '500px', background: 'gray'},
      children: [
        createDiv({id: 'testee', style: {height: '50px', background: 'blue'}}),
      ],
    });

    let emissionCount = 0;
    const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
    const testee = queryElement('div#testee');
    const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
    onDestroy(() => subscription.unsubscribe());

    const {x, y} = testee.getBoundingClientRect();
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

    // Expect no horizontal scrollbar.
    expect(document.documentElement.scrollWidth).toEqual(document.documentElement.clientWidth);

    // Simulate horizontal scrollbar.
    container.style.width = '200vw';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

    // Expect horizontal scrollbar to display.
    expect(document.documentElement.scrollWidth).toBeGreaterThan(document.documentElement.clientWidth);

    // Move element to the right.
    await waitUntilIdle();
    testee.style.marginLeft = '25px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 25, y}));

    // Move element to the bottom.
    await waitUntilIdle();
    testee.style.marginTop = '25px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 25, y: y + 25}));
  });

  it('should detect position change when viewport overflows vertically', async () => {
    const container = createDiv({
      parent: document.body,
      style: {position: 'absolute', top: '150px', left: '0', width: '500px', background: 'gray'},
      children: [
        createDiv({id: 'testee', style: {height: '50px', background: 'blue'}}),
      ],
    });

    let emissionCount = 0;
    const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
    const testee = queryElement('div#testee');
    const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
    onDestroy(() => subscription.unsubscribe());

    const {x, y} = testee.getBoundingClientRect();
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

    // Expect no vertical scrollbar.
    expect(document.documentElement.scrollHeight).toEqual(document.documentElement.clientHeight);

    // Simulate vertical scrollbar.
    container.style.height = '200vh';

    // Expect vertical scrollbar to display.
    expect(document.documentElement.scrollHeight).toBeGreaterThan(document.documentElement.clientHeight);

    // Move element to the right.
    await waitUntilIdle();
    testee.style.marginLeft = '25px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 25, y}));

    // Move element to the bottom.
    await waitUntilIdle();
    testee.style.marginTop = '25px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 25, y: y + 25}));
    await new Promise<void>(resolve => setTimeout(() => resolve()));
  });

  it('should emit when resizing the element', async () => {
    const testee = createDiv({
      parent: document.body,
      style: {position: 'absolute', top: '150px', left: '0', height: '100px', width: '100px', background: 'blue'},
    });

    let emissionCount = 0;
    const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
    const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
    onDestroy(() => subscription.unsubscribe());

    const {x, y} = testee.getBoundingClientRect();
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y, width: 100, height: 100}));

    await waitUntilIdle();
    testee.style.width = '110px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y, width: 110, height: 100}));

    await waitUntilIdle();
    testee.style.width = '90px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y, width: 90, height: 100}));

    await waitUntilIdle();
    testee.style.width = '100px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y, width: 100, height: 100}));

    await waitUntilIdle();
    testee.style.height = '110px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y, width: 100, height: 110}));

    await waitUntilIdle();
    testee.style.height = '90px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y, width: 100, height: 90}));

    await waitUntilIdle();
    testee.style.height = '100px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y, width: 100, height: 100}));
  });

  it('should detect position change when scrolled the viewport', async () => {
    createDiv({
      id: 'container',
      parent: document.body,
      style: {position: 'absolute', top: '150px', left: '0'},
      children: [
        createDiv({id: 'filler', style: {height: '0', background: 'gray'}}),
        createDiv({id: 'testee', style: {width: '100px', height: '100px', background: 'blue'}}),
      ],
    });

    const testee = queryElement('div#testee');
    const filler = queryElement('div#filler');

    let emissionCount = 0;
    const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
    const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
    onDestroy(() => subscription.unsubscribe());

    await emitCaptor.waitUntilEmitCount(++emissionCount);

    // Add vertical overflow.
    await waitUntilIdle();
    filler.style.height = '2000px';
    await emitCaptor.waitUntilEmitCount(++emissionCount);

    // Capture bounding box.
    const {x: x1, y: y1} = testee.getBoundingClientRect();

    // Expect emission when moving element to the right.
    await waitUntilIdle();
    testee.style.transform = 'translateX(10px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x1 + 10, y: y1, width: 100, height: 100}));

    // Expect emission when moving element to the right.
    await waitUntilIdle();
    testee.style.transform = 'translateX(20px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x1 + 20, y: y1, width: 100, height: 100}));

    // Expect emission when moving element to the left.
    await waitUntilIdle();
    testee.style.transform = '';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x1, y: y1, width: 100, height: 100}));

    // Expect emission when moving element to the top.
    await waitUntilIdle();
    testee.style.transform = 'translateY(-10px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x1, y: y1 - 10, width: 100, height: 100}));

    // Expect emission when moving element to the top.
    await waitUntilIdle();
    testee.style.transform = 'translateY(-20px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x1, y: y1 - 20, width: 100, height: 100}));

    // Expect emission when moving element to the bottom.
    await waitUntilIdle();
    testee.style.transform = '';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x1, y: y1, width: 100, height: 100}));

    // Move viewport to the bottom.
    await waitUntilIdle();
    document.documentElement.scrollTop = 2500;
    await emitCaptor.waitUntilEmitCount(++emissionCount);

    // Capture bounding box.
    const {x: x2, y: y2} = testee.getBoundingClientRect();

    // Expect emission when moving element to the right.
    await waitUntilIdle();
    testee.style.transform = 'translateX(10px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x2 + 10, y: y2, width: 100, height: 100}));

    // Expect emission when moving element to the right.
    await waitUntilIdle();
    testee.style.transform = 'translateX(20px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x2 + 20, y: y2, width: 100, height: 100}));

    // Expect emission when moving element to the top.
    await waitUntilIdle();
    testee.style.transform = 'translateY(-10px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x2, y: y2 - 10, width: 100, height: 100}));

    // Expect emission when moving element to the top.
    await waitUntilIdle();
    testee.style.transform = 'translateY(-20px)';
    await emitCaptor.waitUntilEmitCount(++emissionCount);
    expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x2, y: y2 - 20, width: 100, height: 100}));
  });

  it('should position document root element (html)', () => {
    // Precondition: Ensure document root not to be positioned so its position will be changed to 'relative'.
    document.documentElement.style.setProperty('position', 'static');

    const subscription = fromBoundingClientRect$(document.body).subscribe();
    onDestroy(() => subscription.unsubscribe());

    // Remove style from precondition.
    document.documentElement.style.removeProperty('position');

    // Expect document root to be positioned.
    expect(getComputedStyle(document.documentElement)).toEqual(jasmine.objectContaining({
      position: 'relative',
    }));
  });

  it('should allow overriding positioning of document root element (html)', () => {
    // Precondition: Ensure document root not to be positioned so its position will be changed to 'relative'.
    document.documentElement.style.setProperty('position', 'static');

    const subscription = fromBoundingClientRect$(document.body).subscribe();
    onDestroy(() => subscription.unsubscribe());

    // Remove style from precondition.
    document.documentElement.style.removeProperty('position');

    // Expect document root to be positioned.
    expect(getComputedStyle(document.documentElement)).toEqual(jasmine.objectContaining({
      position: 'relative',
    }));

    // Override positioning of root element.
    const styleSheet = new CSSStyleSheet();
    styleSheet.insertRule(`
    html {
      position: absolute;
    }`);
    document.adoptedStyleSheets.push(styleSheet);
    onDestroy(() => Arrays.remove(document.adoptedStyleSheets, styleSheet));

    // Expect overrides to be applied.
    expect(getComputedStyle(document.documentElement)).toEqual(jasmine.objectContaining({
      position: 'absolute',
    }));
  });

  describe('Moving element out of the viewport', () => {

    it('should emit until moved the element out of the viewport (moving element to the right)', async () => {
      createDiv({
        id: 'container',
        parent: document.body,
        style: {position: 'absolute', top: '150px', left: '0', height: '100px', width: '100px', overflow: 'auto', background: 'gray'},
        children: [
          createDiv({id: 'testee', style: {position: 'absolute', top: '0', left: '0', height: '5px', width: '5px', background: 'blue'}}),
        ],
      });

      let emissionCount = 0;
      const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
      const testee = queryElement('div#testee');
      const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
      onDestroy(() => subscription.unsubscribe());

      const {x, y} = testee.getBoundingClientRect();
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

      await waitUntilIdle();
      testee.style.left = '94px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 94, y}));

      await waitUntilIdle();
      testee.style.left = '95px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 95, y}));

      await waitUntilIdle();
      testee.style.left = '96px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 96, y}));

      await waitUntilIdle();
      testee.style.left = '97px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 97, y}));

      await waitUntilIdle();
      testee.style.left = '98px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 98, y}));

      await waitUntilIdle();
      testee.style.left = '99px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 99, y}));

      await waitUntilIdle();
      testee.style.left = '100px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 100, y}));

      await waitUntilIdle();
      testee.style.left = '101px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 100, y}));

      await waitUntilIdle();
      testee.style.left = '102px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 100, y}));

      await waitUntilIdle();
      testee.style.left = '101px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 100, y}));

      await waitUntilIdle();
      testee.style.left = '100px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 100, y}));

      await waitUntilIdle();
      testee.style.left = '99px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 99, y}));

      await waitUntilIdle();
      testee.style.left = '98px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 98, y}));

      await waitUntilIdle();
      testee.style.left = '97px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 97, y}));

      await waitUntilIdle();
      testee.style.left = '96px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 96, y}));

      await waitUntilIdle();
      testee.style.left = '95px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 95, y}));

      await waitUntilIdle();
      testee.style.left = '94px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 94, y}));
    });

    it('should emit until moved the element out of the viewport (moving element to the left)', async () => {
      createDiv({
        id: 'container',
        parent: document.body,
        style: {position: 'absolute', top: '150px', left: '0', height: '100px', width: '100px', overflow: 'auto', background: 'gray'},
        children: [
          createDiv({id: 'testee', style: {position: 'absolute', top: '0', left: '0', height: '5px', width: '5px', background: 'blue'}}),
        ],
      });

      let emissionCount = 0;
      const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
      const testee = queryElement('div#testee');
      const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
      onDestroy(() => subscription.unsubscribe());

      const {x, y} = testee.getBoundingClientRect();
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

      await waitUntilIdle();
      testee.style.left = '2px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 2, y}));

      await waitUntilIdle();
      testee.style.left = '1px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 1, y}));

      await waitUntilIdle();
      testee.style.left = '0';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x, y}));

      await waitUntilIdle();
      testee.style.left = '-1px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 1, y}));

      await waitUntilIdle();
      testee.style.left = '-2px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 2, y}));

      await waitUntilIdle();
      testee.style.left = '-3px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 3, y}));

      await waitUntilIdle();
      testee.style.left = '-4px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 4, y}));

      await waitUntilIdle();
      testee.style.left = '-5px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 5, y}));

      await waitUntilIdle();
      testee.style.left = '-6px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 5, y}));

      await waitUntilIdle();
      testee.style.left = '-7px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 5, y}));

      await waitUntilIdle();
      testee.style.left = '-6px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 5, y}));

      await waitUntilIdle();
      testee.style.left = '-5px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 5, y}));

      await waitUntilIdle();
      testee.style.left = '-4px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 4, y}));

      await waitUntilIdle();
      testee.style.left = '-3px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 3, y}));

      await waitUntilIdle();
      testee.style.left = '-2px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 2, y}));

      await waitUntilIdle();
      testee.style.left = '-1px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x - 1, y}));

      await waitUntilIdle();
      testee.style.left = '0px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x, y}));

      await waitUntilIdle();
      testee.style.left = '1px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 1, y}));

      await waitUntilIdle();
      testee.style.left = '2px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x: x + 2, y}));
    });

    it('should emit until moved the element out of the viewport (moving element to the bottom)', async () => {
      createDiv({
        id: 'container',
        parent: document.body,
        style: {position: 'absolute', top: '150px', left: '0', height: '100px', width: '100px', overflow: 'auto', background: 'gray'},
        children: [
          createDiv({id: 'testee', style: {position: 'absolute', top: '0', left: '0', height: '5px', width: '5px', background: 'blue'}}),
        ],
      });

      let emissionCount = 0;
      const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
      const testee = queryElement('div#testee');
      const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
      onDestroy(() => subscription.unsubscribe());

      const {x, y} = testee.getBoundingClientRect();
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

      await waitUntilIdle();
      testee.style.top = '94px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 94}));

      await waitUntilIdle();
      testee.style.top = '95px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 95}));

      await waitUntilIdle();
      testee.style.top = '96px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 96}));

      await waitUntilIdle();
      testee.style.top = '97px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 97}));

      await waitUntilIdle();
      testee.style.top = '98px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 98}));

      await waitUntilIdle();
      testee.style.top = '99px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 99}));

      await waitUntilIdle();
      testee.style.top = '100px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 100}));

      await waitUntilIdle();
      testee.style.top = '101px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 100}));

      await waitUntilIdle();
      testee.style.top = '102px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 100}));

      await waitUntilIdle();
      testee.style.top = '101px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 100}));

      await waitUntilIdle();
      testee.style.top = '100px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 100}));

      await waitUntilIdle();
      testee.style.top = '99px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 99}));

      await waitUntilIdle();
      testee.style.top = '98px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 98}));

      await waitUntilIdle();
      testee.style.top = '97px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 97}));

      await waitUntilIdle();
      testee.style.top = '96px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 96}));

      await waitUntilIdle();
      testee.style.top = '95px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 95}));

      await waitUntilIdle();
      testee.style.top = '94px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 94}));
    });

    it('should emit until moved the element out of the viewport (moving element to the top)', async () => {
      createDiv({
        id: 'container',
        parent: document.body,
        style: {position: 'absolute', top: '150px', left: '0', height: '100px', width: '100px', overflow: 'auto', background: 'gray'},
        children: [
          createDiv({id: 'testee', style: {position: 'absolute', top: '0', left: '0', height: '5px', width: '5px', background: 'blue'}}),
        ],
      });

      let emissionCount = 0;
      const emitCaptor = new ObserveCaptor<DOMRect>(toJsonDOMRect);
      const testee = queryElement('div#testee');
      const subscription = fromBoundingClientRect$(testee).subscribe(emitCaptor);
      onDestroy(() => subscription.unsubscribe());

      const {x, y} = testee.getBoundingClientRect();
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

      await waitUntilIdle();
      testee.style.top = '2px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 2}));

      await waitUntilIdle();
      testee.style.top = '1px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 1}));

      await waitUntilIdle();
      testee.style.top = '0';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

      await waitUntilIdle();
      testee.style.top = '-1px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 1}));

      await waitUntilIdle();
      testee.style.top = '-2px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 2}));

      await waitUntilIdle();
      testee.style.top = '-3px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 3}));

      await waitUntilIdle();
      testee.style.top = '-4px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 4}));

      await waitUntilIdle();
      testee.style.top = '-5px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 5}));

      await waitUntilIdle();
      testee.style.top = '-6px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 5}));

      await waitUntilIdle();
      testee.style.top = '-7px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 5}));

      await waitUntilIdle();
      testee.style.top = '-6px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 5}));

      await waitUntilIdle();
      testee.style.top = '-5px'; // out of viewport
      await expectAsync(emitCaptor.waitUntilEmitCount(emissionCount + 1, 250)).toBeRejected();
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 5}));

      await waitUntilIdle();
      testee.style.top = '-4px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 4}));

      await waitUntilIdle();
      testee.style.top = '-3px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 3}));

      await waitUntilIdle();
      testee.style.top = '-2px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 2}));

      await waitUntilIdle();
      testee.style.top = '-1px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y - 1}));

      await waitUntilIdle();
      testee.style.top = '0px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y}));

      await waitUntilIdle();
      testee.style.top = '1px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 1}));

      await waitUntilIdle();
      testee.style.top = '2px';
      await emitCaptor.waitUntilEmitCount(++emissionCount);
      expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({x, y: y + 2}));
    });
  });

  function onDestroy(callback: () => void): void {
    disposables.push(callback);
  }

  function createDiv(options: ElementCreateOptions): HTMLElement {
    const div = document.createElement('div');
    onDestroy(() => div.remove());
    options.id && (div.id = options.id);
    options.style && setStyle(div, options.style);
    options.parent?.appendChild(div);
    options.children?.forEach(child => div.appendChild(child));
    return div;
  }

  afterEach(() => {
    disposables.forEach(callback => callback());
    disposables.length = 0;
  });
});

interface ElementCreateOptions {
  id?: string;
  parent?: Node;
  style?: {[style: string]: string};
  children?: Node[];
}

/**
 * Waits for the browser to become idle to have "realistic" Intersection Observer behavior.
 *
 * Without throttling, the Intersection Observer may emit events even if the element is outside the viewport, a behavior only observed in unit tests.
 */
async function waitUntilIdle(): Promise<void> {
  await new Promise<void>(resolve => requestIdleCallback(() => resolve()));
}

function queryElement(selector: string): HTMLElement {
  return document.querySelector(selector)!;
}

function setStyle(element: HTMLElement, style: {[style: string]: string}): void {
  Object.keys(style).forEach(key => element.style.setProperty(key, style[key]));
}

/**
 * Projects the provided {@link DOMRect} to an object literal for better error message.
 */
function toJsonDOMRect(domRect: DOMRect): DOMRect {
  return domRect.toJSON() as DOMRect;
}
