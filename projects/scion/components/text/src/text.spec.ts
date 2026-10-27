/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {computed, createEnvironmentInjector, DestroyRef, EnvironmentInjector, EnvironmentProviders, inject, Injector, makeEnvironmentProviders, signal, WritableSignal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {text} from './text';
import {Observable} from 'rxjs';
import {toSignal} from '@angular/core/rxjs-interop';
import {SciTextProviderFn} from './text.provider';
import {SCI_TEXT_PROVIDER} from './text-providers';
import {Objects} from '@scion/toolkit/util';

describe('Text Provider', () => {

  it('should provide text for key (signal)', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(key => texts[key as 'key-1' | 'key-2']),
      ],
    });

    const texts: Record<'key-1' | 'key-2', WritableSignal<string>> = {
      'key-1': signal('text-1'),
      'key-2': signal('text-2'),
    };

    // Get text for key-1.
    const text1 = text('%key-1', {injector: TestBed.inject(Injector)});
    expect(text1()).toEqual('text-1');

    // Update text for key-1.
    texts['key-1'].set('TEXT-1');
    expect(text1()).toEqual('TEXT-1');

    // Get text for key-2.
    const text2 = text('%key-2', {injector: TestBed.inject(Injector)});
    expect(text2()).toEqual('text-2');

    // Update text for key-2.
    texts['key-2'].set('TEXT-2');
    expect(text2()).toEqual('TEXT-2');
  });

  it('should provide text for key (string)', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(key => texts[key]),
      ],
    });

    const texts: Record<string, string> = {
      'key-1': 'text-1',
      'key-2': 'text-2',
    };

    // Get text for key-1.
    const text1 = text('%key-1', {injector: TestBed.inject(Injector)});
    expect(text1()).toEqual('text-1');

    // Get text for key-2.
    const text2 = text('%key-2', {injector: TestBed.inject(Injector)});
    expect(text2()).toEqual('text-2');
  });

  it('should parse key without params', () => {
    const capture: {key?: string; params?: Record<string, string>} = {};

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key, params) => {
          capture.key = key;
          capture.params = params;
          return key;
        }),
      ],
    });

    text('%key', {injector: TestBed.inject(Injector)})();
    expect(capture.key).toEqual('key');
    expect(capture.params).toEqual({});
  });

  it('should parse key with single param', () => {
    const capture: {key?: string; params?: Record<string, string>} = {};

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key, params) => {
          capture.key = key;
          capture.params = params;
          return key;
        }),
      ],
    });

    text('%key;param=value', {injector: TestBed.inject(Injector)})();
    expect(capture.key).toEqual('key');
    expect(capture.params).toEqual({param: 'value'});
  });

  it('should parse key with multiple params', () => {
    const capture: {key?: string; params?: Record<string, string>} = {};

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key, params) => {
          capture.key = key;
          capture.params = params;
          return key;
        }),
      ],
    });

    text('%key;param1=value1;param2=value2;param3=value3', {injector: TestBed.inject(Injector)})();
    expect(capture.key).toEqual('key');
    expect(capture.params).toEqual({param1: 'value1', param2: 'value2', param3: 'value3'});
  });

  it('should parse key with params and merge with passed params', () => {
    const capture: {key?: string; params?: Record<string, string>} = {};

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key, params) => {
          capture.key = key;
          capture.params = params;
          return key;
        }),
      ],
    });

    text('%key;param1=value1;param2=value2;param3=value3a', {params: new Map().set('param3', 'value3b').set('param4', 'value4'), injector: TestBed.inject(Injector)})();
    expect(capture.key).toEqual('key');
    expect(capture.params).toEqual({param1: 'value1', param2: 'value2', param3: 'value3b', param4: 'value4'});
  });

  it('should get text with passed params', () => {
    const capture: {key?: string; params?: Record<string, string>} = {};

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key, params) => {
          capture.key = key;
          capture.params = params;
          return key;
        }),
      ],
    });

    text('%key', {params: new Map().set('param1', 'value1').set('param2', 'value2'), injector: TestBed.inject(Injector)})();
    expect(capture.key).toEqual('key');
    expect(capture.params).toEqual({param1: 'value1', param2: 'value2'});
  });

  it('should support escaped semicolon character in parameter value', () => {
    const capture: {key?: string; params?: Record<string, string>} = {};

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key, params) => {
          capture.key = key;
          capture.params = params;
          return key;
        }),
      ],
    });

    text('%key;param1=v\\;al=ue1;param2=va\\;lue2', {injector: TestBed.inject(Injector)})();
    expect(capture.key).toEqual('key');
    expect(capture.params).toEqual({'param1': 'v;al=ue1', param2: 'va;lue2'});
  });

  it('should support regex character in parameter value', () => {
    const capture: {key?: string; params?: Record<string, string>} = {};

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key, params) => {
          capture.key = key;
          capture.params = params;
          return key;
        }),
      ],
    });

    text('%key;p(a.r[am=va(lu.e[', {injector: TestBed.inject(Injector)})();
    expect(capture.key).toEqual('key');
    expect(capture.params).toEqual({'p(a.r[am': 'va(lu.e['});
  });

  it('should support empty param value', () => {
    const capture: {key?: string; params?: Record<string, string>} = {};

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key, params) => {
          capture.key = key;
          capture.params = params;
          return key;
        }),
      ],
    });

    text('%key;param1=;param2=', {injector: TestBed.inject(Injector)})();
    expect(capture.key).toEqual('key');
    expect(capture.params).toEqual({param1: '', param2: ''});
  });

  it('should support empty parameters', () => {
    const capture: {key?: string; params?: Record<string, string>} = {};

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key, params) => {
          capture.key = key;
          capture.params = params;
          return key;
        }),
      ],
    });

    text('%key;', {injector: TestBed.inject(Injector)})();
    expect(capture.key).toEqual('key');
    expect(capture.params).toEqual({});
  });

  it('should replace params', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key, params) => substituteParams(texts[key], params)),
      ],
    });

    const texts: Record<string, string> = {
      'message': 'Page {{path}} not found.',
    };

    // Expect parameters not to be replaced.
    const text1 = text('%message;a=b', {injector: TestBed.inject(Injector)})();
    expect(text1).toEqual('Page {{path}} not found.');

    // Expect parameters to be replaced.
    const text2 = text('%message;path=path/to/page', {injector: TestBed.inject(Injector)})();
    expect(text2).toEqual('Page path/to/page not found.');
  });

  it('should support observable as text provider using `toSignal`', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(key => texts[key] ? toSignal(texts[key], {requireSync: true}) : undefined),
      ],
    });

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

    const key = signal('%key-1');
    const injector = Injector.create({parent: TestBed.inject(Injector), providers: []});

    // Get text-1.
    const translation = text(key, {injector});
    expect(translation()).toEqual('text-1a');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(0);

    // Update text-1.
    textObservable1.next!('text-1b');
    expect(translation()).toEqual('text-1b');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(0);

    // Change key to text-2.
    key.set('%key-2');
    expect(translation()).toEqual('text-2a');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Update text-2.
    textObservable2.next!('text-2b');
    expect(translation()).toEqual('text-2b');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Change key to text-1.
    key.set('%key-1');
    expect(translation()).toEqual('text-1b');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Update text-1.
    textObservable1.next!('text-1c');
    expect(translation()).toEqual('text-1c');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Update text-2.
    textObservable2.next!('text-2c');
    expect(translation()).toEqual('text-1c');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Change key to text-2.
    key.set('%key-2');
    expect(translation()).toEqual('text-2c');
    expect(textObservable1.subscriberCount).toBe(1);
    expect(textObservable2.subscriberCount).toBe(1);

    // Destroy injector.
    injector.destroy();
    expect(translation()).toEqual('text-2c');
    expect(textObservable1.subscriberCount).toBe(0);
    expect(textObservable2.subscriberCount).toBe(0);
  });

  it('should return text as is if `undefined`', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => 'UNEXPECTED'),
      ],
    });

    const text1 = text(undefined as string | undefined, {injector: TestBed.inject(Injector)});
    expect(text1()).toBeUndefined();

    const text2 = text(signal(undefined as string | undefined), {injector: TestBed.inject(Injector)});
    expect(text2()).toBeUndefined();
  });

  it('should return text as is if not starting with "%"', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => 'UNEXPECTED'),
      ],
    });

    const translation = text('key', {injector: TestBed.inject(Injector)});
    expect(translation()).toEqual('key');
  });

  it('should return text as is if \'%\'', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => 'UNEXPECTED'),
      ],
    });

    const translation = text('%', {injector: TestBed.inject(Injector)});
    expect(translation()).toEqual('%');
  });

  it('should return text as is if empty', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => 'UNEXPECTED'),
      ],
    });

    const translation = text('', {injector: TestBed.inject(Injector)});
    expect(translation()).toEqual('');
  });

  it('should return text as is if not found', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => undefined),
      ],
    });

    const translation = text('%key', {injector: TestBed.inject(Injector)});
    expect(translation()).toEqual('%key');
  });

  it('should return text as is if found but empty', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => ''),
      ],
    });

    const translation = text('%key', {injector: TestBed.inject(Injector)});
    expect(translation()).toEqual('');
  });

  it('should return text as is if no text provider is configured', () => {
    const translation = text('%key', {injector: TestBed.inject(Injector)});
    expect(translation()).toEqual('%key');
  });

  it('should support passing key as signal, invoking function anew only on key change', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(key => {
          textProviderFunctionCallCount++;
          return computed(() => `key=${key}, text=${texts[key as keyof typeof texts]()}`);
        }),
      ],
    });

    const texts = {
      'key-1': signal('text-1'),
      'key-2': signal('text-2'),
    };
    const key = signal<'%key-1' | '%key-2'>('%key-1');

    let textProviderFunctionCallCount = 0;

    // Get text.
    const translation = text(key, {injector: TestBed.inject(Injector)});
    expect(translation()).toEqual('key=key-1, text=text-1');
    expect(textProviderFunctionCallCount).toBe(1);

    // Provide different text.
    texts['key-1'].set('text-1a');
    expect(translation()).toEqual('key=key-1, text=text-1a');
    expect(textProviderFunctionCallCount).toBe(1);

    // Change key.
    key.set('%key-2');
    expect(translation()).toEqual('key=key-2, text=text-2');
    expect(textProviderFunctionCallCount).toBe(2);

    // Provide different text.
    texts['key-2'].set('text-2a');
    expect(translation()).toEqual('key=key-2, text=text-2a');
    expect(textProviderFunctionCallCount).toBe(2);

    // Provide different text on previous signal.
    texts['key-1'].set('text-1b');
    expect(translation()).toEqual('key=key-2, text=text-2a');
    expect(textProviderFunctionCallCount).toBe(2);
  });

  it('should support multiple text providers', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(
          key => texts1[key] && `[provider-1] key=${key}, text=${texts1[key]}`,
          key => texts2[key] && `[provider-2] key=${key}, text=${texts2[key]}`,
        ),
      ],
    });

    const texts1: Record<string, string> = {
      'key-1': 'text-1',
      'key-2': 'text-2',
    };

    const texts2: Record<string, string> = {
      'key-1': 'TEXT-1',
      'key-3': 'TEXT-3',
      'key-4': 'TEXT-4',
    };

    // Get text for key-1.
    const text1 = text('%key-1', {injector: TestBed.inject(Injector)});
    expect(text1()).toEqual('[provider-1] key=key-1, text=text-1');

    // Get text for key-2.
    const text2 = text('%key-2', {injector: TestBed.inject(Injector)});
    expect(text2()).toEqual('[provider-1] key=key-2, text=text-2');

    // Get text for key-3.
    const text3 = text('%key-3', {injector: TestBed.inject(Injector)});
    expect(text3()).toEqual('[provider-2] key=key-3, text=TEXT-3');

    // Get text for key-4.
    const text4 = text('%key-4', {injector: TestBed.inject(Injector)});
    expect(text4()).toEqual('[provider-2] key=key-4, text=TEXT-4');
  });

  it('should invoke text provider in injection context', () => {
    let injector: Injector | undefined;

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => {
          injector = inject(Injector);
          return undefined;
        }),
      ],
    });

    text('%key', {injector: TestBed.inject(Injector)})();
    expect(injector).toBeDefined();
  });

  it('should destroy injection context', () => {
    let destroyed = false;

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => {
          inject(DestroyRef).onDestroy(() => destroyed = true);
          return undefined;
        }),
      ],
    });

    const injector = createEnvironmentInjector([], TestBed.inject(EnvironmentInjector));
    text('%key', {injector})();
    expect(destroyed).toBeFalse();

    // Destroy injection context.
    injector.destroy();
    expect(destroyed).toBeTrue();
  });

  it('should not propagate error', () => {
    // Spy console.
    spyOn(console, 'error').and.callThrough();

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => {
          throw error;
        }),
      ],
    });

    const error = Error('UNEXPECTED');
    const translated = text('%key', {injector: TestBed.inject(Injector)});

    // Expect key to be returned.
    expect(translated()).toEqual('%key');
    // Expected error to be logged.
    expect(console.error).toHaveBeenCalledWith(jasmine.stringContaining('[TextProviderError] Failed to get text for \'%%key\'. Caused by:'), error);
  });

  it('should not propagate error (text as signal)', () => {
    // Spy console.
    spyOn(console, 'error').and.callThrough();

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(() => {
          return computed(() => {
            throw error;
          });
        }),
      ],
    });

    const error = Error('UNEXPECTED');
    const translated = text('%key', {injector: TestBed.inject(Injector)});

    // Expect key to be returned.
    expect(translated()).toEqual('%key');
    // Expected error to be logged.
    expect(console.error).toHaveBeenCalledWith(jasmine.stringContaining('[TextProviderError] Failed to get text for \'%%key\'. Caused by:'), error);
  });

  it('should cache texts per injection context', () => {
    let destroyRef: DestroyRef | undefined;

    const textProviderFn = jasmine.createSpy<SciTextProviderFn>().and.callFake(() => {
      destroyRef = inject(Injector).get(DestroyRef);
      return 'Text';
    });

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(textProviderFn),
      ],
    });

    // Get text in injector 1.
    const injector1 = Injector.create({parent: TestBed.inject(Injector), providers: []});
    const text1 = text('%key1', {injector: injector1});
    expect(text1()).toEqual('Text');
    expect(textProviderFn).toHaveBeenCalledWith('key1', {});
    textProviderFn.calls.reset();

    // Get text again in injector 1.
    const text2 = text('%key1', {injector: injector1});
    expect(text2()).toEqual('Text');
    expect(textProviderFn).not.toHaveBeenCalled();
    textProviderFn.calls.reset();

    // Get text in injector 2.
    const injector2 = Injector.create({parent: TestBed.inject(Injector), providers: []});
    const text3 = text('%key1', {injector: injector2});
    expect(text3()).toEqual('Text');
    expect(textProviderFn).not.toHaveBeenCalled();
    textProviderFn.calls.reset();

    // Destroy injector 1.
    injector1.destroy();
    expect(destroyRef!.destroyed).toBeFalse();

    // Get text in injector 3.
    const injector3 = Injector.create({parent: TestBed.inject(Injector), providers: []});
    const text4 = text('%key1', {injector: injector3});
    expect(text4()).toEqual('Text');
    expect(textProviderFn).not.toHaveBeenCalled();
    textProviderFn.calls.reset();

    // Destroy injector 3.
    injector3.destroy();
    expect(destroyRef!.destroyed).toBeFalse();

    // Destroy injector 2.
    // Expect text injector to be destroyed.
    injector2.destroy();
    expect(destroyRef!.destroyed).toBeTrue();

    // Get text in injector 4.
    const injector4 = Injector.create({parent: TestBed.inject(Injector), providers: []});
    const text5 = text('%key1', {injector: injector4});
    expect(text5()).toEqual('Text');
    expect(textProviderFn).toHaveBeenCalledWith('key1', {});
    textProviderFn.calls.reset();
  });

  it('should cache texts by key and params', () => {
    const destroyRefs = new Array<DestroyRef>();

    const textProviderFn = jasmine.createSpy<SciTextProviderFn>().and.callFake((key, params) => {
      destroyRefs.push(inject(Injector).get(DestroyRef));
      return `${key} {${Objects.toMatrixNotation(params)}}`;
    });

    TestBed.configureTestingModule({
      providers: [
        provideTextProvider(textProviderFn),
      ],
    });

    const injector = Injector.create({parent: TestBed.inject(Injector), providers: []});

    // Get text for %key1.
    expect(text('%key1', {injector: injector})()).toEqual('key1 {}');
    expect(textProviderFn).toHaveBeenCalledWith('key1', {});
    expect(destroyRefs.map(destroyRef => destroyRef.destroyed)).toEqual([false]);
    textProviderFn.calls.reset();

    // Get text for %key1.
    expect(text('%key1', {injector: injector})()).toEqual('key1 {}');
    expect(textProviderFn).not.toHaveBeenCalled();
    expect(destroyRefs.map(destroyRef => destroyRef.destroyed)).toEqual([false]);
    textProviderFn.calls.reset();

    // Get text for %key2.
    expect(text('%key2', {injector: injector})()).toEqual('key2 {}');
    expect(textProviderFn).toHaveBeenCalledWith('key2', {});
    expect(destroyRefs.map(destroyRef => destroyRef.destroyed)).toEqual([false, false]);
    textProviderFn.calls.reset();

    // Get text for %key2.
    expect(text('%key2', {injector: injector})()).toEqual('key2 {}');
    expect(textProviderFn).not.toHaveBeenCalled();
    expect(destroyRefs.map(destroyRef => destroyRef.destroyed)).toEqual([false, false]);
    textProviderFn.calls.reset();

    // Get text for %key2;a=b.
    expect(text('%key2;a=b', {injector: injector})()).toEqual('key2 {a=b}');
    expect(textProviderFn).toHaveBeenCalledWith('key2', {a: 'b'});
    expect(destroyRefs.map(destroyRef => destroyRef.destroyed)).toEqual([false, false, false]);
    textProviderFn.calls.reset();

    // Get text for %key2;a=b.
    expect(text('%key2;a=b', {injector: injector})()).toEqual('key2 {a=b}');
    expect(textProviderFn).not.toHaveBeenCalled();
    expect(destroyRefs.map(destroyRef => destroyRef.destroyed)).toEqual([false, false, false]);
    textProviderFn.calls.reset();

    // Get text for %key2;a=c.
    expect(text('%key2;a=c', {injector: injector})()).toEqual('key2 {a=c}');
    expect(textProviderFn).toHaveBeenCalledWith('key2', {a: 'c'});
    expect(destroyRefs.map(destroyRef => destroyRef.destroyed)).toEqual([false, false, false, false]);
    textProviderFn.calls.reset();

    // Destroy injector.
    injector.destroy();
    expect(destroyRefs.map(destroyRef => destroyRef.destroyed)).toEqual([true, true, true, true]);
  });
});

