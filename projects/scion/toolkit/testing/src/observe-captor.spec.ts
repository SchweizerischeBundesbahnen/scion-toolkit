/*
 * Copyright (C) Schweizerische Bundesbahnen SBB, 2020.
 */

import {Subject} from 'rxjs';
import {ObserveCaptor} from './observe-captor';

describe('ObserveCaptor', () => {

  it('should capture emissions', () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    subject$.next('value 1');
    subject$.next('value 2');
    subject$.next('value 3');

    expect(captor.getValues()).toEqual(['value 1', 'value 2', 'value 3']);
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.hasCompleted()).toBeFalse();
  });

  it('should capture the last emission', () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    subject$.next('value 1');
    subject$.next('value 2');
    subject$.next('value 3');

    expect(captor.getLastValue()).toEqual('value 3');
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.hasCompleted()).toBeFalse();
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
    expect(captor.hasErrored()).toBeTrue();
    expect(captor.hasCompleted()).toBeFalse();
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
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.hasCompleted()).toBeTrue();
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
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.hasCompleted()).toBeFalse();
  });

  it('should time out if not emitted expected emissions [actual: 0, expected: 3]', async () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    await expectAsync(captor.waitUntilEmitCount(3, 500)).toBeRejectedWithError(/\[CaptorTimeoutError/);
  });

  it('should time out if not emitted expected emissions [actual: 2, expected: 3]', async () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    subject$.next('value 1');
    const waitUntilEmitCount = captor.waitUntilEmitCount(3, 500);
    subject$.next('value 2');
    await expectAsync(waitUntilEmitCount).toBeRejectedWithError(/\[CaptorTimeoutError/);
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
    expect(captor.hasErrored()).toBeFalse();
    expect(captor.hasCompleted()).toBeTrue();
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

  it('should allow to reset captured values', async () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    subject$.next('value 1');
    subject$.next('value 2');
    subject$.next('value 3');
    captor.reset({resetValues: true, resetEmitCount: false});
    subject$.next('value 4');
    subject$.next('value 5');
    subject$.next('value 6');

    await expectAsync(captor.waitUntilEmitCount(6, 50)).toBeResolved();
    expect(captor.getValues()).toEqual(['value 4', 'value 5', 'value 6']);
  });

  it('should allow to reset the captor\'s emit count', async () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    subject$.next('value 1');
    subject$.next('value 2');
    subject$.next('value 3');
    captor.reset({resetValues: false, resetEmitCount: true});
    subject$.next('value 4');
    subject$.next('value 5');
    subject$.next('value 6');

    await expectAsync(captor.waitUntilEmitCount(3, 50)).toBeResolved();
    await expectAsync(captor.waitUntilEmitCount(6, 50)).toBeRejected();
    expect(captor.getValues()).toEqual(['value 1', 'value 2', 'value 3', 'value 4', 'value 5', 'value 6']);
  });

  it('should reset all aspects of the captor if not passing reset options', async () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);

    subject$.next('value 1');
    subject$.next('value 2');
    subject$.next('value 3');
    captor.reset();
    subject$.next('value 4');
    subject$.next('value 5');
    subject$.next('value 6');

    await expectAsync(captor.waitUntilEmitCount(3, 50)).toBeResolved();
    await expectAsync(captor.waitUntilEmitCount(6, 50)).toBeRejected();
    expect(captor.getValues()).toEqual(['value 4', 'value 5', 'value 6']);
  });

  it('should error when waiting for a specific emit count and the captor is reset in the meantime', async () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);
    const untilEmitCountPromise = captor.waitUntilEmitCount(3);
    captor.reset();

    await expectAsync(untilEmitCountPromise).toBeRejectedWith(jasmine.stringMatching(/CaptorError/));
  });

  it('should error when waiting for a specific emit count but the timeout elapses', async () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);
    const untilEmitCountPromise = captor.waitUntilEmitCount(3, 10);
    await expectAsync(untilEmitCountPromise).toBeRejectedWith(jasmine.stringMatching(/CaptorTimeoutError/));
  });

  it('should indicate that an Observable errored', () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);
    subject$.error(Error('error'));
    expect(captor.hasErrored()).toBeTrue();
    expect(captor.getError()).toEqual(Error('error'));
  });

  it('should indicate that an Observable errored (`undefined` error)', () => {
    const subject$ = new Subject<string>();

    const captor = new ObserveCaptor<string>();
    subject$.subscribe(captor);
    subject$.error(undefined);
    expect(captor.hasErrored()).toBeTrue();
    expect(captor.getError()).toBeUndefined();
  });
});
