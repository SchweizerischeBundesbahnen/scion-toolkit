/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, ElementRef, inject, input, NgZone, output} from '@angular/core';
import {fromResize$} from '@scion/toolkit/observable';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {observeIn, subscribeIn} from '@scion/toolkit/operators';
import {SciDimension} from './dimension';

/**
 * Observes the size of the host element.
 *
 * ---
 * Usage:
 *
 * ```html
 * <div sciDimension (sciDimensionChange)="onDimensionChange($event)"></div>
 * ```
 */
@Directive({
  selector: '[sciDimension]',
  standalone: true,
})
export class SciDimensionDirective {

  /**
   * Controls if to output outside the Angular zone. Defaults to `false`.
   */
  public emitOutsideAngular = input(false);

  /**
   * Outputs the size of the element.
   */
  public dimensionChange = output<SciDimension>({alias: 'sciDimensionChange'});

  constructor() {
    const host = inject(ElementRef<HTMLElement>).nativeElement;
    const zone = inject(NgZone);

    fromResize$(host)
      .pipe(
        // Avoid triggering change detection cycle.
        subscribeIn(fn => zone.runOutsideAngular(fn)),
        // Run in animation frame to prevent 'ResizeObserver loop completed with undelivered notifications' error.
        // Do not use `animationFrameScheduler` because the scheduler does not necessarily execute in the current execution context, such as inside or outside Angular.
        // The scheduler always executes tasks in the context (e.g. zone) where the scheduler was first used in the application.
        observeIn(fn => requestAnimationFrame(fn)),
        observeIn(fn => this.emitOutsideAngular() ? fn() : zone.run(fn)),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        // Assert Angular zone.
        this.emitOutsideAngular() ? NgZone.assertNotInAngularZone() : NgZone.assertInAngularZone();

        this.dimensionChange.emit({
          clientWidth: host.clientWidth,
          offsetWidth: host.offsetWidth,
          clientHeight: host.clientHeight,
          offsetHeight: host.offsetHeight,
          element: host,
        });
      });
  }
}