describe('Built-in Text Provider', () => {

  it('should provide built-in text', () => {
    const translated = text('%scion.components.no_items.message', {injector: TestBed.inject(Injector)});
    expect(translated()).toEqual('No items found.');
  });

  it('should provide custom text', () => {
    TestBed.configureTestingModule({
      providers: [
        provideTextProvider((key: string) => {
          if (key.startsWith('scion.')) {
            return undefined;
          }
          return `Custom Text for "${key}"`;
        }),
      ],
    });

    const text1 = text('%custom_text', {injector: TestBed.inject(Injector)});
    expect(text1()).toEqual('Custom Text for "custom_text"');

    const text2 = text('%scion.components.no_items.message', {injector: TestBed.inject(Injector)});
    expect(text2()).toEqual('No items found.');
  });
});

function provideTextProvider(...textProviders: SciTextProviderFn[]): EnvironmentProviders {
  return makeEnvironmentProviders(textProviders.map(textProvider => ({
    provide: SCI_TEXT_PROVIDER,
    useValue: textProvider,
    multi: true,
  })));
}

function substituteParams(text: string | undefined, params: {[name: string]: string}): string | undefined {
  if (text === undefined) {
    return undefined;
  }
  if (Object.keys(params).length) {
    return text.replace(/{{(?<param>[^}]+)}}/g, (match: string, param: string) => params[param] ?? match);
  }
  return text;
}
