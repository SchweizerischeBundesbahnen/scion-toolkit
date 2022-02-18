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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        Testee1Component,
        Testee2Component,
      ],
      imports: [
        SciViewportModule,
      ],
    }).compileComponents();
  });

  it('should show a vertical scrollbar on vertical overflow', async () => {
    const fixture = TestBed.createComponent(Testee1Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.direction = 'column';
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(1) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(1) horizonal)');

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(2) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(2) horizonal)');

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(3) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(3) horizonal)');

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(4) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(4) horizonal)');

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(true, '(5) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(5) horizonal)');

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(true, '(6) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(6) horizonal)');

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(true, '(7) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(7) horizonal)');

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(8) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(8) horizonal)');

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(9) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(9) horizonal)');

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(10) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(10) horizonal)');

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(11) vertical)');
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(11) horizonal)');
  });

  it('should show a horizontal scrollbar on horizontal overflow', async () => {
    const fixture = TestBed.createComponent(Testee1Component);
    fixture.autoDetectChanges(true);
    const component = fixture.componentInstance;

    component.direction = 'row';
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(1) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(1) vertical)');

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(2) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(2) vertical)');

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(3) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(3) vertical)');

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(4) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(4) vertical)');

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(true, '(5) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(5) vertical)');

    component.onAdd();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(true, '(6) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(6) vertical)');

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(true, '(7) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(7) vertical)');

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(8) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(8) vertical)');

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(9) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(9) vertical)');

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(10) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(10) vertical)');

    component.onRemove();
    await flushChanges(fixture);
    expect(isScrollbarVisible(fixture, 'horizontal')).toBe(false, '(11) horizonal)');
    expect(isScrollbarVisible(fixture, 'vertical')).toBe(false, '(11) vertical)');
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
    fromDimension$(component.viewport.viewportClientElement).subscribe(viewportClientSizeCaptor);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(getSize(fixture, 'div.viewport-client')).toEqual(jasmine.objectContaining({height: 600}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();

    await viewportClientSizeCaptor.waitUntilEmitCount(1);
    expect(viewportClientSizeCaptor.getLastValue()).toEqual(jasmine.objectContaining({offsetHeight: 600}));
    expect(component.viewport.scrollHeight).toEqual(600);
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
  public direction: 'row' | 'column';

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
  private _viewportElement: ElementRef<HTMLElement>;

  @ViewChild(SciViewportComponent, {static: true})
  public viewport: SciViewportComponent;

  @ViewChild('container1', {static: true, read: ElementRef})
  private _container1: ElementRef<HTMLElement>;

  @ViewChild('container2', {static: true, read: ElementRef})
  private _container2: ElementRef<HTMLElement>;

  @ViewChild('content', {static: true, read: ElementRef})
  private _contentElement: ElementRef<HTMLElement>;

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
