/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, EnvironmentProviders, input, makeEnvironmentProviders, signal, WritableSignal} from '@angular/core';
import {ComponentFixtureAutoDetect, TestBed} from '@angular/core/testing';
import {toSignal} from '@angular/core/rxjs-interop';
import {Observable} from 'rxjs';
import {SciTextPipe} from './text.pipe';
import {SciTextProviderFn} from './text.provider';
import {SCI_TEXT_PROVIDER} from './text-providers';

describe('Text Pipe', () => {

  it('should provide text', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(key => texts[key as 'key-1' | 'key-2']),
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    const texts: Record<'key-1' | 'key-2', WritableSignal<string>> = {
      'key-1': signal('text-1'),
      'key-2': signal('text-2'),
    };

    @Component({
      selector: 'spec-testee',
      template: '{{(key() | sciText)()}}',
      imports: [
        SciTextPipe,
      ],
    })
    class SpecRootComponent {
      public key = input<string>();
    }

    const fixture = TestBed.createComponent(SpecRootComponent);

    // Get text for key-1.
    fixture.componentRef.setInput('key', '%key-1');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.innerText).toEqual('text-1');

    // Update text for key-1.
    texts['key-1'].set('TEXT-1');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.innerText).toEqual('TEXT-1');

    // Get text for key-2.
    fixture.componentRef.setInput('key', '%key-2');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.innerText).toEqual('text-2');

    // Update text for key-2.
    texts['key-2'].set('TEXT-2');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.innerText).toEqual('TEXT-2');
  });

  it('should support observable as text provider using `toSignal`', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(key => texts[key] ? toSignal(texts[key], {requireSync: true}) : undefined),
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-testee',
      template: '{{(key() | sciText)()}}',
      imports: [
        SciTextPipe,
      ],
    })
    class SpecRootComponent {
      public key = input<string>();
    }

    const fixture = TestBed.createComponent(SpecRootComponent);

    const textObservable1: {next?(text: string): void; subscriberCount: number} = {subscriberCount: 0};
    const textObservable2: {next?(text: string): void; subscriberCount: number} = {subscriberCount: 0};

    const texts: Record<string, Observable<string>> = {
      'key-1': new Observable(observer => {
        textObservable1.subscriberCount++;
        textObservable1.next = observer.next.bind(observer);
        textObservable1.next('text-1a');
        return () => textObservable1.subscriberCount--;
      }),
      'key-2': new Observable(observer => {
        textObservable2.subscriberCount++;
        textObservable2.next = observer.next.bind(observer);
        textObservable2.next('text-2a');
        return () => textObservable2.subscriberCount--;
      }),
    };

    fixture.componentRef.setInput('key', '%key-1');
    await fixture.whenStable();

    // Get text-1.
    expect(fixture.debugElement.nativeElement.textContent).toEqual('text-1a');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(0);

    // Update text-1.
    textObservable1.next!('text-1b');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.textContent).toEqual('text-1b');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(0);

    // Change key to text-2.
    fixture.componentRef.setInput('key', '%key-2');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.textContent).toEqual('text-2a');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Update text-2.
    textObservable2.next!('text-2b');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.textContent).toEqual('text-2b');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Change key to text-1.
    fixture.componentRef.setInput('key', '%key-1');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.textContent).toEqual('text-1b');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Update text-1.
    textObservable1.next!('text-1c');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.textContent).toEqual('text-1c');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Update text-2.
    textObservable2.next!('text-2c');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.textContent).toEqual('text-1c');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Change key to text-2.
    fixture.componentRef.setInput('key', '%key-2');
    await fixture.whenStable();
    expect(fixture.debugElement.nativeElement.textContent).toEqual('text-2c');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);
  });

  it('should not propagate error', async () => {
    // Spy console.
    spyOn(console, 'error').and.callThrough();

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => {
          throw error;
        }),
        {provide: ComponentFixtureAutoDetect, useValue: true},
      ],
    });

    @Component({
      selector: 'spec-testee',
      template: '{{(\'%key\' | sciText)()}}',
      imports: [
        SciTextPipe,
      ],
    })
    class SpecRootComponent {
    }

    const error = Error('UNEXPECTED');
    const fixture = TestBed.createComponent(SpecRootComponent);
    await fixture.whenStable();

    // Expect key to be displayed.
    expect(fixture.debugElement.nativeElement.innerText).toEqual('%key');
    // Expected error to be logged.
    expect(console.error).toHaveBeenCalledWith(jasmine.stringContaining('[TextProviderError] Failed to get text for \'%%key\'. Caused by:'), error);
  });
});

function provideTextProvider(textProvider: SciTextProviderFn): EnvironmentProviders {
  return makeEnvironmentProviders([{
    provide: SCI_TEXT_PROVIDER,
    useValue: textProvider,
    multi: true,
  }]);
}
