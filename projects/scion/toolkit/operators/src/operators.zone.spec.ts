/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Observable} from 'rxjs';
import {TestBed} from '@angular/core/testing';
import {finalize, tap} from 'rxjs/operators';
import {observeIn, subscribeIn} from './operators';
import {NgZone} from '@angular/core';

describe('Operators', () => {

  describe('subscribeIn and observeIn', () => {

    it('should subscribe outside the Angular zone, but observe inside of the Angular zone ', () => {
      TestBed.configureTestingModule({});
      const zone = TestBed.inject(NgZone);

      // GIVEN
      interface InsideNgZoneCaptor {
        onConstruct?: boolean;
        onTeardown?: boolean;
        onNextBeforeSubscribeIn?: boolean;
        onNextAfterSubscribeIn?: boolean;
        onNextAfterObserveIn?: boolean;
        onNext?: boolean;
        onComplete?: boolean;
        onFinalize?: boolean;
      }

      const insideAngularCaptor: InsideNgZoneCaptor = {};

      const observable$ = new Observable<void>(observer => {
        insideAngularCaptor.onConstruct = NgZone.isInAngularZone();
        observer.next();
        observer.complete();
        return () => insideAngularCaptor.onTeardown = NgZone.isInAngularZone();
      })
        .pipe(
          tap(() => insideAngularCaptor.onNextBeforeSubscribeIn = NgZone.isInAngularZone()),
          subscribeIn(continueFn => zone.runOutsideAngular(continueFn)),
          tap(() => insideAngularCaptor.onNextAfterSubscribeIn = NgZone.isInAngularZone()),
          observeIn(continueFn => zone.run(continueFn)),
          tap(() => insideAngularCaptor.onNextAfterObserveIn = NgZone.isInAngularZone()),
          finalize(() => insideAngularCaptor.onFinalize = NgZone.isInAngularZone()),
        );

      // WHEN
      zone.run(() => {
        const subscription = observable$.subscribe({
          next: () => insideAngularCaptor.onNext = NgZone.isInAngularZone(),
          complete: () => insideAngularCaptor.onComplete = NgZone.isInAngularZone(),
        });

        // THEN
        expect(NgZone.isInAngularZone()).toBeTrue();
        expect(insideAngularCaptor.onConstruct).toBeFalse();
        expect(insideAngularCaptor.onNextBeforeSubscribeIn).toBeFalse();
        expect(insideAngularCaptor.onNextAfterSubscribeIn).toBeFalse();
        expect(insideAngularCaptor.onNextAfterObserveIn).toBeTrue();
        expect(insideAngularCaptor.onNext).toBeTrue();
        expect(insideAngularCaptor.onComplete).toBeTrue();

        subscription.unsubscribe();

        expect(insideAngularCaptor.onTeardown).toBeFalse();
        expect(insideAngularCaptor.onFinalize).toBeTrue();
      });
    });
  });
});
