/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ComponentFixtureAutoDetect, TestBed} from '@angular/core/testing';
import {Component, ElementRef, NgZone, viewChild} from '@angular/core';
import {SciDimension, SciDimensionDirective} from './dimension.directive';
import {Subject} from 'rxjs';
import {ObserveCaptor} from '@scion/toolkit/testing';

describe('Dimension Directive', () => {

  it('should detect size change', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-component',
      template: `
        <div class="testee" sciDimension (sciDimensionChange)="onDimensionChange($event)" #testee></div>
      `,
      styles: `
        div.testee {
          width: 300px;
          height: 150px;
          box-sizing: content-box;
          border: 1px solid red;
          background-color: blue;
        }
      `,
      imports: [
        SciDimensionDirective,
      ],
      standalone: true,
    })
    class TestComponent {

      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
      public emissions$ = new Subject<SciDimension & {insideAngular: boolean}>();

      public setSize(size: {width: number; height: number}): void {
        this.testee().nativeElement.style.width = `${size.width}px`;
        this.testee().nativeElement.style.height = `${size.height}px`;
      }

      protected onDimensionChange(dimension: SciDimension): void {
        this.emissions$.next({...dimension, insideAngular: NgZone.isInAngularZone()});
      }
    }

    const fixture = TestBed.createComponent(TestComponent);
    const captor = new ObserveCaptor<SciDimension & {insideAngular: boolean}>();
    fixture.componentInstance.emissions$.subscribe(captor);

    // Expect initial size emission.
    await captor.waitUntilEmitCount(1);
    expect(captor.getLastValue()).toEqual({
      clientWidth: 300,
      offsetWidth: 302,
      clientHeight: 150,
      offsetHeight: 152,
      element: fixture.componentInstance.testee().nativeElement,
      insideAngular: true,
    });

    // Change size.
    fixture.componentInstance.setSize({width: 200, height: 100});

    // Expect emission because size has changed.
    await captor.waitUntilEmitCount(2);
    expect(captor.getLastValue()).toEqual({
      clientWidth: 200,
      offsetWidth: 202,
      clientHeight: 100,
      offsetHeight: 102,
      element: fixture.componentInstance.testee().nativeElement,
      insideAngular: true,
    });
  });

  it('should detect size change (outside Angular)', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-component',
      template: `
        <div class="testee" sciDimension (sciDimensionChange)="onDimensionChange($event)" [emitOutsideAngular]="true" #testee></div>
      `,
      styles: `
        div.testee {
          width: 300px;
          height: 150px;
          box-sizing: content-box;
          border: 1px solid red;
          background-color: blue;
        }
      `,
      imports: [
        SciDimensionDirective,
      ],
      standalone: true,
    })
    class TestComponent {

      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
      public emissions$ = new Subject<SciDimension & {insideAngular: boolean}>();

      public setSize(size: {width: number; height: number}): void {
        this.testee().nativeElement.style.width = `${size.width}px`;
        this.testee().nativeElement.style.height = `${size.height}px`;
      }

      protected onDimensionChange(dimension: SciDimension): void {
        this.emissions$.next({...dimension, insideAngular: NgZone.isInAngularZone()});
      }
    }

    const fixture = TestBed.createComponent(TestComponent);
    const captor = new ObserveCaptor<SciDimension & {insideAngular: boolean}>();
    fixture.componentInstance.emissions$.subscribe(captor);

    // Expect initial size emission.
    await captor.waitUntilEmitCount(1);
    expect(captor.getLastValue()).toEqual({
      clientWidth: 300,
      offsetWidth: 302,
      clientHeight: 150,
      offsetHeight: 152,
      element: fixture.componentInstance.testee().nativeElement,
      insideAngular: false,
    });

    // Change size.
    fixture.componentInstance.setSize({width: 200, height: 100});

    // Expect emission because size has changed.
    await captor.waitUntilEmitCount(2);
    expect(captor.getLastValue()).toEqual({
      clientWidth: 200,
      offsetWidth: 202,
      clientHeight: 100,
      offsetHeight: 102,
      element: fixture.componentInstance.testee().nativeElement,
      insideAngular: false,
    });
  });
});
