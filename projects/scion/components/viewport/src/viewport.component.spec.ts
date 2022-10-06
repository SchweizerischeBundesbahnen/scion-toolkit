/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ComponentFixture, TestBed} from '@angular/core/testing';
import {Component, ElementRef, Input, Renderer2, ViewChild} from '@angular/core';
import {SciViewportModule} from './viewport.module';
import {By} from '@angular/platform-browser';
import {Dictionary} from '@scion/toolkit/util';
import {SciViewportComponent} from './viewport.component';
import {Dimension, fromDimension$} from '@scion/toolkit/observable';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {asyncScheduler} from 'rxjs';
import {SciScrollbarComponent} from './scrollbar/scrollbar.component';

describe('Viewport', () => {

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        Testee1Component,
        Testee2Component,
        Testee3Component,
      ],
      imports: [
        SciViewportModule,
      ],
    });
  });

  it('should show a vertical scrollbar on vertical overflow', async () => {
    const fixture = TestBed.createComponent(Testee1Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.direction = 'column';
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(1) vertical)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(1) horizonal)').toBeFalse();

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(2) vertical)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(2) horizonal)').toBeFalse();

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(3) vertical)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(3) horizonal)').toBeFalse();

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(4) vertical)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(4) horizonal)').toBeFalse();

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(5) vertical)').toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(5) horizonal)').toBeFalse();

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(6) vertical)').toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(6) horizonal)').toBeFalse();

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(7) vertical)').toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(7) horizonal)').toBeFalse();

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(8) vertical)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(8) horizonal)').toBeFalse();

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(9) vertical)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(9) horizonal)').toBeFalse();

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(10) vertical)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(10) horizonal)').toBeFalse();

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(11) vertical)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(11) horizonal)').toBeFalse();
  });

  it('should show a horizontal scrollbar on horizontal overflow', async () => {
    const fixture = TestBed.createComponent(Testee1Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.direction = 'row';
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(1) horizonal)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(1) vertical)').toBeFalse();

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(2) horizonal)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(2) vertical)').toBeFalse();

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(3) horizonal)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(3) vertical)').toBeFalse();

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(4) horizonal)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(4) vertical)').toBeFalse();

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(5) horizonal)').toBeTrue();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(5) vertical)').toBeFalse();

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(6) horizonal)').toBeTrue();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(6) vertical)').toBeFalse();

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(7) horizonal)').toBeTrue();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(7) vertical)').toBeFalse();

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(8) horizonal)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(8) vertical)').toBeFalse();

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(9) horizonal)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(9) vertical)').toBeFalse();

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(10) horizonal)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(10) vertical)').toBeFalse();

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).withContext('(11) horizonal)').toBeFalse();
    expect(isScrollbarVisible(fixture, 'vertical')).withContext('(11) vertical)').toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: '1 1 0', content.height: '0'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
    });
    component.setStyle('sci-viewport', {
      'flex': '1 1 0',
    });
    component.setStyle('viewport-content', {
      'height': '0',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: '1 1 0', content.height: '150px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
    });
    component.setStyle('sci-viewport', {
      'flex': '1 1 0',
    });
    component.setStyle('viewport-content', {
      'height': '150px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: '1 1 0', content.height: '300px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
    });
    component.setStyle('sci-viewport', {
      'flex': '1 1 0',
    });
    component.setStyle('viewport-content', {
      'height': '300px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: '1 1 0', content.height: '600px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
    });
    component.setStyle('sci-viewport', {
      'flex': '1 1 0',
    });
    component.setStyle('viewport-content', {
      'height': '600px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: '0 1 auto', content.height: '0'] => expect viewport height to be 0`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'height': '100%',
    });
    component.setStyle('sci-viewport', {
      'flex': '0 1 auto',
    });
    component.setStyle('viewport-content', {
      'height': '0',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 0}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: '0 1 auto', content.height: '150px'] => expect viewport height to be 150px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'height': '100%',
    });
    component.setStyle('sci-viewport', {
      'flex': '0 1 auto',
    });
    component.setStyle('viewport-content', {
      'height': '150px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 150}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: '0 1 auto', content.height: '300px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'height': '100%',
    });
    component.setStyle('sci-viewport', {
      'flex': '0 1 auto',
    });
    component.setStyle('viewport-content', {
      'height': '300px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: '0 1 auto', content.height: '600px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'height': '100%',
    });
    component.setStyle('sci-viewport', {
      'flex': '0 1 auto',
    });
    component.setStyle('viewport-content', {
      'height': '600px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: 'auto', content.height: '0'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '0',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: 'auto', content.height: '150px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '150px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: 'auto', content.height: '300px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '300px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.flex: 'auto', content.height: '600px'] => expect viewport height to be 600px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '600px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 600}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container1.height: '300px', container2.overflow: 'hidden', viewport.flex: 'auto', content.height: '0'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'overflow': 'hidden',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '0',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container1.height: '300px', container2.overflow: 'hidden', viewport.flex: 'auto', content.height: '150px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'overflow': 'hidden',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '150px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container1.height: '300px', container2.overflow: 'hidden', viewport.flex: 'auto', content.height: '300px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'overflow': 'hidden',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '300px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container1.height: '300px', container2.overflow: 'hidden', viewport.flex: 'auto', content.height: '600px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'overflow': 'hidden',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '600px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container1.height: '300px', container2.height: '100%', viewport.flex: 'auto', content.height: '0'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'height': '100%',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '0',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container1.height: '300px', container2.height: '100%', viewport.flex: 'auto', content.height: '150px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'height': '100%',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '150px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container1.height: '300px', container2.height: '100%', viewport.flex: 'auto', content.height: '300px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'height': '100%',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '300px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container1.height: '300px', container2.height: '100%', viewport.flex: 'auto', content.height: '600px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
      'height': '100%',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '600px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.max-height: '100%', content.height: '0'] => expect viewport height to be 0`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {});
    component.setStyle('container2', {
      'height': '300px',
    });
    component.setStyle('sci-viewport', {
      'max-height': '100%',
    });
    component.setStyle('viewport-content', {
      'height': '0',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 0}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.max-height: '100%', content.height: '150px'] => expect viewport height to be 150px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {});
    component.setStyle('container2', {
      'height': '300px',
    });
    component.setStyle('sci-viewport', {
      'max-height': '100%',
    });
    component.setStyle('viewport-content', {
      'height': '150px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 150}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.max-height: '100%', content.height: '350px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {});
    component.setStyle('container2', {
      'height': '300px',
    });
    component.setStyle('sci-viewport', {
      'max-height': '100%',
    });
    component.setStyle('viewport-content', {
      'height': '300px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [container.height: '300px', viewport.max-height: '100%', content.height: '600px'] => expect viewport height to be 300px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {});
    component.setStyle('container2', {
      'height': '300px',
    });
    component.setStyle('sci-viewport', {
      'max-height': '100%',
    });
    component.setStyle('viewport-content', {
      'height': '600px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it(`should fill up available space [content.height: '600px'] => expect viewport height to be 600px`, async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {});
    component.setStyle('container2', {});
    component.setStyle('sci-viewport', {});
    component.setStyle('viewport-content', {
      'height': '600px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 600}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeFalse();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it('should allow to scroll if setting a min-height', async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {});
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'overflow': 'auto',
      'max-height': '200px',
    });
    component.setStyle('sci-viewport', {
      'flex': '1 1 0',
      'min-height': '150px',
    });
    component.setStyle('viewport-content', {
      'height': '600px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 150}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it('should allow to scroll if setting a min-height even when the scrollable container becomes smaller than this min-height', async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {});
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'overflow': 'auto',
      'max-height': '100px',
    });
    component.setStyle('sci-viewport', {
      'flex': '1 1 0',
      'min-height': '150px',
    });
    component.setStyle('viewport-content', {
      'height': '600px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 150}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();
  });

  it('should not expand the viewport to the right when displaying wide content', async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'grid', // happens only if using a CSS grid layout and if not setting 'grid-template-columns' to '100%'
      'width': '500px',
      'height': '300px',
      'grid-template-rows': '100%',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
    });
    component.setStyle('sci-viewport', {
      'flex': 'auto',
    });
    component.setStyle('viewport-content', {
      'height': '9000px',
      'width': '9000px',
    });
    await flushChanges(fixture);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300, width: 500}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeTrue();
  });

  it('should stretch the viewport client\'s `DIV` (direct child of the internal viewport element) to the effective height of its content (tests that no `min-height` is set, so that the viewport\'s `scrollHeight` corresponds to the viewport client height)', async () => {
    const fixture = TestBed.createComponent(Testee2Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.setStyle('container1', {
      'display': 'flex',
      'flex-direction': 'column',
      'height': '300px',
    });
    component.setStyle('container2', {
      'display': 'flex',
      'flex-direction': 'column',
      'flex': 'auto',
    });
    component.setStyle('sci-viewport', {
      'flex': '1 1 0',
    });
    component.setStyle('viewport-content', {
      'height': '600px',
    });
    await flushChanges(fixture);

    const viewportClientSizeCaptor = new ObserveCaptor<Dimension>();
    const fromDimensionSubscription = fromDimension$(component.viewport.viewportClientElement)
      .subscribe(viewportClientSizeCaptor);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(getSize(fixture, 'div.viewport-client')).toEqual(jasmine.objectContaining({height: 600}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();

    await viewportClientSizeCaptor.waitUntilEmitCount(1);
    expect(viewportClientSizeCaptor.getLastValue()).toEqual(jasmine.objectContaining({offsetHeight: 600}));
    expect(component.viewport.scrollHeight).toEqual(600);

    // unsubscribe to avoid `ResizeObserver loop limit exceeded` error
    fromDimensionSubscription.unsubscribe();
  });

  describe('computeOffset', () => {

    it('should compute offset of element inside viewport', async () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges(true);
      const component = fixture.componentInstance;
      expect(component.viewportComponent.computeOffset(component.insideViewportElement, 'left')).toEqual(0);
      expect(component.viewportComponent.computeOffset(component.insideViewportElement, 'top')).toEqual(0);

      component.setStyle(component.insideViewportElement, {'position': 'relative'});
      component.moveElement(component.insideViewportElement, {x: 100, y: 200});
      expect(component.viewportComponent.computeOffset(component.insideViewportElement, 'left')).toEqual(100);
      expect(component.viewportComponent.computeOffset(component.insideViewportElement, 'top')).toEqual(200);
    });

    it('should compute offset relative to viewport boundaries', async () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges(true);
      const component = fixture.componentInstance;
      expect(component.viewportComponent.computeOffset(component.insideViewportElement, 'left')).toEqual(0);
      expect(component.viewportComponent.computeOffset(component.insideViewportElement, 'top')).toEqual(0);

      component.setStyle(component.viewportElement, {'position': 'relative'});
      component.moveElement(component.viewportElement, {x: 100, y: 200});
      expect(component.viewportComponent.computeOffset(component.insideViewportElement, 'left')).toEqual(0);
      expect(component.viewportComponent.computeOffset(component.insideViewportElement, 'top')).toEqual(0);
    });

    it('should throw when computing the offset of an element that is not contained in the viewport', async () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges(true);
      const component = fixture.componentInstance;
      expect(() => component.viewportComponent.computeOffset(component.beforeViewportElement, 'left')).toThrowError(/ElementNotContainedError/);
    });
  });

  describe('isElementInView', () => {

    it('should determine whether element is in view (1/2)', async () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges(true);
      const component = fixture.componentInstance;
      component.setStyle(component.viewportElement, {
        'width': '100px',
        'height': '100px',
      });
      // when element is smaller than viewport
      component.setStyle(component.insideViewportElement, {
        'width': '99px',
        'height': '99px',
      });
      // then expect element to be in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeTrue();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();

      // when element has equal viewport size
      component.setStyle(component.insideViewportElement, {
        'width': '100px',
        'height': '100px',
      });
      // then expect element to be in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeTrue();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();

      // when element is larger than viewport
      component.setStyle(component.insideViewportElement, {
        'width': '101px',
        'height': '101px',
      });
      // then expect element to be partially in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();
    });

    it('should determine whether element is in view (2/2)', async () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges(true);
      const component = fixture.componentInstance;
      component.setStyle(component.viewportElement, {
        'width': '100px',
        'height': '100px',
      });
      component.setStyle(component.insideViewportElement, {
        'position': 'relative',
        'width': '100px',
        'height': '100px',
      });
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeTrue();

      // when element overlaps on top
      component.moveElement(component.insideViewportElement, {x: 0, y: -50});
      // then expect element to be partially in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();

      // when element overlaps on top right
      component.moveElement(component.insideViewportElement, {x: 50, y: -50});
      // then expect element to be partially in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();

      // when element overlaps on right
      component.moveElement(component.insideViewportElement, {x: 50, y: 0});
      // then expect element to be partially in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();

      // when element overlaps on bottom right
      component.moveElement(component.insideViewportElement, {x: 50, y: 50});
      // then expect element to be partially in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();

      // when element overlaps on bottom
      component.moveElement(component.insideViewportElement, {x: 0, y: 50});
      // then expect element to be partially in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();

      // when element overlaps on bottom left
      component.moveElement(component.insideViewportElement, {x: -50, y: 50});
      // then expect element to be partially in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();

      // when element overlaps on left
      component.moveElement(component.insideViewportElement, {x: -50, y: 0});
      // then expect element to be partially in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();

      // when element overlaps on top left
      component.moveElement(component.insideViewportElement, {x: -50, y: -50});
      // then expect element to be partially in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();

      // when element is outside viewport
      component.moveElement(component.insideViewportElement, {x: 150, y: 150});
      // then expect element to not be in viewport
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeFalse();
    });
  });

  describe('scrollIntoView', () => {

    it('should scroll element into view horizontally', async () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges(true);
      const component = fixture.componentInstance;
      component.setStyle(component.viewportElement, {
        'width': '100px',
        'height': '100px',
      });
      component.setStyle(component.insideViewportElement, {
        'position': 'relative',
        'width': '100px',
        'height': '100px',
        'left': '250px',
      });
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeFalse();

      // when scrolling element into view
      component.viewportComponent.scrollIntoView(component.insideViewportElement, 0);
      // then expect element to be in view
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeTrue();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();
    });

    it('should scroll element into view vertically', async () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges(true);
      const component = fixture.componentInstance;
      component.setStyle(component.viewportElement, {
        'width': '100px',
        'height': '100px',
      });
      component.setStyle(component.insideViewportElement, {
        'position': 'relative',
        'width': '100px',
        'height': '100px',
        'top': '250px',
      });
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeFalse();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeFalse();

      // when scrolling element into view
      component.viewportComponent.scrollIntoView(component.insideViewportElement, 0);
      // then expect element to be in view
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'full')).toBeTrue();
      expect(component.viewportComponent.isElementInView(component.insideViewportElement, 'partial')).toBeTrue();
    });
  });

  function isScrollbarVisible(fixture: ComponentFixture<any>, scrollbar: 'vertical' | 'horizontal'): boolean {
    const scrollbarElement: HTMLElement = fixture.debugElement.query(By.css(`sci-scrollbar.${scrollbar}`)).nativeElement;
    return scrollbarElement.classList.contains('overflow');
  }

  function getSize(fixture: ComponentFixture<any>, selector: string): Readonly<DOMRect> {
    const viewportElement: HTMLElement = fixture.debugElement.query(By.css(selector)).nativeElement;
    return viewportElement.getBoundingClientRect();
  }

  /**
   * Triggers a change detection cycle and waits for the scrollbar to be rendered.
   */
  async function flushChanges(fixture: ComponentFixture<any>): Promise<void> {
    fixture.detectChanges();

    // Wait until the browser reported the dimension change.
    await awaitRenderCycles(2);
    // Wait 50ms for the scroll position computation to start. The computation is triggered by a dimension change
    // of the viewport but is debounced by 50ms.
    await new Promise(resolve => asyncScheduler.schedule(resolve, SciScrollbarComponent.VIEWPORT_RESIZE_DEBOUNCE_TIME));
    // Wait for the scrollbar to be rendered.
    await awaitRenderCycles(2);
  }

  async function awaitRenderCycles(renderCyclesToWait: number = 2): Promise<void> {
    if (renderCyclesToWait === 0) {
      return Promise.resolve();
    }

    return new Promise(resolve => {
      requestAnimationFrame(() => awaitRenderCycles(renderCyclesToWait - 1).then(() => resolve()));
    });
  }
});

