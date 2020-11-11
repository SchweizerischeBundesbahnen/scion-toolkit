/*
 * Copyright (C) Schweizerische Bundesbahnen SBB, 2020.
 */

import { Subject } from 'rxjs';
import { ObserveCaptor } from './observe-captor';

describe('ObserveCaptor', () => {

  it('should capture emissions', () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    subject$.next('value 1');
    subject$.next('value 2');
    subject$.next('value 3');

    expect(captor.getValues()).toEqual(['value 1', 'value 2', 'value 3']);
    expect(captor.hasErrored()).toBe(false);
    expect(captor.hasCompleted()).toBe(false);
  });

  it('should capture the last emission', () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    subject$.next('value 1');
    subject$.next('value 2');
    subject$.next('value 3');

    expect(captor.getLastValue()).toEqual('value 3');
    expect(captor.hasErrored()).toBe(false);
    expect(captor.hasCompleted()).toBe(false);
  });

  it('should capture an error', () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    const error = Error('error');
    subject$.next('value 1');
    subject$.next('value 2');
    subject$.error(error);

    expect(captor.getValues()).toEqual(['value 1', 'value 2']);
    expect(captor.getLastValue()).toEqual('value 2');
    expect(captor.getError()).toBe(error);
    expect(captor.hasErrored()).toBe(true);
    expect(captor.hasCompleted()).toBe(false);
  });

  it('should capture completion', () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    subject$.next('value 1');
    subject$.next('value 2');
    subject$.complete();

    expect(captor.getValues()).toEqual(['value 1', 'value 2']);
    expect(captor.getLastValue()).toEqual('value 2');
    expect(captor.hasErrored()).toBe(false);
    expect(captor.hasCompleted()).toBe(true);
  });

  it('should wait until a given number of emissions', async () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    setTimeout(() => {
      subject$.next('value 1');
      subject$.next('value 2');
      subject$.next('value 3');
      subject$.next('value 4');
      subject$.next('value 5');
      subject$.next('value 6');
    }, 50);

    await captor.waitUntilEmitCount(3);

    expect(captor.getValues()).toEqual(jasmine.arrayContaining(['value 1', 'value 2', 'value 3']));
    expect(captor.hasErrored()).toBe(false);
    expect(captor.hasCompleted()).toBe(false);
  });

  it('should wait until completion', async () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    setTimeout(() => {
      subject$.next('value 1');
      subject$.next('value 2');
      subject$.next('value 3');
      subject$.next('value 4');
      subject$.next('value 5');
      subject$.next('value 6');
      subject$.complete();
    }, 50);

    await captor.waitUntilCompletedOrErrored();

    expect(captor.getValues()).toEqual(['value 1', 'value 2', 'value 3', 'value 4', 'value 5', 'value 6']);
    expect(captor.hasErrored()).toBe(false);
    expect(captor.hasCompleted()).toBe(true);
  });

  it('should allow the projection of captured values', () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>(value => value.toUpperCase());
    subject$.subscribe(captor);

    subject$.next('value 1');
    subject$.next('value 2');
    subject$.next('value 3');

    expect(captor.getValues()).toEqual(['VALUE 1', 'VALUE 2', 'VALUE 3']);
  });

  it('should allow to reset captured values', () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    subject$.next('value 1');
    subject$.next('value 2');
    subject$.next('value 3');
    captor.resetValues();
    subject$.next('value 4');
    subject$.next('value 5');
    subject$.next('value 6');

    expect(captor.getValues()).toEqual(['value 4', 'value 5', 'value 6']);
  });
});
