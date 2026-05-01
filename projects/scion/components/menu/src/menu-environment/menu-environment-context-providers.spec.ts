/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {createEnvironmentInjector, ElementRef, EnvironmentInjector, inject, InjectionToken, Injector, runInInjectionContext, signal} from '@angular/core';
import {TestBed} from '@angular/core/testing';
import {provideMenuAcceleratorTargetProvider, provideMenuContextProvider, provideMenuInjectionContextProvider, SciMenuInjectionContextProviderFn} from './menu-environment.provider';
import {injectMenuAcceleratorTargets, injectMenuContext, injectMenuInjectionContextProviders} from './menu-environment-providers';

describe('injectMenuContext', () => {

  it('should inject if no providers', async () => {
    const context = injectMenuContext({injector: TestBed.inject(Injector)});
    expect(context()).toEqual(new Map());
  });

  it('should inject menu context for current injection context', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuContextProvider(() => new Map([['key', 'value']])),
      ],
    });

    const context = runInInjectionContext(TestBed.inject(Injector), () => injectMenuContext());
    expect(context()).toEqual(new Map([['key', 'value']]));
  });

  it('should inject menu context for passed injection context', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuContextProvider(() => new Map([['key', 'value']])),
      ],
    });

    const context = injectMenuContext({injector: TestBed.inject(Injector)});
    expect(context()).toEqual(new Map([['key', 'value']]));
  });

  it('should inject menu context from multiple providers', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuContextProvider(() => new Map([['a', 'A (provider 1)'], ['b', 'B (provider 1)']])),
        provideMenuContextProvider(() => new Map([['b', 'B (provider 2)'], ['c', 'C (provider 2)']])),
      ],
    });

    const context = injectMenuContext({injector: TestBed.inject(Injector)});
    expect(context()).toEqual(new Map([['a', 'A (provider 1)'], ['b', 'B (provider 2)'], ['c', 'C (provider 2)']]));
  });

  it('should inject menu context from multiple providers registered at different injector tree levels', async () => {
    // Root injector
    TestBed.configureTestingModule({
      providers: [
        provideMenuContextProvider(() => new Map([['a', 'Level 1']])),
        provideMenuContextProvider(() => new Map([['b', 'Level 1']])),
      ],
    });

    // Child injector 1
    const childInjector1 = createEnvironmentInjector([
      provideMenuContextProvider(() => new Map([['b', 'Level 2']])),
      provideMenuContextProvider(() => new Map([['c', 'Level 2']])),
      provideMenuContextProvider(() => new Map([['d', 'Level 2']])),
    ], TestBed.inject(EnvironmentInjector));

    // Child injector 2
    const childInjector2 = createEnvironmentInjector([], childInjector1); // empty injector

    // Child injector 3
    const childInjector3 = createEnvironmentInjector([
      provideMenuContextProvider(() => new Map([['d', 'Level 3']])),
      provideMenuContextProvider(() => new Map([['e', 'Level 3']])),
    ], childInjector2);

    // // Assert root injector.
    {
      const actualContext = injectMenuContext({injector: TestBed.inject(Injector)});
      expect(actualContext()).toEqual(new Map([['a', 'Level 1'], ['b', 'Level 1']]));
    }
    // Assert child injector 1.
    {
      const actualContext = injectMenuContext({injector: childInjector1});
      expect(actualContext()).toEqual(new Map([['a', 'Level 1'], ['b', 'Level 2'], ['c', 'Level 2'], ['d', 'Level 2']]));
    }
    // Assert child injector 2.
    {
      const actualContext = injectMenuContext({injector: childInjector2});
      expect(actualContext()).toEqual(new Map([['a', 'Level 1'], ['b', 'Level 2'], ['c', 'Level 2'], ['d', 'Level 2']]));
    }
    // Assert child injector 3.
    {
      const actualContext = injectMenuContext({injector: childInjector3});
      expect(actualContext()).toEqual(new Map([['a', 'Level 1'], ['b', 'Level 2'], ['c', 'Level 2'], ['d', 'Level 3'], ['e', 'Level 3']]));
    }
  });

  it('should inject menu context as signal from multiple providers', async () => {
    const context1 = signal(new Map<string, unknown>());
    const context2 = signal(new Map<string, unknown>());

    TestBed.configureTestingModule({
      providers: [
        provideMenuContextProvider(() => context1),
        provideMenuContextProvider(() => context2),
      ],
    });

    const context = injectMenuContext({injector: TestBed.inject(Injector)});
    expect(context()).toEqual(new Map());

    // Update context 1.
    context1.set(new Map([['a', 'A (provider 1)']]));
    expect(context()).toEqual(new Map([['a', 'A (provider 1)']]));

    // Update context 1.
    context1.set(new Map([['a', 'A (provider 1)'], ['b', 'B (provider 1)']]));
    expect(context()).toEqual(new Map([['a', 'A (provider 1)'], ['b', 'B (provider 1)']]));

    // Update context 2.
    context2.set(new Map([['b', 'B (provider 2)']]));
    expect(context()).toEqual(new Map([['a', 'A (provider 1)'], ['b', 'B (provider 2)']]));

    // Update context 2.
    context2.set(new Map([['b', 'B (provider 2)'], ['c', 'C (provider 2)']]));
    expect(context()).toEqual(new Map([['a', 'A (provider 1)'], ['b', 'B (provider 2)'], ['c', 'C (provider 2)']]));
  });

  it('should call provider function in injector which provides it', async () => {
    const TOKEN = new InjectionToken<string>('TOKEN');

    // Root injector
    TestBed.configureTestingModule({
      providers: [
        {provide: TOKEN, useValue: 'Level 1'},
        provideMenuContextProvider(() => new Map([['tokenLevel1', inject(TOKEN)], ['token', inject(TOKEN)]])),
      ],
    });

    // Child injector 1
    const childInjector1 = createEnvironmentInjector([
      {provide: TOKEN, useValue: 'Level 2'},
      provideMenuContextProvider(() => new Map([['tokenLevel2', inject(TOKEN)], ['token', inject(TOKEN)]])),
    ], TestBed.inject(EnvironmentInjector));

    // Child injector 2
    const childInjector2 = createEnvironmentInjector([
      {provide: TOKEN, useValue: 'Level 3'},
      provideMenuContextProvider(() => new Map([['tokenLevel3', inject(TOKEN)], ['token', inject(TOKEN)]])),
    ], childInjector1);

    // Assert root injector.
    {
      const actualContext = injectMenuContext({injector: TestBed.inject(Injector)});
      expect(actualContext()).toEqual(new Map([['tokenLevel1', 'Level 1'], ['token', 'Level 1']]));
    }
    // Assert child injector 1.
    {
      const actualContext = injectMenuContext({injector: childInjector1});
      expect(actualContext()).toEqual(new Map([['tokenLevel1', 'Level 1'], ['tokenLevel2', 'Level 2'], ['token', 'Level 2']]));
    }
    // Assert child injector 2.
    {
      const actualContext = injectMenuContext({injector: childInjector2});
      expect(actualContext()).toEqual(new Map([['tokenLevel1', 'Level 1'], ['tokenLevel2', 'Level 2'], ['tokenLevel3', 'Level 3'], ['token', 'Level 3']]));
    }
  });

  it('should pass calling injector to provider function', async () => {
    const TOKEN = new InjectionToken<string>('TOKEN');

    // Root injector
    TestBed.configureTestingModule({
      providers: [
        {provide: TOKEN, useValue: 'Level 1'},
        provideMenuContextProvider(injector => new Map([['tokenLevel1', injector.get(TOKEN)]])),
      ],
    });

    // Child injector 1
    const childInjector1 = createEnvironmentInjector([
      {provide: TOKEN, useValue: 'Level 2'},
      provideMenuContextProvider(injector => new Map([['tokenLevel2', injector.get(TOKEN)]])),
    ], TestBed.inject(EnvironmentInjector));

    // Child injector 2
    const childInjector2 = createEnvironmentInjector([
      {provide: TOKEN, useValue: 'Level 3'},
      provideMenuContextProvider(injector => new Map([['tokenLevel3', injector.get(TOKEN)]])),
    ], childInjector1);

    // Assert root injector.
    {
      const actualContext = injectMenuContext({injector: TestBed.inject(Injector)});
      expect(actualContext()).toEqual(new Map([['tokenLevel1', 'Level 1']]));
    }
    // Assert child injector 1.
    {
      const actualContext = injectMenuContext({injector: childInjector1});
      expect(actualContext()).toEqual(new Map([['tokenLevel1', 'Level 2'], ['tokenLevel2', 'Level 2']]));
    }
    // Assert child injector 2.
    {
      const actualContext = injectMenuContext({injector: childInjector2});
      expect(actualContext()).toEqual(new Map([['tokenLevel1', 'Level 3'], ['tokenLevel2', 'Level 3'], ['tokenLevel3', 'Level 3']]));
    }
  });
});

