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
import {firstValueFrom, mergeMap, NEVER, race, throwError, timer} from 'rxjs';
import {toObservable} from '@angular/core/rxjs-interop';
import {first} from 'rxjs/operators';
import {boundingClientRect} from './bounding-client-rect.signal';

describe('Bounding Client Rect Signal', () => {

  it('should detect bounding client rect change', async () => {
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
          position: relative;
          width: 300px;
          height: 150px;
          box-sizing: border-box;
          border: 1px solid red;
          background-color: blue;
        }
      `,
    })
    class TestComponent {
      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
    }

    const fixture = TestBed.createComponent(TestComponent);
    const boundingBox = TestBed.runInInjectionContext(() => boundingClientRect(fixture.componentInstance.testee()));
    const {x, y} = boundingBox();

    // Expect initial bounding box.
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 300,
      height: 150,
      x,
      y,
    }));

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 200, height: 100});
    // Change position.
    setTransform(fixture.componentInstance.testee(), {x: 10, y: 10});

    // Expect changed size.
    await waitForSignalChange(boundingBox);
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 200,
      height: 100,
      x: x + 10,
      y: y + 10,
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
          position: relative;
          width: 300px;
          height: 150px;
          box-sizing: border-box;
          border: 1px solid red;
          background-color: blue;
        }
      `,
    })
    class TestComponent {
      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
    }

    const fixture = TestBed.createComponent(TestComponent);
    const boundingBox = TestBed.runInInjectionContext(() => boundingClientRect(fixture.componentInstance.testee));
    const {x, y} = boundingBox();

    // Expect initial bounding box.
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 300,
      height: 150,
      x,
      y,
    }));

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 200, height: 100});
    // Change position.
    setTransform(fixture.componentInstance.testee(), {x: 10, y: 10});

    await waitForSignalChange(boundingBox);
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 200,
      height: 100,
      x: x + 10,
      y: y + 10,
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
          position: relative;
          width: 300px;
          height: 150px;
          box-sizing: border-box;
          border: 1px solid red;
          background-color: blue;
        }
      `,
    })
    class TestComponent {
      public testee = viewChild.required<ElementRef<HTMLElement>>('testee');
      public boundingBox = boundingClientRect(this.testee);
    }

    const fixture = TestBed.createComponent(TestComponent);
    const boundingBox = fixture.componentInstance.boundingBox;
    const {x, y} = boundingBox();

    // Expect typing that bounding box is not `undefined` for required view child.
    expect(boundingBox().height).toEqual(150);

    // Expect size.
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 300,
      height: 150,
      x,
      y,
    }));

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 200, height: 100});
    // Change position.
    setTransform(fixture.componentInstance.testee(), {x: 10, y: 10});

    await waitForSignalChange(boundingBox);
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 200,
      height: 100,
      x: x + 10,
      y: y + 10,
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
          position: relative;
          width: 300px;
          height: 150px;
          box-sizing: border-box;
          border: 1px solid red;
          background-color: blue;
        }

        div.testee-2 {
          position: relative;
          width: 200px;
          height: 50px;
          box-sizing: border-box;
          border: 1px solid red;
          background-color: green;
        }
      `,
    })
    class TestComponent {
      public observeViewChild = signal<'testee-1' | 'testee-2' | 'none'>('none');
      public testee = viewChild<ElementRef<HTMLElement>>('testee');
      public boundingBox = boundingClientRect(this.testee);

      public testee1 = viewChild<ElementRef<HTMLElement>>('testee_1');
      public testee2 = viewChild<ElementRef<HTMLElement>>('testee_2');
    }

    const fixture = TestBed.createComponent(TestComponent);
    const boundingBox = fixture.componentInstance.boundingBox;

    // Capture emissions.
    const emissions = new Array<DOMRect | undefined>();
    effect(() => emissions.push(boundingBox()), {injector: TestBed.inject(Injector)});

    // Expect null bounding box.
    expect(boundingBox()).toBeUndefined();

    // Observe testee 1.
    fixture.componentInstance.observeViewChild.set('testee-1');
    await waitForSignalChange(fixture.componentInstance.boundingBox);

    // Expect bounding box.
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 300,
      height: 150,
    }));

    // Resize testee 1.
    setSize(fixture.componentInstance.testee1()!, {width: 350, height: 250});
    await waitForSignalChange(fixture.componentInstance.boundingBox);
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 350,
      height: 250,
    }));

    // Observe testee 2.
    fixture.componentInstance.observeViewChild.set('testee-2');
    await waitForSignalChange(fixture.componentInstance.boundingBox);

    // Expect bounding box.
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 200,
      height: 50,
    }));

    // Resize testee 2.
    setSize(fixture.componentInstance.testee2()!, {width: 275, height: 75});
    await waitForSignalChange(boundingBox);
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 275,
      height: 75,
    }));

    // Unobserve view child.
    fixture.componentInstance.observeViewChild.set('none');
    await waitForSignalChange(boundingBox);

    // Expect bounding box to be undefined.
    expect(boundingBox()).toBeUndefined();

    // Assert captured emissions.
    expect(emissions).toEqual([
      undefined,
      jasmine.objectContaining({
        width: 300,
        height: 150,
      }),
      jasmine.objectContaining({
        width: 350,
        height: 250,
      }),
      jasmine.objectContaining({
        width: 200,
        height: 50,
      }),
      jasmine.objectContaining({
        width: 275,
        height: 75,
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
      public boundingBox = boundingClientRect(this.testee);

      constructor() {
        this.boundingBox();
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
          position: relative;
          width: 300px;
          height: 150px;
          box-sizing: border-box;
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
    const boundingBox = boundingClientRect(fixture.componentInstance.testee(), {injector});

    // Expect initial bounding box.
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 300,
      height: 150,
    }));

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 301, height: 151});
    await waitForSignalChange(boundingBox);
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 301,
      height: 151,
    }));

    // Destroy injector.
    injector.destroy();

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 302, height: 152});

    // Expect signal to be disconnected.
    await expectAsync(waitForSignalChange(boundingBox, {timeout: 500})).toBeRejected();
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
          position: relative;
          width: 300px;
          height: 150px;
          box-sizing: border-box;
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
    const boundingBox = runInInjectionContext(injector, () => boundingClientRect(fixture.componentInstance.testee()));

    // Expect initial bounding box.
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 300,
      height: 150,
    }));

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 301, height: 151});
    await waitForSignalChange(boundingBox);
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 301,
      height: 151,
    }));

    // Destroy injector.
    injector.destroy();

    // Change size.
    setSize(fixture.componentInstance.testee(), {width: 302, height: 152});

    // Expect signal to be disconnected.
    await expectAsync(waitForSignalChange(boundingBox, {timeout: 500})).toBeRejected();
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
        :host {
          position: relative;
        }

        div.testee-1 {
          position: absolute;
          top: 0;
          width: 300px;
          height: 150px;
          box-sizing: border-box;
          border: 1px solid red;
          background-color: blue;
        }

        div.testee-2 {
          position: absolute;
          top: 200px;
          width: 200px;
          height: 50px;
          box-sizing: border-box;
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
    const boundingBox = TestBed.runInInjectionContext(() => boundingClientRect(element));

    // Observe testee 1.
    element.set(fixture.componentInstance.testee1());

    // Expect bounding box.
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 300,
      height: 150,
    }));

    // Resize testee 1.
    setSize(fixture.componentInstance.testee1(), {width: 301, height: 151});
    await waitForSignalChange(boundingBox);
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 301,
      height: 151,
    }));

    // Change element to testee 2.
    element.set(fixture.componentInstance.testee2());

    // Expect bounding box.
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 200,
      height: 50,
    }));

    // Resize testee 2.
    setSize(fixture.componentInstance.testee2(), {width: 201, height: 51});
    await waitForSignalChange(boundingBox);
    expect(boundingBox()).toEqual(jasmine.objectContaining({
      width: 201,
      height: 51,
    }));

    // Resize testee 1.
    setSize(fixture.componentInstance.testee1(), {width: 999, height: 999});
    // Expect testee 1 to be disconnected.
    await expectAsync(waitForSignalChange(boundingBox, {timeout: 500})).toBeRejected();
  });

  it('should error if called from within a reactive context', () => {
    const boundingBox = computed(() => boundingClientRect(document.body));
    expect(() => boundingBox()).toThrowError(/boundingClientRect\(\) cannot be called from within a reactive context/);
  });

  it('should error if not passing an `Injector` and not calling it from an injection context', () => {
    expect(() => boundingClientRect(document.body)()).toThrowError(/boundingClientRect\(\) can only be used within an injection context/);
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

function setTransform(element: ElementRef<HTMLElement>, translation: {x: number; y: number}): void {
  element.nativeElement.style.transform = `translate(${translation.x}px,${translation.y}px)`;
}