@Component({
  selector: 'spec-testee-1',
  template: `
    <sci-viewport>
      <div class="container" [class.row]="direction === 'row'" [class.column]="direction === 'column'">
        <button *ngFor="let element of elements" (click)="onRemove()">Remove element</button>
      </div>
    </sci-viewport>
    <button (click)="onAdd()">Add element</button>
  `,
  styles: [`
    sci-viewport {
      height: 300px;
      width: 300px;
      background-color: cornflowerblue;
    }

    div.container.row {
      display: flex;
      flex-direction: row;
    }

    div.container.row button {
      width: 100px;
    }

    div.container.column {
      display: flex;
      flex-direction: column;
    }

    div.container.column button {
      height: 100px;
    }
  `],
})
class Testee1Component {

  public elements: null[] = [];

  @Input()
  public direction!: 'row' | 'column';

  public onRemove(): void {
    this.elements = this.elements.slice(0, -1);
  }

  public onAdd(): void {
    this.elements = [...this.elements, null];
  }
}

@Component({
  selector: 'spec-testee-2',
  template: `
    <div #container1 class="container1">
      <div #container2>
        <sci-viewport class="container2">
          <div class="content" #content></div>
        </sci-viewport>
      </div>
    </div>
  `,
  styles: [`
    sci-viewport {
      background-color: lightgray;
    }

    div.content {
      background-color: #ffefbe;
    }
  `],
})
class Testee2Component {

