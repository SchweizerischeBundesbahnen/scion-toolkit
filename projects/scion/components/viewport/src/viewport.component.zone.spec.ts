/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {TestBed} from '@angular/core/testing';
import {Component, NgZone, viewChild} from '@angular/core';
import {SciViewportComponent} from '@scion/components/viewport';
import {flushChanges} from './viewport.component.spec';

describe('Viewport', () => {
  it('should emit scroll events outside the Angular zone', async () => {
    @Component({
      selector: 'spec-viewport',
      template: `
        <sci-viewport (scroll)="onScroll()">
          <div class="content">Content</div>
        </sci-viewport>`,
      styles: `
        :host {
          display: grid;
          border: 1px solid black;
          width: 300px;
          height: 200px;

          > sci-viewport > div.content {
            height: 1000px;
            background-color: lightblue;
          }
        }`,
      imports: [SciViewportComponent],
    })
    class SpecComponent {

      public viewport = viewChild.required(SciViewportComponent);
      public scrolledInsideAngular: boolean | undefined = undefined;

      protected onScroll(): void {
        this.scrolledInsideAngular = NgZone.isInAngularZone();
      }
    }

    const fixture = TestBed.createComponent(SpecComponent);
    fixture.autoDetectChanges();
    const testee = fixture.componentInstance;
    const viewport = testee.viewport();

    // Scroll the viewport.
    viewport.scrollTop = 100;
    await flushChanges(fixture);

    // Expect scroll event to be received outside Angular.
    expect(testee.scrolledInsideAngular).toBeFalse();
  });
});
