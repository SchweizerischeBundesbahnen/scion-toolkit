/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {fromBoundingClientRect$} from './bounding-client-rect.observable';
import {ObserveCaptor} from '@scion/toolkit/testing';

describe('fromBoundingClientRect$', () => {

  // ** TESTS OPERATE ON THE FOLLOWING DOM **
  //
  // +----------+ +-------------------------------+ +-----------+
  // | DIV#left | |           DIV#middle          | | DIV#right |
  // |          | |                               | |           |
  // |          | | +---------------------------+ | |           |
  // |          | | |        DIV#middle_1       | | |           |
  // |          | | +---------------------------+ | |           |
  // |          | |                               | |           |
  // |          | | +---------------------------+ | |           |
  // |          | | |        DIV#middle_2       | | |           |
  // |          | | |                           | | |           |
  // |          | | | +-----------------------+ | | |           |
  // |          | | | |      DIV#middle_3     | | | |           |
  // |          | | | +-----------------------+ | | |           |
  // |          | | |                           | | |           |
  // |          | | |     +--------------+      | | |           |
  // |          | | |     |  DIV#testee  |      | | |           |
  // |          | | |     |              |      | | |           |
  // |          | | |     |    100x30    |      | | |           |
  // |          | | |     | horizontally |      | | |           |
  // |          | | |     |   centered   |      | | |           |
  // |          | | |     +--------------+      | | |           |
  // |          | | +---------------------------+ | |           |
  // +----------+ +-------------------------------+ +-----------+
  beforeEach(() => setupTestLayout());
  afterEach(() => $('div#root').remove());

  it('should emit on layout change if affecting the observed element\'s position or size', async () => {
    const clientRectCaptures = new ClientRects().capture();
    const emitCaptor = new ObserveCaptor<ClientRect>();

    // TEST: Subscribe to fromBoundingClientRect$
    fromBoundingClientRect$($('div#testee')).subscribe(emitCaptor);

    // expect the initial ClientRect to be emitted
    await emitCaptor.waitUntilEmitCount(1);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining(clientRectCaptures.get('div#testee')));

    // add 20px to the width of DIV#left; expect testee to be moved by 20px horizontally
    addDelta('div#left', {width: 20});
    await emitCaptor.waitUntilEmitCount(2);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({
      top: clientRectCaptures.get('div#testee').top,
      left: clientRectCaptures.get('div#testee').left + 20,
      width: 100,
      height: 30,
    }));

    // add 20px to the width of DIV#middle; expect testee to be moved by 10px horizontally, as centered horizontally
    clientRectCaptures.capture();
    addDelta('div#middle', {minWidth: 20});
    await emitCaptor.waitUntilEmitCount(3);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({
      top: clientRectCaptures.get('div#testee').top,
      left: clientRectCaptures.get('div#testee').left + 10,
      width: 100,
      height: 30,
    }));

    // add 20px to the width of DIV#middle_1; expect testee to be moved by 10px horizontally, as centered horizontally
    clientRectCaptures.capture();
    addDelta('div#middle_1', {minWidth: 20});
    await emitCaptor.waitUntilEmitCount(4);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({
      top: clientRectCaptures.get('div#testee').top,
      left: clientRectCaptures.get('div#testee').left + 10,
      width: 100,
      height: 30,
    }));

    // add 20px to the width of DIV#middle_2; expect testee to be moved by 10px horizontally, as centered horizontally
    clientRectCaptures.capture();
    addDelta('div#middle_2', {minWidth: 20});
    await emitCaptor.waitUntilEmitCount(5);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({
      top: clientRectCaptures.get('div#testee').top,
      left: clientRectCaptures.get('div#testee').left + 10,
      width: 100,
      height: 30,
    }));

    // add 20px to the width of DIV#middle_3; expect testee to be moved by 10px horizontally, as centered horizontally
    clientRectCaptures.capture();
    addDelta('div#middle_3', {minWidth: 20});
    await emitCaptor.waitUntilEmitCount(6);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({
      top: clientRectCaptures.get('div#testee').top,
      left: clientRectCaptures.get('div#testee').left + 10,
      width: 100,
      height: 30,
    }));

    // add 20px to the width of DIV#right; expect testee not to be moved
    clientRectCaptures.capture();
    addDelta('div#right', {width: 20});
    await expectAsync(emitCaptor.waitUntilEmitCount(7, 250)).toBeRejected();

    // add 20px to the height of DIV#left; expect testee not to be moved as vertically aligned on top
    addDelta('div#left', {minHeight: 20});
    await expectAsync(emitCaptor.waitUntilEmitCount(7, 250)).toBeRejected();

    // add 20px to the height of DIV#middle; expect testee not to be moved as vertically aligned on top
    clientRectCaptures.capture();
    addDelta('div#middle', {minHeight: 20});
    await expectAsync(emitCaptor.waitUntilEmitCount(7, 250)).toBeRejected();

    // add 20px to the height of DIV#middle_1; expect testee to be moved by 20px vertically
    clientRectCaptures.capture();
    addDelta('div#middle_1', {minHeight: 20});
    await emitCaptor.waitUntilEmitCount(7);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({
      top: clientRectCaptures.get('div#testee').top + 20,
      left: clientRectCaptures.get('div#testee').left,
      width: 100,
      height: 30,
    }));

    // add 20px to the height of DIV#middle_2; expect testee not to be moved as vertically aligned on top
    clientRectCaptures.capture();
    addDelta('div#middle_2', {minHeight: 20});
    await expectAsync(emitCaptor.waitUntilEmitCount(8, 250)).toBeRejected();

    // add 20px to the height of DIV#middle_3; expect testee to be moved by 20px vertically
    clientRectCaptures.capture();
    addDelta('div#middle_3', {minHeight: 20});
    await emitCaptor.waitUntilEmitCount(8);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({
      top: clientRectCaptures.get('div#testee').top + 20,
      left: clientRectCaptures.get('div#testee').left,
      width: 100,
      height: 30,
    }));

    // add 20px to the height of DIV#right; expect testee not to be moved
    clientRectCaptures.capture();
    addDelta('div#right', {minHeight: 20});
    await expectAsync(emitCaptor.waitUntilEmitCount(9, 250)).toBeRejected();

    // remove DIV#left; expect testee to be moved by minus the width of div#left (plus its margin of 5+5=10px)
    clientRectCaptures.capture();

    $('div#left').remove();
    await emitCaptor.waitUntilEmitCount(9);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({
      top: clientRectCaptures.get('div#testee').top,
      left: clientRectCaptures.get('div#testee').left - clientRectCaptures.get('div#left').width - 5 - 5,
      width: 100,
      height: 30,
    }));

    // insert DIV#left again; expect testee to be moved by plus the width of div#left (plus its margin of 5+5=10px)
    clientRectCaptures.capture();
    $('div#root').insertBefore(createDiv({id: 'left', style: {'background': '#00AAFF', 'width': '400px', 'margin': '5px'}}), $('DIV#middle'));
    await emitCaptor.waitUntilEmitCount(10);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({
      top: clientRectCaptures.get('div#testee').top,
      left: clientRectCaptures.get('div#testee').left + 400 + 5 + 5,
      width: 100,
      height: 30,
    }));
  });

  it('should emit when resizing the observed element', async () => {
    // Capture current element dimensions and positions
    const clientRectCaptures = new ClientRects().capture();
    // Init captor to capture Observable emissions
    const emitCaptor = new ObserveCaptor<ClientRect>();

    // TEST: Subscribe to fromBoundingClientRect$
    fromBoundingClientRect$($('div#testee')).subscribe(emitCaptor);

    // expect the initial ClientRect to be emitted
    await emitCaptor.waitUntilEmitCount(1);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining(clientRectCaptures.get('div#testee')));

    // shrink testee horizontally by 50px
    addDelta('div#testee', {width: -50});
    await emitCaptor.waitUntilEmitCount(2);
    await expect(emitCaptor.getLastValue()).toEqual(jasmine.objectContaining({
      top: clientRectCaptures.get('div#testee').top,
      left: clientRectCaptures.get('div#testee').left + 25,
      width: 50,
      height: 30,
    }));
  });
});