  @ViewChild(SciViewportComponent, {static: true, read: ElementRef})
  private _viewportElement!: ElementRef<HTMLElement>;

  @ViewChild(SciViewportComponent, {static: true})
  public viewport!: SciViewportComponent;

  @ViewChild('container1', {static: true, read: ElementRef})
  private _container1!: ElementRef<HTMLElement>;

  @ViewChild('container2', {static: true, read: ElementRef})
  private _container2!: ElementRef<HTMLElement>;

  @ViewChild('content', {static: true, read: ElementRef})
  private _contentElement!: ElementRef<HTMLElement>;

  constructor(private _renderer: Renderer2) {
  }

  public setStyle(selector: 'viewport-content' | 'sci-viewport' | 'container1' | 'container2', style: Dictionary): void {
    const element = this.resolveElement(selector);
    Object.keys(style).forEach(key => this._renderer.setStyle(element, key, style[key]));
  }

  private resolveElement(selector: 'viewport-content' | 'sci-viewport' | 'container1' | 'container2'): HTMLElement {
    switch (selector) {
      case 'viewport-content':
        return this._contentElement.nativeElement;
      case 'sci-viewport':
        return this._viewportElement.nativeElement;
      case 'container1':
        return this._container1.nativeElement;
      case 'container2':
        return this._container2.nativeElement;
      default:
        throw Error(`[SpecError] Element not found: ${selector}`);
    }
  }
}

