/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {fromResize$} from './resize.observable';
import {ObserveCaptor} from '@scion/toolkit/testing';

describe('fromResize$', () => {

  it('should emit on size change of the element', async () => {
    // create the testee <div> and subscribe for size changes
    const testeeDiv = document.createElement('div');
    testeeDiv.style.width = '100px';

    const observeCaptor = new ObserveCaptor<unknown, number>(() => testeeDiv.clientWidth);
    fromResize$(testeeDiv).subscribe(observeCaptor);

    // append the testee <div> to the DOM
    document.body.appendChild(testeeDiv);

    await waitUntilRendered();
    expect(observeCaptor.getValues()).toEqual([100]);

    // change the size of the <div> to 200px and wait until the changed size is reported
    testeeDiv.style.width = '200px';
    await waitUntilRendered();
    expect(observeCaptor.getValues()).toEqual([100, 200]);

    // change the size of the <div> to 300px and wait until the changed size is reported
    testeeDiv.style.width = '300px';
    await waitUntilRendered();
    expect(observeCaptor.getValues()).toEqual([100, 200, 300]);
  });

  it('should emit on size change of the parent element', async () => {
    // create a parent <div> with a width of 300px
    const parentDiv = document.createElement('div');
    parentDiv.style.width = '100px';
    document.body.appendChild(parentDiv);

    // create the testee <div> and subscribe for size changes
    const testeeDiv = document.createElement('div');

    const observeCaptor = new ObserveCaptor<unknown, number>(() => testeeDiv.clientWidth);
    fromResize$(testeeDiv).subscribe(observeCaptor);

    // append the testee <div> to the DOM
    parentDiv.appendChild(testeeDiv);

    await waitUntilRendered();
    expect(observeCaptor.getValues()).toEqual([100]);

    // change the size of the parent <div> to 200px and wait until the changed size is reported
    parentDiv.style.width = '200px';
    await waitUntilRendered();
    expect(observeCaptor.getValues()).toEqual([100, 200]);

    // change the size of the parent <div> to 300px and wait until the changed size is reported
    parentDiv.style.width = '300px';
    await waitUntilRendered();
    expect(observeCaptor.getValues()).toEqual([100, 200, 300]);
  });

  it('should emit on size change for multiple observers', async () => {
    // create the testee <div>
    const testeeDiv = document.createElement('div');
    testeeDiv.style.width = '100px';
    document.body.appendChild(testeeDiv);
    await waitUntilRendered();

    // 1. subscription
    const observeCaptor1 = new ObserveCaptor<unknown, number>(() => testeeDiv.clientWidth);
    const subscription1 = fromResize$(testeeDiv).subscribe(observeCaptor1);
    await waitUntilRendered();

    expect(observeCaptor1.getValues()).toEqual([100]);

    // 2. subscription
    const observeCaptor2 = new ObserveCaptor<unknown, number>(() => testeeDiv.clientWidth);
    const subscription2 = fromResize$(testeeDiv).subscribe(observeCaptor2);
    await waitUntilRendered();

    expect(observeCaptor2.getValues()).toEqual([100]);

    // 3. subscription
    const observeCaptor3 = new ObserveCaptor<unknown, number>(() => testeeDiv.clientWidth);
    const subscription3 = fromResize$(testeeDiv).subscribe(observeCaptor3);
    await waitUntilRendered();

    expect(observeCaptor3.getValues()).toEqual([100]);

    // change the size of the <div> to 200px and wait until the changed size is reported
    testeeDiv.style.width = '200px';
    await waitUntilRendered();
    expect(observeCaptor1.getValues()).toEqual([100, 200]);
    expect(observeCaptor2.getValues()).toEqual([100, 200]);
    expect(observeCaptor3.getValues()).toEqual([100, 200]);

    // Unsubscribe the 3. subscriber
    subscription3.unsubscribe();
    await waitUntilRendered();

    // change the size of the <div> to 300px and wait until the changed size is reported
    testeeDiv.style.width = '300px';
    await waitUntilRendered();
    expect(observeCaptor1.getValues()).toEqual([100, 200, 300]);
    expect(observeCaptor2.getValues()).toEqual([100, 200, 300]);
    expect(observeCaptor3.getValues()).toEqual([100, 200]);

    // Unsubscribe the 2. subscriber
    subscription2.unsubscribe();
    await waitUntilRendered();

    // change the size of the <div> to 400px and wait until the changed size is reported
    testeeDiv.style.width = '400px';
    await waitUntilRendered();
    expect(observeCaptor1.getValues()).toEqual([100, 200, 300, 400]);
    expect(observeCaptor2.getValues()).toEqual([100, 200, 300]);
    expect(observeCaptor3.getValues()).toEqual([100, 200]);

    // Unsubscribe the 1. subscriber
    subscription1.unsubscribe();
    await waitUntilRendered();

    // change the size of the <div> to 500px and wait until the changed size is reported
    testeeDiv.style.width = '500px';
    await waitUntilRendered();
    expect(observeCaptor1.getValues()).toEqual([100, 200, 300, 400]);
    expect(observeCaptor2.getValues()).toEqual([100, 200, 300]);
    expect(observeCaptor3.getValues()).toEqual([100, 200]);
  });

  /**
   * Wait until the browser reported the size change.
   */
  function waitUntilRendered(renderCyclesToWait: number = 2): Promise<void> {
    if (renderCyclesToWait === 0) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      requestAnimationFrame(() => void waitUntilRendered(renderCyclesToWait - 1).then(() => resolve()));
    });
  }
});