describe('injectMenuInjectionContextProviders', () => {

  it('should inject if no providers', async () => {
    const providers = injectMenuInjectionContextProviders(new Map(), {injector: TestBed.inject(Injector)});
    expect(providers).toEqual([]);
  });

  it('should inject menu injection context for current injection context', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuInjectionContextProvider(context => [
          {provide: CONTEXT_TOKEN, useValue: new Map([...context])},
        ]),
      ],
    });

    const CONTEXT_TOKEN = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN');

    const providers = runInInjectionContext(TestBed.inject(Injector), () => injectMenuInjectionContextProviders(new Map([['key', 'value']])));
    const injector = Injector.create({providers});
    expect(injector.get(CONTEXT_TOKEN)).toEqual(new Map([['key', 'value']]));
  });

  it('should inject menu injection context for passed injection context', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuInjectionContextProvider(context => [
          {provide: CONTEXT_TOKEN, useValue: new Map([...context])},
        ]),
      ],
    });

    const CONTEXT_TOKEN = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN');

    const providers = injectMenuInjectionContextProviders(new Map([['key', 'value']]), {injector: TestBed.inject(Injector)});
    const injector = Injector.create({providers});
    expect(injector.get(CONTEXT_TOKEN)).toEqual(new Map([['key', 'value']]));
  });

  it('should pass context to provider function', async () => {
    const providerFn = jasmine.createSpy<SciMenuInjectionContextProviderFn>('SciMenuEnvironmentInjectionContextProviderFn');
    TestBed.configureTestingModule({
      providers: [
        provideMenuInjectionContextProvider(providerFn),
      ],
    });

    injectMenuInjectionContextProviders(new Map([['a', 'A'], ['b', 'B']]), {injector: TestBed.inject(Injector)});
    expect(providerFn).toHaveBeenCalledOnceWith(new Map([['a', 'A'], ['b', 'B']]));
  });

  it('should inject menu injection context', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuInjectionContextProvider(context => [
          {provide: CONTEXT_TOKEN, useValue: new Map([...context, ['provider', 'provider']])},
        ]),
      ],
    });

    const CONTEXT_TOKEN = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN');

    // Get injection context for given context.
    const providers = injectMenuInjectionContextProviders(new Map([['key', 'value']]), {injector: TestBed.inject(Injector)});

    const injector = Injector.create({providers});
    expect(injector.get(CONTEXT_TOKEN)).toEqual(new Map([['key', 'value'], ['provider', 'provider']]));
  });

  it('should inject menu injection context from multiple providers', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuInjectionContextProvider(context => [
          {provide: CONTEXT_TOKEN_1, useValue: new Map([...context, ['provider', '1']])},
          {provide: CONTEXT_TOKEN_2, useValue: new Map([...context, ['provider', '1']])},
        ]),
        provideMenuInjectionContextProvider(context => [
          {provide: CONTEXT_TOKEN_2, useValue: new Map([...context, ['provider', '2']])},
          {provide: CONTEXT_TOKEN_3, useValue: new Map([...context, ['provider', '2']])},
        ]),
      ],
    });

    const CONTEXT_TOKEN_1 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_1');
    const CONTEXT_TOKEN_2 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_2');
    const CONTEXT_TOKEN_3 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_3');

    // Get injection context for given context.
    const providers = injectMenuInjectionContextProviders(new Map([['key', 'value']]), {injector: TestBed.inject(Injector)});

    const injector = Injector.create({providers});
    expect(injector.get(CONTEXT_TOKEN_1)).toEqual(new Map([['key', 'value'], ['provider', '1']]));
    expect(injector.get(CONTEXT_TOKEN_2)).toEqual(new Map([['key', 'value'], ['provider', '2']]));
    expect(injector.get(CONTEXT_TOKEN_3)).toEqual(new Map([['key', 'value'], ['provider', '2']]));
  });

  it('should inject menu injection context from multiple providers registered at different injector tree levels', async () => {
    // Root injector
    TestBed.configureTestingModule({
      providers: [
        provideMenuInjectionContextProvider(context => [
          {provide: CONTEXT_TOKEN_1, useValue: new Map([...context, ['provider', 'Provider 1 / Level 1']])},
          {provide: CONTEXT_TOKEN_2, useValue: new Map([...context, ['provider', 'Provider 1 / Level 1']])},
        ]),
        provideMenuInjectionContextProvider(context => [
          {provide: CONTEXT_TOKEN_2, useValue: new Map([...context, ['provider', 'Provider 2 / Level 1']])},
          {provide: CONTEXT_TOKEN_3, useValue: new Map([...context, ['provider', 'Provider 2 / Level 1']])},
          {provide: CONTEXT_TOKEN_4, useValue: new Map([...context, ['provider', 'Provider 2 / Level 1']])},
        ]),
      ],
    });

    // Child injector 1
    const childInjector1 = createEnvironmentInjector([
      provideMenuInjectionContextProvider(context => [
        {provide: CONTEXT_TOKEN_4, useValue: new Map([...context, ['provider', 'Provider 1 / Level 2']])},
        {provide: CONTEXT_TOKEN_5, useValue: new Map([...context, ['provider', 'Provider 1 / Level 2']])},
      ]),
      provideMenuInjectionContextProvider(context => [
        {provide: CONTEXT_TOKEN_5, useValue: new Map([...context, ['provider', 'Provider 2 / Level 2']])},
        {provide: CONTEXT_TOKEN_6, useValue: new Map([...context, ['provider', 'Provider 2 / Level 2']])},
      ]),
    ], TestBed.inject(EnvironmentInjector));

    // Child injector 2
    const childInjector2 = createEnvironmentInjector([], childInjector1); // empty injector

    // Child injector 3
    const childInjector3 = createEnvironmentInjector([
      provideMenuInjectionContextProvider(context => [
        {provide: CONTEXT_TOKEN_6, useValue: new Map([...context, ['provider', 'Provider 1 / Level 3']])},
        {provide: CONTEXT_TOKEN_7, useValue: new Map([...context, ['provider', 'Provider 1 / Level 3']])},
      ]),
      provideMenuInjectionContextProvider(context => [
        {provide: CONTEXT_TOKEN_7, useValue: new Map([...context, ['provider', 'Provider 2 / Level 3']])},
        {provide: CONTEXT_TOKEN_8, useValue: new Map([...context, ['provider', 'Provider 2 / Level 3']])},
      ]),
    ], childInjector2);

    const CONTEXT_TOKEN_1 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_1');
    const CONTEXT_TOKEN_2 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_2');
    const CONTEXT_TOKEN_3 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_3');
    const CONTEXT_TOKEN_4 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_4');
    const CONTEXT_TOKEN_5 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_5');
    const CONTEXT_TOKEN_6 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_6');
    const CONTEXT_TOKEN_7 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_7');
    const CONTEXT_TOKEN_8 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_8');

    // Assert root injector.
    {
      const actualProviders = injectMenuInjectionContextProviders(new Map([['key', 'value']]), {injector: TestBed.inject(Injector)});
      const actualInjector = Injector.create({providers: actualProviders});
      expect(actualProviders.length).toBe(5);
      expect(actualInjector.get(CONTEXT_TOKEN_1)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 1 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_2)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_3)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_4)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_5, null, {optional: true})).toBeNull();
      expect(actualInjector.get(CONTEXT_TOKEN_6, null, {optional: true})).toBeNull();
      expect(actualInjector.get(CONTEXT_TOKEN_7, null, {optional: true})).toBeNull();
      expect(actualInjector.get(CONTEXT_TOKEN_8, null, {optional: true})).toBeNull();
    }

    // Assert child injector 1.
    {
      const actualProviders = injectMenuInjectionContextProviders(new Map([['key', 'value']]), {injector: childInjector1});
      const actualInjector = Injector.create({providers: actualProviders});
      expect(actualProviders.length).toBe(9);
      expect(actualInjector.get(CONTEXT_TOKEN_1)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 1 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_2)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_3)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_4)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 1 / Level 2']]));
      expect(actualInjector.get(CONTEXT_TOKEN_5)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 2']]));
      expect(actualInjector.get(CONTEXT_TOKEN_6)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 2']]));
      expect(actualInjector.get(CONTEXT_TOKEN_7, null, {optional: true})).toBeNull();
      expect(actualInjector.get(CONTEXT_TOKEN_8, null, {optional: true})).toBeNull();
    }

    // Assert child injector 2.
    {
      const actualProviders = injectMenuInjectionContextProviders(new Map([['key', 'value']]), {injector: childInjector2});
      const actualInjector = Injector.create({providers: actualProviders});
      expect(actualProviders.length).toBe(9);
      expect(actualInjector.get(CONTEXT_TOKEN_1)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 1 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_2)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_3)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_4)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 1 / Level 2']]));
      expect(actualInjector.get(CONTEXT_TOKEN_5)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 2']]));
      expect(actualInjector.get(CONTEXT_TOKEN_6)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 2']]));
      expect(actualInjector.get(CONTEXT_TOKEN_7, null, {optional: true})).toBeNull();
      expect(actualInjector.get(CONTEXT_TOKEN_8, null, {optional: true})).toBeNull();
    }

    // Assert child injector 3.
    {
      const actualProviders = injectMenuInjectionContextProviders(new Map([['key', 'value']]), {injector: childInjector3});
      const actualInjector = Injector.create({providers: actualProviders});
      expect(actualProviders.length).toBe(13);
      expect(actualInjector.get(CONTEXT_TOKEN_1)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 1 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_2)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_3)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_4)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 1 / Level 2']]));
      expect(actualInjector.get(CONTEXT_TOKEN_5)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 2']]));
      expect(actualInjector.get(CONTEXT_TOKEN_6)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 1 / Level 3']]));
      expect(actualInjector.get(CONTEXT_TOKEN_7)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 3']]));
      expect(actualInjector.get(CONTEXT_TOKEN_8)).toEqual(new Map([['key', 'value'], ['provider', 'Provider 2 / Level 3']]));
    }
  });

  it('should call provider function in injector which provides it', async () => {
    const TOKEN = new InjectionToken<string>('TOKEN');

    // Root injector
    TestBed.configureTestingModule({
      providers: [
        {provide: TOKEN, useValue: 'Level 1'},
        provideMenuInjectionContextProvider(() => [
          {provide: CONTEXT_TOKEN_1, useValue: new Map([['tokenLevel1', inject(TOKEN)], ['token', inject(TOKEN)]])},
        ]),
      ],
    });

    // Child injector 1
    const childInjector1 = createEnvironmentInjector([
      {provide: TOKEN, useValue: 'Level 2'},
      provideMenuInjectionContextProvider(() => [
        {provide: CONTEXT_TOKEN_2, useValue: new Map([['tokenLevel2', inject(TOKEN)], ['token', inject(TOKEN)]])},
      ]),
    ], TestBed.inject(EnvironmentInjector));

    // Child injector 2
    const childInjector2 = createEnvironmentInjector([
      {provide: TOKEN, useValue: 'Level 3'},
      provideMenuInjectionContextProvider(() => [
        {provide: CONTEXT_TOKEN_3, useValue: new Map([['tokenLevel3', inject(TOKEN)], ['token', inject(TOKEN)]])},
      ]),
    ], childInjector1);

    const CONTEXT_TOKEN_1 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_1');
    const CONTEXT_TOKEN_2 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_1');
    const CONTEXT_TOKEN_3 = new InjectionToken<Map<string, unknown>>('CONTEXT_TOKEN_1');

    // Assert root injector.
    {
      const actualProviders = injectMenuInjectionContextProviders(new Map(), {injector: TestBed.inject(Injector)});
      const actualInjector = Injector.create({providers: actualProviders});
      expect(actualInjector.get(CONTEXT_TOKEN_1)).toEqual(new Map([['tokenLevel1', 'Level 1'], ['token', 'Level 1']]));
    }
    // Assert child injector 1.
    {
      const actualProviders = injectMenuInjectionContextProviders(new Map(), {injector: childInjector1});
      const actualInjector = Injector.create({providers: actualProviders});
      expect(actualInjector.get(CONTEXT_TOKEN_1)).toEqual(new Map([['tokenLevel1', 'Level 1'], ['token', 'Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_2)).toEqual(new Map([['tokenLevel2', 'Level 2'], ['token', 'Level 2']]));
    }
    // Assert child injector 2.
    {
      const actualProviders = injectMenuInjectionContextProviders(new Map(), {injector: childInjector2});
      const actualInjector = Injector.create({providers: actualProviders});
      expect(actualInjector.get(CONTEXT_TOKEN_1)).toEqual(new Map([['tokenLevel1', 'Level 1'], ['token', 'Level 1']]));
      expect(actualInjector.get(CONTEXT_TOKEN_2)).toEqual(new Map([['tokenLevel2', 'Level 2'], ['token', 'Level 2']]));
      expect(actualInjector.get(CONTEXT_TOKEN_3)).toEqual(new Map([['tokenLevel3', 'Level 3'], ['token', 'Level 3']]));
    }
  });
});

describe('injectMenuAcceleratorTargets', () => {

  it('should inject if no providers', async () => {
    const providers = injectMenuAcceleratorTargets({injector: TestBed.inject(Injector)});
    expect(providers()).toEqual([]);
  });

  it('should inject accelerator targets for current injection context', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuAcceleratorTargetProvider(() => element),
      ],
    });

    const element = Symbol('ELEMENT') as unknown as Element;

    const targets = runInInjectionContext(TestBed.inject(Injector), () => injectMenuAcceleratorTargets());
    expect(targets()).toEqual([element]);
  });

  it('should inject accelerator targets for passed injection context', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideMenuAcceleratorTargetProvider(() => element),
      ],
    });

    const element = Symbol('ELEMENT') as unknown as Element;

    const targets = injectMenuAcceleratorTargets({injector: TestBed.inject(Injector)});
    expect(targets()).toEqual([element]);
  });

  it('should inject accelerator targets', async () => {
    TestBed.configureTestingModule({
      providers: [
        // Provides target as `Element`.
        provideMenuAcceleratorTargetProvider(() => element1),
        // Provides target as `ElementRef`.
        provideMenuAcceleratorTargetProvider(() => elementRef1),
        // Provides target as `Signal<Element>`.
        provideMenuAcceleratorTargetProvider(() => signal(element2)),
        // Provides target as `Signal<ElementRef>`.
        provideMenuAcceleratorTargetProvider(() => signal(elementRef2)),
        // Provides targets as `Array<Element | ElementRef<Element>>`.
        provideMenuAcceleratorTargetProvider(() => [element3, elementRef3]),
        // Provides targets as `Signal<Array<Element | ElementRef<Element>>>`.
        provideMenuAcceleratorTargetProvider(() => signal([element4, elementRef4])),
        // Provides target as `undefined`.
        provideMenuAcceleratorTargetProvider(() => undefined),
        // Provides target as `Signal<undefined>`.
        provideMenuAcceleratorTargetProvider(() => signal(undefined)),
      ],
    });

    const element1 = Symbol('ELEMENT_1') as unknown as Element;
    const element2 = Symbol('ELEMENT_2') as unknown as Element;
    const element3 = Symbol('ELEMENT_3') as unknown as Element;
    const element4 = Symbol('ELEMENT_4') as unknown as Element;
    const elementRef1 = new ElementRef(Symbol('ELEMENT_REF_1') as unknown as Element);
    const elementRef2 = new ElementRef(Symbol('ELEMENT_REF_2') as unknown as Element);
    const elementRef3 = new ElementRef(Symbol('ELEMENT_REF_3') as unknown as Element);
    const elementRef4 = new ElementRef(Symbol('ELEMENT_REF_4') as unknown as Element);

    const targets = injectMenuAcceleratorTargets({injector: TestBed.inject(Injector)});
    expect(targets()).toEqual(jasmine.arrayWithExactContents([
      element1, element2, element3, element4, elementRef1.nativeElement, elementRef2.nativeElement, elementRef3.nativeElement, elementRef4.nativeElement,
    ]));
  });

  it('should inject accelerator targets as signal from multiple providers', async () => {
    TestBed.configureTestingModule({
      providers: [
        // Non-Signal provider
        provideMenuAcceleratorTargetProvider(() => element1),
        // Signal provider
        provideMenuAcceleratorTargetProvider(() => element2),
      ],
    });

    const element1 = Symbol('ELEMENT_1') as unknown as Element;
    const element2 = signal<Element | undefined>(undefined);

    const targets = injectMenuAcceleratorTargets({injector: TestBed.inject(Injector)});
    expect(targets()).toEqual(jasmine.arrayWithExactContents([element1]));

    // Change target in provider 2.
    const element2a = Symbol('ELEMENT_2a') as unknown as Element;
    element2.set(element2a);
    expect(targets()).toEqual(jasmine.arrayWithExactContents([element1, element2a]));

    // Change target in provider 2.
    const element2b = Symbol('ELEMENT_2b') as unknown as Element;
    element2.set(element2b);
    expect(targets()).toEqual(jasmine.arrayWithExactContents([element1, element2b]));
  });

  it('should inject accelerator targets from multiple providers registered at different injector tree levels', async () => {
    // Root injector
    TestBed.configureTestingModule({
      providers: [
        provideMenuAcceleratorTargetProvider(() => element1),
      ],
    });

    // Child injector 1
    const childInjector1 = createEnvironmentInjector([
      provideMenuAcceleratorTargetProvider(() => element2),
      provideMenuAcceleratorTargetProvider(() => [element3, element4]),
    ], TestBed.inject(EnvironmentInjector));

    // Child injector 2
    const childInjector2 = createEnvironmentInjector([], childInjector1); // empty injector

    // Child injector 3
    const childInjector3 = createEnvironmentInjector([
      provideMenuAcceleratorTargetProvider(() => element5),
    ], childInjector2);

    const element1 = Symbol('ELEMENT_1') as unknown as Element;
    const element2 = Symbol('ELEMENT_2') as unknown as Element;
    const element3 = Symbol('ELEMENT_3') as unknown as Element;
    const element4 = Symbol('ELEMENT_4') as unknown as Element;
    const element5 = Symbol('ELEMENT_5') as unknown as Element;

    // Assert root injector.
    {
      const targets = injectMenuAcceleratorTargets({injector: TestBed.inject(Injector)});
      expect(targets()).toEqual([element1]);
    }
    // Assert child injector 1.
    {
      const targets = injectMenuAcceleratorTargets({injector: childInjector1});
      expect(targets()).toEqual(jasmine.arrayWithExactContents([
        element1, element2, element3, element4,
      ]));
    }
    // Assert child injector 2.
    {
      const targets = injectMenuAcceleratorTargets({injector: childInjector2});
      expect(targets()).toEqual(jasmine.arrayWithExactContents([
        element1, element2, element3, element4,
      ]));
    }
    // Assert child injector 3.
    {
      const targets = injectMenuAcceleratorTargets({injector: childInjector3});
      expect(targets()).toEqual(jasmine.arrayWithExactContents([
        element1, element2, element3, element4, element5,
      ]));
    }
  });

  it('should call provider function in injector which provides it', async () => {
    const ELEMENT = new InjectionToken<Element>('ELEMENT');

    const elementLevel1 = Symbol('ELEMENT_LEVEL_1') as unknown as Element;
    const elementLevel2 = Symbol('ELEMENT_LEVEL_2') as unknown as Element;
    const elementLevel3 = Symbol('ELEMENT_LEVEL_3') as unknown as Element;

    // Root injector
    TestBed.configureTestingModule({
      providers: [
        {provide: ELEMENT, useValue: elementLevel1},
        provideMenuAcceleratorTargetProvider(() => inject(ELEMENT)),
      ],
    });

    // Child injector 1
    const childInjector1 = createEnvironmentInjector([
      {provide: ELEMENT, useValue: elementLevel2},
      provideMenuAcceleratorTargetProvider(() => inject(ELEMENT)),
    ], TestBed.inject(EnvironmentInjector));

    // Child injector 2
    const childInjector2 = createEnvironmentInjector([
      {provide: ELEMENT, useValue: elementLevel3},
      provideMenuAcceleratorTargetProvider(() => inject(ELEMENT)),
    ], childInjector1);

    // Assert root injector.
    {
      const targets = injectMenuAcceleratorTargets({injector: TestBed.inject(Injector)});
      expect(targets()).toEqual(jasmine.arrayWithExactContents([elementLevel1]));
    }
    // Assert child injector 1.
    {
      const targets = injectMenuAcceleratorTargets({injector: childInjector1});
      expect(targets()).toEqual(jasmine.arrayWithExactContents([elementLevel1, elementLevel2]));
    }
    // Assert child injector 2.
    {
      const targets = injectMenuAcceleratorTargets({injector: childInjector2});
      expect(targets()).toEqual(jasmine.arrayWithExactContents([elementLevel1, elementLevel2, elementLevel3]));
    }
  });

  it('should pass calling injector to provider function', async () => {
    const ELEMENT = new InjectionToken<Element>('ELEMENT');

    const elementLevel1 = Symbol('ELEMENT_LEVEL_1') as unknown as Element;
    const elementLevel2 = Symbol('ELEMENT_LEVEL_2') as unknown as Element;
    const elementLevel3 = Symbol('ELEMENT_LEVEL_3') as unknown as Element;

    // Root injector
    TestBed.configureTestingModule({
      providers: [
        {provide: ELEMENT, useValue: elementLevel1},
        provideMenuAcceleratorTargetProvider(injector => injector.get(ELEMENT)),
      ],
    });

    // Child injector 1
    const childInjector1 = createEnvironmentInjector([
      {provide: ELEMENT, useValue: elementLevel2},
      provideMenuAcceleratorTargetProvider(injector => injector.get(ELEMENT)),
    ], TestBed.inject(EnvironmentInjector));

    // Child injector 2
    const childInjector2 = createEnvironmentInjector([
      {provide: ELEMENT, useValue: elementLevel3},
      provideMenuAcceleratorTargetProvider(injector => injector.get(ELEMENT)),
    ], childInjector1);

    // Assert root injector.
    {
      const targets = injectMenuAcceleratorTargets({injector: TestBed.inject(Injector)});
      expect(targets()).toEqual(jasmine.arrayWithExactContents([elementLevel1]));
    }
    // Assert child injector 1.
    {
      const targets = injectMenuAcceleratorTargets({injector: childInjector1});
      expect(targets()).toEqual(jasmine.arrayWithExactContents([elementLevel2, elementLevel2]));
    }
    // Assert child injector 2.
    {
      const targets = injectMenuAcceleratorTargets({injector: childInjector2});
      expect(targets()).toEqual(jasmine.arrayWithExactContents([elementLevel3, elementLevel3, elementLevel3]));
    }
  });
});
