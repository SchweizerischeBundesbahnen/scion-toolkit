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
import {Component, DestroyRef, ElementRef, HostBinding, inject, input, NgZone, Renderer2, Signal, viewChild} from '@angular/core';
import {By} from '@angular/platform-browser';
import {Dictionary} from '@scion/toolkit/util';
import {SciViewportComponent} from './viewport.component';
import {fromResize$} from '@scion/toolkit/observable';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {asyncScheduler} from 'rxjs';
import {SciScrollbarComponent} from './scrollbar/scrollbar.component';
import {map} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

describe('Viewport', () => {

  it('should show a vertical scrollbar on vertical overflow', async () => {
    const fixture = TestBed.createComponent(Testee1Component);
    fixture.componentRef.setInput('direction', 'column');
    fixture.autoDetectChanges();
    const component = fixture.componentInstance;

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
    fixture.componentRef.setInput('direction', 'row');
    fixture.autoDetectChanges();
    const component = fixture.componentInstance;

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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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
    fixture.autoDetectChanges();
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

    const viewportClientSizeCaptor = new ObserveCaptor<DOMRect>();
    fromResize$(component.viewport().viewportClientElement)
      .pipe(
        map(() => component.viewport().viewportClientElement.getBoundingClientRect()),
        takeUntilDestroyed(TestBed.inject(DestroyRef)), // unsubscribe to avoid `ResizeObserver loop limit exceeded` error
      )
      .subscribe(viewportClientSizeCaptor);

    expect(getSize(fixture, 'sci-viewport')).toEqual(jasmine.objectContaining({height: 300}));
    expect(getSize(fixture, 'div.viewport-client')).toEqual(jasmine.objectContaining({height: 600}));
    expect(isScrollbarVisible(fixture, 'vertical')).toBeTrue();
    expect(isScrollbarVisible(fixture, 'horizontal')).toBeFalse();

    await viewportClientSizeCaptor.waitUntilEmitCount(1);
    expect(viewportClientSizeCaptor.getLastValue()).toEqual(jasmine.objectContaining({height: 600}));
    expect(component.viewport().scrollHeight).toEqual(600);
  });

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

  describe('computeOffset', () => {

    it('should compute offset of element inside viewport', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;
      expect(component.viewportComponent().computeOffset(component.insideViewportElement(), 'left')).toEqual(0);
      expect(component.viewportComponent().computeOffset(component.insideViewportElement(), 'top')).toEqual(0);

      component.setStyle(component.insideViewportElement(), {'position': 'relative'});
      component.moveElement(component.insideViewportElement(), {x: 100, y: 200});
      expect(component.viewportComponent().computeOffset(component.insideViewportElement(), 'left')).toEqual(100);
      expect(component.viewportComponent().computeOffset(component.insideViewportElement(), 'top')).toEqual(200);
    });

    it('should compute offset relative to viewport boundaries', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;
      expect(component.viewportComponent().computeOffset(component.insideViewportElement(), 'left')).toEqual(0);
      expect(component.viewportComponent().computeOffset(component.insideViewportElement(), 'top')).toEqual(0);

      component.setStyle(component.viewportElement(), {'position': 'relative'});
      component.moveElement(component.viewportElement(), {x: 100, y: 200});
      expect(component.viewportComponent().computeOffset(component.insideViewportElement(), 'left')).toEqual(0);
      expect(component.viewportComponent().computeOffset(component.insideViewportElement(), 'top')).toEqual(0);
    });

    it('should return `null` when computing the offset of an element not contained in the viewport', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;
      expect(component.viewportComponent().computeOffset(component.beforeViewportElement(), 'left')).toBeNull();
    });

    it('should return `null` when computing the offset for an element whose effective `display` style resolves to `none`.', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;
      component.setStyle(component.insideViewportElement(), {'display': 'none'});
      expect(component.viewportComponent().computeOffset(component.insideViewportElement(), 'left')).toBeNull();
    });
  });

  describe('isElementInView', () => {

    it('should determine whether element is in view (1/2)', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;
      component.setStyle(component.viewportElement(), {
        'width': '100px',
        'height': '100px',
      });
      // when element is smaller than viewport
      component.setStyle(component.insideViewportElement(), {
        'width': '99px',
        'height': '99px',
      });
      // then expect element to be in viewport
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeTrue();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();

      // when element has equal viewport size
      component.setStyle(component.insideViewportElement(), {
        'width': '100px',
        'height': '100px',
      });
      // then expect element to be in viewport
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeTrue();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();

      // when element is larger than viewport
      component.setStyle(component.insideViewportElement(), {
        'width': '101px',
        'height': '101px',
      });
      // then expect element to be partially in viewport
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();
    });

    it('should determine whether element is in view (2/2)', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;
      component.setStyle(component.viewportElement(), {
        'width': '100px',
        'height': '100px',
      });
      component.setStyle(component.insideViewportElement(), {
        'position': 'relative',
        'width': '100px',
        'height': '100px',
      });
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeTrue();

      // when element overlaps on top
      component.moveElement(component.insideViewportElement(), {x: 0, y: -50});
      // then expect element to be in the viewport (native viewport only overflows on the right or bottom)
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeTrue();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();

      // when element overlaps on top right
      component.moveElement(component.insideViewportElement(), {x: 50, y: -50});
      // then expect element to be partially in viewport
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();

      // when element overlaps on right
      component.moveElement(component.insideViewportElement(), {x: 50, y: 0});
      // then expect element to be partially in viewport
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();

      // when element overlaps on bottom right
      component.moveElement(component.insideViewportElement(), {x: 50, y: 50});
      // then expect element to be partially in viewport
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();

      // when element overlaps on bottom
      component.moveElement(component.insideViewportElement(), {x: 0, y: 50});
      // then expect element to be partially in viewport
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();

      // when element overlaps on bottom left
      component.moveElement(component.insideViewportElement(), {x: -50, y: 50});
      // then expect element to be partially in viewport
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();

      // when element overlaps on left
      component.moveElement(component.insideViewportElement(), {x: -50, y: 0});
      // then expect element to be in the viewport (native viewport only overflows on the right or bottom)
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeTrue();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();

      // when element overlaps on top left
      component.moveElement(component.insideViewportElement(), {x: -50, y: -50});
      // then expect element to be in the viewport (native viewport only overflows on the right or bottom)
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeTrue();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();

      // when element is outside viewport
      component.moveElement(component.insideViewportElement(), {x: 150, y: 150});
      // then expect element to not be in viewport
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeFalse();
    });

    it('should return `false` for an element not contained in the viewport', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;
      expect(component.viewportComponent().isElementInView(component.beforeViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.beforeViewportElement(), 'partial')).toBeFalse();
    });

    it('should return `null` for an element whose effective `display` style resolves to `none`', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;
      component.setStyle(component.insideViewportElement(), {'display': 'none'});
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeFalse();
    });

    describe('viewport contains elements with a decimal element width', () => {

      it('should report all elements to be in the viewport if the viewport does not overflow (1/2)', async () => {
        const fixture = TestBed.createComponent(ElementDecimalSizeTestComponent);
        fixture.autoDetectChanges();
        const component = fixture.componentInstance;
        await flushChanges(fixture);

        component.setElement2Width(100.5);

        // Set width of element-1 to 100.4 pixel
        component.setElement1Width(100.4);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (A)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (A)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (A)').toBeFalse();

        // Set width of element-1 to 100.5 pixel
        component.setElement1Width(100.5);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (B)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (B)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (B)').toBeFalse();

        // Set width of element-1 to 100.6 pixel
        component.setElement1Width(100.6);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (C)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (C)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (C)').toBeFalse();
      });

      it('should report all elements to be in the viewport if the viewport does not overflow (2/2)', async () => {
        const fixture = TestBed.createComponent(ElementDecimalSizeTestComponent);
        fixture.autoDetectChanges();
        const component = fixture.componentInstance;
        await flushChanges(fixture);

        component.setElement1Width(100.5);

        // Set width of element-2 to 100.4 pixel
        component.setElement2Width(100.4);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (A)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (A)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (A)').toBeFalse();

        // Set width of element-2 to 100.5 pixel
        component.setElement2Width(100.5);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (B)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (B)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (B)').toBeFalse();

        // Set width of element-2 to 100.6 pixel
        component.setElement2Width(100.6);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (C)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (C)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (C)').toBeFalse();
      });

      it('should detect overflow if overlapping 0.5 pixels or more', async () => {
        const fixture = TestBed.createComponent(ElementDecimalSizeTestComponent);
        fixture.autoDetectChanges();
        const component = fixture.componentInstance;
        await flushChanges(fixture);

        // Set fixed viewport width
        (fixture.debugElement.nativeElement as HTMLElement).style.width = '300px';
        await flushChanges(fixture);

        // Set fixed width for element 1
        component.setElement1Width(100);

        // Set width of element-2 to 200 pixel
        component.setElement2Width(200.0);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (A)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'partial')).withContext('isElementInView(element-2) (A)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (A)').toBeFalse();
        expect(isScrollbarVisible(fixture, 'vertical')).withContext('scrollbar (A)').toBeFalse();

        // Set width of element-2 to 200.4 pixel
        component.setElement2Width(200.4);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (B)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'partial')).withContext('isElementInView(element-2) (B)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (A)').toBeFalse();
        expect(isScrollbarVisible(fixture, 'vertical')).withContext('scrollbar (A)').toBeFalse();

        // Set width of element-2 to 200.5 pixel
        component.setElement2Width(200.5);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (C)').toBeFalse();
        expect(component.viewportComponent().isElementInView(component.element2(), 'partial')).withContext('isElementInView(element-2) (C)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (A)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'vertical')).withContext('scrollbar (A)').toBeFalse();
      });
    });

    describe('viewport contains elements with a decimal element height', () => {

      it('should report all elements to be in the viewport if the viewport does not overflow (1/2)', async () => {
        const fixture = TestBed.createComponent(ElementDecimalSizeTestComponent);
        fixture.autoDetectChanges();
        fixture.componentRef.setInput('columnLayout', true);
        const component = fixture.componentInstance;
        await flushChanges(fixture);

        component.setElement2Height(100.5);

        // Set height of element-1 to 100.4 pixel
        component.setElement1Height(100.4);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (A)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (A)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (A)').toBeFalse();

        // Set height of element-1 to 100.5 pixel
        component.setElement1Height(100.5);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (B)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (B)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (B)').toBeFalse();

        // Set height of element-1 to 100.6 pixel
        component.setElement1Height(100.6);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (C)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (C)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (C)').toBeFalse();
      });

      it('should report all elements to be in the viewport if the viewport does not overflow (2/2)', async () => {
        const fixture = TestBed.createComponent(ElementDecimalSizeTestComponent);
        fixture.autoDetectChanges();
        fixture.componentRef.setInput('columnLayout', true);
        const component = fixture.componentInstance;
        await flushChanges(fixture);

        component.setElement1Height(100.5);

        // Set height of element-2 to 100.4 pixel
        component.setElement2Height(100.4);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (A)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (A)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (A)').toBeFalse();

        // Set height of element-2 to 100.5 pixel
        component.setElement2Height(100.5);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (B)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (B)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (B)').toBeFalse();

        // Set height of element-2 to 100.6 pixel
        component.setElement2Height(100.6);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element1(), 'full')).withContext('isElementInView(element-1) (C)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (C)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (C)').toBeFalse();
      });

      it('should detect overflow if overlapping 0.5 pixels or more', async () => {
        const fixture = TestBed.createComponent(ElementDecimalSizeTestComponent);
        fixture.autoDetectChanges();
        fixture.componentRef.setInput('columnLayout', true);
        const component = fixture.componentInstance;
        await flushChanges(fixture);

        // Set fixed viewport height
        (fixture.debugElement.nativeElement as HTMLElement).style.height = '300px';
        await flushChanges(fixture);

        // Set fixed height for element 1
        component.setElement1Height(100);

        // Set height of element-2 to 200 pixel
        component.setElement2Height(200.0);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (A)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'partial')).withContext('isElementInView(element-2) (A)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (A)').toBeFalse();
        expect(isScrollbarVisible(fixture, 'vertical')).withContext('scrollbar (A)').toBeFalse();

        // Set height of element-2 to 200.4 pixel
        component.setElement2Height(200.4);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (B)').toBeTrue();
        expect(component.viewportComponent().isElementInView(component.element2(), 'partial')).withContext('isElementInView(element-2) (B)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (A)').toBeFalse();
        expect(isScrollbarVisible(fixture, 'vertical')).withContext('scrollbar (A)').toBeFalse();

        // Set height of element-2 to 200.5 pixel
        component.setElement2Height(200.5);
        await flushChanges(fixture);
        expect(component.viewportComponent().isElementInView(component.element2(), 'full')).withContext('isElementInView(element-2) (C)').toBeFalse();
        expect(component.viewportComponent().isElementInView(component.element2(), 'partial')).withContext('isElementInView(element-2) (C)').toBeTrue();
        expect(isScrollbarVisible(fixture, 'horizontal')).withContext('scrollbar (A)').toBeFalse();
        expect(isScrollbarVisible(fixture, 'vertical')).withContext('scrollbar (A)').toBeTrue();
      });
    });
  });

  describe('scrollIntoView', () => {

    it('should scroll element into view horizontally', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;
      component.setStyle(component.viewportElement(), {
        'width': '100px',
        'height': '100px',
      });
      component.setStyle(component.insideViewportElement(), {
        'position': 'relative',
        'width': '100px',
        'height': '100px',
        'left': '250px',
      });
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeFalse();

      // when scrolling element into view
      component.viewportComponent().scrollIntoView(component.insideViewportElement(), 0);
      // then expect element to be in view
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeTrue();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();
    });

    it('should scroll element into view vertically', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;
      component.setStyle(component.viewportElement(), {
        'width': '100px',
        'height': '100px',
      });
      component.setStyle(component.insideViewportElement(), {
        'position': 'relative',
        'width': '100px',
        'height': '100px',
        'top': '250px',
      });
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeFalse();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeFalse();

      // when scrolling element into view
      component.viewportComponent().scrollIntoView(component.insideViewportElement(), 0);
      // then expect element to be in view
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'full')).toBeTrue();
      expect(component.viewportComponent().isElementInView(component.insideViewportElement(), 'partial')).toBeTrue();
    });

    it('ignore element not contained in the viewport', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;

      expect(() => component.viewportComponent().scrollIntoView(component.beforeViewportElement())).not.toThrowError();
    });

    it('ignore element if its effective `display` style resolves to `none`', () => {
      const fixture = TestBed.createComponent(Testee3Component);
      fixture.autoDetectChanges();
      const component = fixture.componentInstance;

      component.setStyle(component.insideViewportElement(), {'display': 'none'});
      expect(() => component.viewportComponent().scrollIntoView(component.insideViewportElement())).not.toThrowError();
    });
  });

  function isScrollbarVisible(fixture: ComponentFixture<any>, scrollbar: 'vertical' | 'horizontal'): boolean {
    const scrollbarElement = fixture.debugElement.query(By.css(`sci-scrollbar.${scrollbar}`)).nativeElement as HTMLElement;
    return scrollbarElement.classList.contains('overflow');
  }

  function getSize(fixture: ComponentFixture<any>, selector: string): Readonly<DOMRect> {
    const viewportElement = fixture.debugElement.query(By.css(selector)).nativeElement as HTMLElement;
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
      requestAnimationFrame(() => void awaitRenderCycles(renderCyclesToWait - 1).then(() => resolve()));
    });
  }
});

