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
import {Component, computed, createEnvironmentInjector, DestroyRef, ElementRef, EnvironmentInjector, NgZone, runInInjectionContext, Signal, viewChild} from '@angular/core';
import {SciDimensionDirective} from './dimension.directive';
import {SciDimension} from './dimension';
import {fromDimension} from './dimension.signal';
import {firstValueFrom, mergeMap, NEVER, race, skip, Subject, throwError, timer} from 'rxjs';
import {ObserveCaptor} from '@scion/toolkit/testing';
import {toObservable} from '@angular/core/rxjs-interop';

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

describe('Dimension Signal', () => {

  it('should detect size change', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-component',
      template: `
        <div class="testee" #testee></div>
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
      standalone: true,
    })
    class TestComponent {

      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');

      public setSize(size: {width: number; height: number}): void {
        this.testee().nativeElement.style.width = `${size.width}px`;
        this.testee().nativeElement.style.height = `${size.height}px`;
      }
    }

    const fixture = TestBed.createComponent(TestComponent);
    const dimension = fromDimension(fixture.componentInstance.testee(), {destroyRef: TestBed.inject(DestroyRef)});

    // Expect initial size emission.
    expect(dimension()).toEqual({
      clientWidth: 300,
      offsetWidth: 302,
      clientHeight: 150,
      offsetHeight: 152,
      element: fixture.componentInstance.testee().nativeElement,
    });

    // Change size.
    fixture.componentInstance.setSize({width: 200, height: 100});

    // Expect changed size.
    await waitForSignalChange(dimension);
    expect(dimension()).toEqual({
      clientWidth: 200,
      offsetWidth: 202,
      clientHeight: 100,
      offsetHeight: 102,
      element: fixture.componentInstance.testee().nativeElement,
    });
  });

  it('should disconnect when `DestroyRef` is destroyed', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-component',
      template: `
        <div class="testee" #testee></div>
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
      standalone: true,
    })
    class TestComponent {

      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');

      public setSize(size: {width: number; height: number}): void {
        this.testee().nativeElement.style.width = `${size.width}px`;
        this.testee().nativeElement.style.height = `${size.height}px`;
      }
    }

    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const fixture = TestBed.createComponent(TestComponent);
    const dimension = fromDimension(fixture.componentInstance.testee(), {destroyRef: injector.get(DestroyRef)});

    // Expect initial size emission.
    expect(dimension()).toEqual({
      clientWidth: 300,
      offsetWidth: 302,
      clientHeight: 150,
      offsetHeight: 152,
      element: fixture.componentInstance.testee().nativeElement,
    });

    // Destroy injector (and DestroyRef).
    injector.destroy();

    // Change size.
    fixture.componentInstance.setSize({width: 200, height: 100});

    // Expect signal to be disconnected.
    await expectAsync(waitForSignalChange(dimension, {timeout: 500})).toBeRejected();
  });

  it('should disconnect when injection context is destroyed', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-component',
      template: `
        <div class="testee" #testee></div>
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
      standalone: true,
    })
    class TestComponent {

      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');

      public setSize(size: {width: number; height: number}): void {
        this.testee().nativeElement.style.width = `${size.width}px`;
        this.testee().nativeElement.style.height = `${size.height}px`;
      }
    }

    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const fixture = TestBed.createComponent(TestComponent);
    const dimension = runInInjectionContext(injector, () => fromDimension(fixture.componentInstance.testee()));

    // Expect initial size emission.
    expect(dimension()).toEqual({
      clientWidth: 300,
      offsetWidth: 302,
      clientHeight: 150,
      offsetHeight: 152,
      element: fixture.componentInstance.testee().nativeElement,
    });

    // Destroy injector.
    injector.destroy();

    // Change size.
    fixture.componentInstance.setSize({width: 200, height: 100});

    // Expect signal to be disconnected.
    await expectAsync(waitForSignalChange(dimension, {timeout: 500})).toBeRejected();
  });

  it('should error if called from within a reactive context', () => {
    const dimension = computed(() => fromDimension(document.body));
    expect(() => dimension()).toThrowError(/fromDimension\(\) cannot be called from within a reactive context/);
  });

  it('should error if not passing a `DestroyRef` and not calling it from an injection context', () => {
    expect(() => fromDimension(document.body)()).toThrowError(/fromDimension\(\) can only be used within an injection context/);
  });
});

/**
 * Waits for the signal to change its value.
 */
async function waitForSignalChange(signal: Signal<unknown>, options?: {timeout?: number}): Promise<void> {
  const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
  const timeout = options?.timeout;
  const onError = timeout ? timer(timeout).pipe(mergeMap(() => throwError(() => `Timeout ${timeout}ms elapsed.`))) : NEVER;
  const onChange = toObservable(signal, {injector}).pipe(skip(1));
  await firstValueFrom(race([onError, onChange])).finally(() => injector.destroy());
}
