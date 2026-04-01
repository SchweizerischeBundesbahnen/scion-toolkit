/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, effect, ElementRef, inject, input, Signal, signal} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {SciSashBoxAccessor} from '../sashbox-accessor';
import {SciSashDirective} from '../sash.directive';

/**
 * Represents a {@link SciSashDirective} in the DOM, displaying the specified sash template.
 */
@Component({
  selector: 'sci-sash',
  templateUrl: './sash.component.html',
  styleUrls: ['./sash.component.scss'],
  imports: [
    NgTemplateOutlet,
  ],
  // Required for backward compatibility for zone-based applications to support child components with eager change detection.
  changeDetection: ChangeDetectionStrategy.Eager, // eslint-disable-line @angular-eslint/prefer-on-push-component-change-detection
  host: {
    '[class.animate]': 'shouldAnimate()',
    '[class.leave]': 'leave()',
    'animate.enter': 'enter',
  },
})
export class SashComponent {

  /**
   * Specifies the sash representing this component.
   */
  public readonly sash = input.required<SciSashDirective>();

  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _sashBoxAccessor = inject(SciSashBoxAccessor);

  protected readonly leave = signal(false);
  protected readonly leaveAnimationDone = signal(false);
  protected readonly shouldAnimate = computed(() => this.sash().animate() && this.sash().isFixedSize() && this._sashBoxAccessor.afterFirstRender());

  constructor() {
    // Associate sash with this component.
    effect(() => this.sash().setComponent(this));

    effect(() => {
      if (!this.leave()) {
        return;
      }

      // Wait an animationFrame for the animation to start.
      // Else there are no animations on the _host and the Promise resolves immediately.
      requestAnimationFrame(() => {
        void Promise.all(this._host.getAnimations().map(animation => animation.finished))
          .then(() => {
            this.leaveAnimationDone.set(true);
          });
      });
    });
  }

  /**
   * Starts the leave animation, returning a signal to track animation completion.
   */
  public startLeaveAnimation(): Signal<void> {
    // Detach change detector to prevent updates to the component during the animation.
    this._cd.detach();

    // Trigger 'leave' animation.
    this.leave.set(true);

    // Return signal to track animation completion.
    return this.leaveAnimationDone;
  }

  /**
   * Gets the size of this sash in pixel.
   */
  public get size(): number {
    const {width, height} = this._host.getBoundingClientRect();
    return this._sashBoxAccessor.direction() === 'row' ? width : height;
  }
}