@Component({
  selector: 'spec-testee-1',
  template: `
    <sci-viewport>
      <div class="container" [class.row]="direction() === 'row'" [class.column]="direction() === 'column'">
        @for (element of elements; track $index) {
          <button (click)="onRemove()">Remove element</button>
        }
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
  imports: [
    SciViewportComponent,
  ],
})
class Testee1Component {

  public readonly direction = input.required<'row' | 'column'>();

  protected elements: null[] = [];

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
  imports: [SciViewportComponent],
})
class Testee2Component {

  private readonly _renderer = inject(Renderer2);

  private readonly _viewportElement: Signal<ElementRef<HTMLElement>> = viewChild.required(SciViewportComponent, {read: ElementRef});
  private readonly _container1: Signal<ElementRef<HTMLElement>> = viewChild.required('container1', {read: ElementRef});
  private readonly _container2: Signal<ElementRef<HTMLElement>> = viewChild.required('container2', {read: ElementRef});
  private readonly _contentElement: Signal<ElementRef<HTMLElement>> = viewChild.required('content', {read: ElementRef});

  public readonly viewport = viewChild.required(SciViewportComponent);

  public setStyle(selector: 'viewport-content' | 'sci-viewport' | 'container1' | 'container2', style: Dictionary): void {
    const element = this.resolveElement(selector);
    Object.keys(style).forEach(key => this._renderer.setStyle(element, key, style[key]));
  }

  private resolveElement(selector: 'viewport-content' | 'sci-viewport' | 'container1' | 'container2'): HTMLElement {
    switch (selector) {
      case 'viewport-content':
        return this._contentElement().nativeElement;
      case 'sci-viewport':
        return this._viewportElement().nativeElement;
      case 'container1':
        return this._container1().nativeElement;
      case 'container2':
        return this._container2().nativeElement;
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
  imports: [SciViewportComponent],
})
class Testee3Component {

  private readonly _renderer = inject(Renderer2);

  public readonly viewportComponent = viewChild.required(SciViewportComponent);
  public readonly viewportElement: Signal<ElementRef<HTMLElement>> = viewChild.required(SciViewportComponent, {read: ElementRef});
  public readonly beforeViewportElement: Signal<ElementRef<HTMLElement>> = viewChild.required('before_viewport', {read: ElementRef});
  public readonly insideViewportElement: Signal<ElementRef<HTMLElement>> = viewChild.required('inside_viewport', {read: ElementRef});

  public moveElement(element: ElementRef<HTMLElement>, coordinates: {x: number; y: number}): void {
    this.setStyle(element, {
      'left': `${coordinates.x}px`,
      'top': `${coordinates.y}px`,
    });
  }

  public setStyle(element: ElementRef<HTMLElement>, style: Dictionary): void {
    Object.keys(style).forEach(key => this._renderer.setStyle(element.nativeElement, key, style[key]));
  }
}

/**
 * Renders a viewport that contains two elements, either aligned in a row or a column,
 * controlled via 'columnLayout' input property. The viewport is sized according to its
 * content width and height.
 */
@Component({
  selector: 'spec-decimal-element-size',
  template: `
    <sci-viewport>
      <div class="element" #element1></div>
      <div class="element" #element2></div>
    </sci-viewport>
  `,
  styles: [`
    :host {
      display: flex;
      height: 100px;
    }

    :host.column-layout {
      flex-direction: column;
      height: unset;
      width: 100px;
    }

    sci-viewport {
      flex: initial;
      background-color: grey;
    }

    div.element {
      width: 100px;
      height: 100px;
    }

    sci-viewport::part(content) {
      display: flex;
      background-color: cornflowerblue;
    }

    :host.column-layout sci-viewport::part(content) {
      flex-direction: column;
    }
  `],
  imports: [SciViewportComponent],
})
class ElementDecimalSizeTestComponent {

  private readonly _renderer = inject(Renderer2);

  public readonly columnLayout = input(false);

  public readonly viewportComponent = viewChild.required(SciViewportComponent);
  public readonly element1: Signal<ElementRef<HTMLElement>> = viewChild.required('element1', {read: ElementRef});
  public readonly element2: Signal<ElementRef<HTMLElement>> = viewChild.required('element2', {read: ElementRef});

  @HostBinding('class.column-layout')
  protected get isColumnLayout(): boolean {
    return this.columnLayout();
  }

  public setElement1Width(px: number): void {
    this.setStyle(this.element1(), {
      'font-size': '1px',
      'width': `${px}em`, // set width as `em` to bypass CSS limitation to set decimal pixel values
    });
  }

  public setElement2Width(px: number): void {
    this.setStyle(this.element2(), {
      'font-size': '1px',
      'width': `${px}em`, // set width as `em` to bypass CSS limitation to set decimal pixel values
    });
  }

  public setElement1Height(px: number): void {
    this.setStyle(this.element1(), {
      'font-size': '1px',
      'height': `${px}em`, // set height as `em` to bypass CSS limitation to set decimal pixel values
    });
  }

  public setElement2Height(px: number): void {
    this.setStyle(this.element2(), {
      'font-size': '1px',
      'height': `${px}em`, // set height as `em` to bypass CSS limitation to set decimal pixel values
    });
  }

  public setStyle(element: ElementRef<HTMLElement>, style: Dictionary): void {
    Object.keys(style).forEach(key => this._renderer.setStyle(element.nativeElement, key, style[key]));
  }
}