/**
 * +----------+ +-------------------------------+ +-----------+
 * | DIV#left | |           DIV#middle          | | DIV#right |
 * |          | |                               | |           |
 * |          | | +---------------------------+ | |           |
 * |          | | |        DIV#middle_1       | | |           |
 * |          | | +---------------------------+ | |           |
 * |          | |                               | |           |
 * |          | | +---------------------------+ | |           |
 * |          | | |        DIV#middle_2       | | |           |
 * |          | | |                           | | |           |
 * |          | | | +-----------------------+ | | |           |
 * |          | | | |      DIV#middle_3     | | | |           |
 * |          | | | +-----------------------+ | | |           |
 * |          | | |                           | | |           |
 * |          | | |     +--------------+      | | |           |
 * |          | | |     |  DIV#testee  |      | | |           |
 * |          | | |     |              |      | | |           |
 * |          | | |     |   centered   |      | | |           |
 * |          | | |     | horizontally |      | | |           |
 * |          | | |     +--------------+      | | |           |
 * |          | | +---------------------------+ | |           |
 * +----------+ +-------------------------------+ +-----------+
 */
function setupTestLayout(): void {
  createDiv({
    id: 'root',
    parent: document.body,
    style: {'display': 'flex', 'background-color': 'gray', 'color': 'white', 'width': '1000px'},
    children: [
      createDiv({id: 'left', style: {'background': '#00AAFF', 'min-width': '200px'}}),
      createDiv({
        id: 'middle', style: {'background': '#571845', 'min-width': '200px'},
        children: [
          createDiv({id: 'middle_1', style: {'background': '#900C3E'}}),
          createDiv({
            id: 'middle_2', style: {'background': '#C70039', 'display': 'flex', 'flex-direction': 'column'}, children: [
              createDiv({id: 'middle_3', style: {'background': '#FF5733'}}),
              createDiv({id: 'testee', style: {'background': '#FFC300', 'align-self': 'center', 'height': '30px', 'width': '100px'}}),
            ],
          }),
        ],
      }),
      createDiv({id: 'right', style: {'background': '#0618D6', 'min-width': '200px'}}),
    ],
  });
}