@Component({
  selector: 'spec-testee-3',
  template: `
    <div #before_viewport></div>
    <sci-viewport>
      <div #inside_viewport></div>
    </sci-viewport>
  `,
  styles: [`
    sci-viewport {
      height: 100px;
      width: 100px;
      background-color: grey;
    }

    div {
      width: 100px;
      height: 100px;
      background-color: cornflowerblue;
    }
  `],
})
class Testee3Component {

  @ViewChild(SciViewportComponent, {static: true})
  public viewportComponent!: SciViewportComponent;

  @ViewChild(SciViewportComponent, {read: ElementRef, static: true})
  public viewportElement!: ElementRef<HTMLElement>;

  @ViewChild('before_viewport', {read: ElementRef, static: true})
  public beforeViewportElement!: ElementRef<HTMLElement>;

  @ViewChild('inside_viewport', {read: ElementRef, static: true})
  public insideViewportElement!: ElementRef<HTMLElement>;

  constructor(private _renderer: Renderer2) {
  }

  public moveElement(element: ElementRef<HTMLElement>, coordinates: { x: number; y: number }): void {
    this.setStyle(element, {
      'left': `${coordinates.x}px`,
      'top': `${coordinates.y}px`,
    });
  }

  public setStyle(element: ElementRef<HTMLElement>, style: Dictionary): void {
    Object.keys(style).forEach(key => this._renderer.setStyle(element.nativeElement, key, style[key]));
  }
}
