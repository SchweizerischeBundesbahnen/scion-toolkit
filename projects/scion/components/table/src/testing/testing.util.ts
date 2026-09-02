/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {exhaustMap, firstValueFrom, pairwise, timer} from 'rxjs';
import {filter, map} from 'rxjs/operators';
import {Injector, inputBinding, runInInjectionContext} from '@angular/core';
import {ComponentFixture, TestBed} from '@angular/core/testing';
import {SciTable} from '../table.model';
import {ɵSciTable} from '../ɵtable.model';
import {SciTableComponent} from '../table.component';
import {Objects} from '@scion/toolkit/util';

// TODO [dani] Exclude from published NPM artefact, also PO's

/**
 * Creates {@link SciTableComponent}, configuring the table using the passed callback function.
 */
export function createSciTableComponent<T>(tableFn: () => SciTable<T>, options?: {name?: `table:${string}`; height?: string; width?: string; designTokens?: {[name: `--${string}`]: string}}): {model: ɵSciTable<T>; fixture: ComponentFixture<SciTableComponent<unknown>>} {
  const table = runInInjectionContext(TestBed.inject(Injector), tableFn);

  // Create fixture.
  const fixture = TestBed.createComponent(SciTableComponent, {
    bindings: [
      inputBinding('name', () => options?.name ?? 'table:testee'),
      inputBinding('table', () => table),
    ],
    inferTagName: true,
  });

  // Style fixture.
  const element = fixture.nativeElement as HTMLElement;
  element.style.height = options?.height ?? '500px';
  element.style.width = options?.width ?? '600px';
  element.style.border = '1px solid var(--sci-color-border)';
  element.style.boxSizing = 'content-box';

  // Set CSS variables.
  Objects.entries(options?.designTokens ?? {}).forEach(([key, value]) => element.style.setProperty(key, value));

  return {model: table as ɵSciTable<T>, fixture};
}

/**
 * Waits for a value to become stable.
 *
 * This function returns the value if it hasn't changed during `probeInterval` (defaults to 100ms).
 */
export async function waitUntilStable<A>(value: () => Promise<A> | A, options?: {isStable?: (previous: A, current: A) => boolean; probeInterval?: number}): Promise<A> {
  if (options?.probeInterval === 0) {
    return value();
  }

  const value$ = timer(0, options?.probeInterval ?? 50)
    .pipe(
      exhaustMap(async () => await value()),
      pairwise(),
      filter(([previous, current]) => options?.isStable ? options.isStable(previous, current) : previous === current),
      map(([previous]) => previous),
    );
  return firstValueFrom(value$);
}