function $(selector: string): HTMLElement {
  return document.querySelector(selector) as HTMLElement;
}

function addDelta(selector: string, delta: {minWidth?: number, minHeight?: number, width?: number, height?: number}): void {
  const element = $(selector);
  delta.width && setStyle(element, {'width': `${element.getBoundingClientRect().width + delta.width}px`});
  delta.height && setStyle(element, {'height': `${element.getBoundingClientRect().height + delta.height}px`});
  delta.minWidth && setStyle(element, {'min-width': `${element.getBoundingClientRect().width + delta.minWidth}px`});
  delta.minHeight && setStyle(element, {'min-height': `${element.getBoundingClientRect().height + delta.minHeight}px`});
}

function createDiv(options: ElementCreateOptions): HTMLElement {
  const div = document.createElement('div');
  if (options.id !== 'root') {
    div.innerText = options.id;
  }
  setStyle(div, {
    'margin': '5px',
    'padding': '5px',
    'box-sizing': 'border-box',
    'text-align': 'center',
    'font-family': 'sans-serif',
  });
  div.id = options.id;
  options.style && setStyle(div, options.style);
  options.parent?.appendChild(div);
  options.children?.forEach(child => div.appendChild(child));
  return div;
}

interface ElementCreateOptions {
  id: string;
  parent?: Node;
  style?: {[style: string]: any};
  children?: Node[];
}

function setStyle(element: HTMLElement, style: {[style: string]: any | null}): void {
  Object.keys(style).forEach(key => element.style[key] = style[key]);
}

class ClientRects {

  public rects = new Map<string, DOMRect>();

  /**
   * Captures current bounding boxes.
   */
  public capture(): ClientRects {
    this.rects.clear();
    this.rects
      .set('div#left', $('div#left')?.getBoundingClientRect())
      .set('div#middle', $('div#middle')?.getBoundingClientRect())
      .set('div#right', $('div#right')?.getBoundingClientRect())
      .set('div#middle_1', $('div#middle_1')?.getBoundingClientRect())
      .set('div#middle_2', $('div#middle_2')?.getBoundingClientRect())
      .set('div#middle_3', $('div#middle_3')?.getBoundingClientRect())
      .set('div#testee', $('div#testee')?.getBoundingClientRect());
    return this;
  }

  /**
   * Returns the last captured bounding box for the element.
   */
  public get(selector: string): ClientRect {
    const {top, right, bottom, left, width, height} = this.rects.get(selector);
    return {top: top, right, bottom, left, width, height};
  }
}
