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
import {Component, computed, createEnvironmentInjector, effect, ElementRef, EnvironmentInjector, Injector, runInInjectionContext, signal, Signal, viewChild} from '@angular/core';
import {SciDimension} from './dimension';
import {dimension} from './dimension.signal';
import {firstValueFrom, mergeMap, NEVER, race, throwError, timer} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {first} from 'rxjs/operators';

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
    })
    class TestComponent {
      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
    }

    const fixture = TestBed.createComponent(TestComponent);
    const size = TestBed.runInInjectionContext(() => dimension(fixture.componentInstance.testee()));

    // Expect initial size.
    expect(size()).toEqual({
      clientWidth: 300,
      offsetWidth: 302,
      clientHeight: 150,
      offsetHeight: 152,
      element: fixture.componentInstance.testee().nativeElement,
    });

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 200, height: 100});

    // Expect changed size.
    await waitForSignalChange(size);
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 200,
      clientHeight: 100,
      element: fixture.componentInstance.testee().nativeElement,
    }));
  });

  it('should observe element from signal', async () => {
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
    })
    class TestComponent {
      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
    }

    const fixture = TestBed.createComponent(TestComponent);
    const size = TestBed.runInInjectionContext(() => dimension(fixture.componentInstance.testee));

    // Expect size.
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 300,
      clientHeight: 150,
      element: fixture.componentInstance.testee().nativeElement,
    }));

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 350, height: 250});
    await waitForSignalChange(size);
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 350,
      clientHeight: 250,
    }));
  });

  it('should observe required view child in component constructor', async () => {
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
    })
    class TestComponent {
      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
      public size = dimension(this.testee);
    }

    const fixture = TestBed.createComponent(TestComponent);
    const size = fixture.componentInstance.size;

    // Expect typing that dimension is not `undefined` for required view child.
    expect(size().element).toBe(fixture.componentInstance.testee().nativeElement);

    // Expect size.
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 300,
      clientHeight: 150,
      element: fixture.componentInstance.testee().nativeElement,
    }));

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 350, height: 250});
    await waitForSignalChange(size);
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 350,
      clientHeight: 250,
    }));
  });

  it('should observe optional view child in component constructor', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-component',
      template: `
        @if (observeViewChild() === 'testee-1') {
          <div class="testee-1" #testee #testee_1></div>
        }
        @if (observeViewChild() === 'testee-2') {
          <div class="testee-2" #testee #testee_2></div>
        }
      `,
      styles: `
        div.testee-1 {
          width: 300px;
          height: 150px;
          box-sizing: content-box;
          border: 1px solid red;
          background-color: blue;
        }

        div.testee-2 {
          width: 200px;
          height: 50px;
          box-sizing: content-box;
          border: 1px solid red;
          background-color: green;
        }
      `,
    })
    class TestComponent {
      public observeViewChild = signal<'testee-1' | 'testee-2' | 'none'>('none');
      public testee = viewChild<ElementRef<HTMLElement>>('testee');
      public size = dimension(this.testee);

      public testee1 = viewChild<ElementRef<HTMLElement>>('testee_1');
      public testee2 = viewChild<ElementRef<HTMLElement>>('testee_2');
    }

    const fixture = TestBed.createComponent(TestComponent);
    const size = fixture.componentInstance.size;

    // Capture emissions.
    const emissions = new Array<SciDimension | undefined>();
    effect(() => emissions.push(size()), {injector: TestBed.inject(Injector)});

    // Expect null dimension.
    expect(size()).toBeUndefined();

    // Observe testee 1.
    fixture.componentInstance.observeViewChild.set('testee-1');
    await waitForSignalChange(fixture.componentInstance.size);

    // Expect size.
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 300,
      clientHeight: 150,
      element: fixture.componentInstance.testee1()!.nativeElement,
    }));

    // Resize testee 1.
    setSize(fixture.componentInstance.testee1()!, {width: 350, height: 250});
    await waitForSignalChange(fixture.componentInstance.size);
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 350,
      clientHeight: 250,
      element: fixture.componentInstance.testee1()!.nativeElement,
    }));

    // Observe testee 2.
    fixture.componentInstance.observeViewChild.set('testee-2');
    await waitForSignalChange(fixture.componentInstance.size);

    // Expect size.
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 200,
      clientHeight: 50,
      element: fixture.componentInstance.testee2()!.nativeElement,
    }));

    // Resize testee 2.
    setSize(fixture.componentInstance.testee2()!, {width: 275, height: 75});
    await waitForSignalChange(size);
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 275,
      clientHeight: 75,
      element: fixture.componentInstance.testee2()!.nativeElement,
    }));

    // Unobserve view child.
    fixture.componentInstance.observeViewChild.set('none');
    await waitForSignalChange(size);

    // Expect dimension to be undefined.
    expect(size()).toBeUndefined();

    // Assert captured emissions.
    expect(emissions).toEqual([
      undefined,
      jasmine.objectContaining({
        clientWidth: 300,
        clientHeight: 150,
      }),
      jasmine.objectContaining({
        clientWidth: 350,
        clientHeight: 250,
      }),
      jasmine.objectContaining({
        clientWidth: 200,
        clientHeight: 50,
      }),
      jasmine.objectContaining({
        clientWidth: 275,
        clientHeight: 75,
      }),
      undefined,
    ]);
  });

  it('should error if reading signal for required view child in constructor', () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-component',
      template: `
        <div #testee></div>
      `,
    })
    class TestComponent {

      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
      public dimension = dimension(this.testee);

      constructor() {
        this.dimension();
      }
    }

    expect(() => TestBed.createComponent(TestComponent)).toThrowError(/NG0951: Child query result is required but no value is available/);
  });

  it('should disconnect when the passed injection context is destroyed', async () => {
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
    })
    class TestComponent {
      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
    }

    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const fixture = TestBed.createComponent(TestComponent);
    const size = dimension(fixture.componentInstance.testee(), {injector});

    // Expect initial size.
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 300,
      clientHeight: 150,
    }));

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 301, height: 151});
    await waitForSignalChange(size);
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 301,
      clientHeight: 151,
    }));

    // Destroy injector.
    injector.destroy();

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 302, height: 152});

    // Expect signal to be disconnected.
    await expectAsync(waitForSignalChange(size, {timeout: 500})).toBeRejected();
  });

  it('should disconnect when the current injection context is destroyed', async () => {
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
    })
    class TestComponent {
      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
    }

    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    const fixture = TestBed.createComponent(TestComponent);
    const size = runInInjectionContext(injector, () => dimension(fixture.componentInstance.testee()));

    // Expect initial size.
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 300,
      clientHeight: 150,
    }));

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 301, height: 151});
    await waitForSignalChange(size);
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 301,
      clientHeight: 151,
    }));

    // Destroy injector.
    injector.destroy();

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 302, height: 152});

    // Expect signal to be disconnected.
    await expectAsync(waitForSignalChange(size, {timeout: 500})).toBeRejected();
  });

  it('should disconnect from previous element', async () => {
    TestBed.configureTestingModule({
      providers: [
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-component',
      template: `
        <div class="testee-1" #testee_1></div>
        <div class="testee-2" #testee_2></div>
      `,
      styles: `
        div.testee-1 {
          width: 300px;
          height: 150px;
          box-sizing: content-box;
          border: 1px solid red;
          background-color: blue;
        }

        div.testee-2 {
          width: 200px;
          height: 50px;
          box-sizing: content-box;
          border: 1px solid green;
          background-color: black;
        }
      `,
    })
    class TestComponent {
      public testee1 = viewChild.required<ElementRef<HTMLElement>>('testee_1');
      public testee2 = viewChild.required<ElementRef<HTMLElement>>('testee_2');
    }

    const fixture = TestBed.createComponent(TestComponent);
    const element = signal<ElementRef<HTMLElement> | undefined>(undefined);
    const size = TestBed.runInInjectionContext(() => dimension(element));

    // Observe testee 1.
    element.set(fixture.componentInstance.testee1());

    // Expect size.
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 300,
      clientHeight: 150,
      element: fixture.componentInstance.testee1().nativeElement,
    }));

    // Resize testee 1.
    setSize(fixture.componentInstance.testee1(), {width: 301, height: 151});
    await waitForSignalChange(size);
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 301,
      clientHeight: 151,
      element: fixture.componentInstance.testee1().nativeElement,
    }));

    // Change element to testee 2.
    element.set(fixture.componentInstance.testee2());

    // Expect size.
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 200,
      clientHeight: 50,
      element: fixture.componentInstance.testee2().nativeElement,
    }));

    // Resize testee 2.
    setSize(fixture.componentInstance.testee2(), {width: 201, height: 51});
    await waitForSignalChange(size);
    expect(size()).toEqual(jasmine.objectContaining({
      clientWidth: 201,
      clientHeight: 51,
      element: fixture.componentInstance.testee2().nativeElement,
    }));

    // Resize testee 1.
    setSize(fixture.componentInstance.testee1(), {width: 999, height: 999});
    // Expect testee 1 to be disconnected.
    await expectAsync(waitForSignalChange(size, {timeout: 500})).toBeRejected();
  });

  it('should error if called from within a reactive context', () => {
    const size = computed(() => dimension(document.body));
    expect(() => size()).toThrowError(/dimension\(\) cannot be called from within a reactive context/);
  });

  it('should error if not passing an `Injector` and not calling it from an injection context', () => {
    expect(() => dimension(document.body)()).toThrowError(/dimension\(\) can only be used within an injection context/);
  });
});

/**
 * Waits for the signal to change its value.
 */
async function waitForSignalChange(signal: Signal<unknown>, options?: {timeout?: number}): Promise<void> {
  const currentValue = signal();
  const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
  const timeout = options?.timeout;
  const onError = timeout ? timer(timeout).pipe(mergeMap(() => throwError(() => `Timeout ${timeout}ms elapsed.`))) : NEVER;
  const onChange$ = toObservable(signal, {injector}).pipe(first(value => value !== currentValue));
  await firstValueFrom(race([onError, onChange$])).finally(() => injector.destroy());
}

function setSize(element: ElementRef<HTMLElement>, size: {width: number; height: number}): void {
  element.nativeElement.style.width = `${size.width}px`;
  element.nativeElement.style.height = `${size.height}px`;
}
