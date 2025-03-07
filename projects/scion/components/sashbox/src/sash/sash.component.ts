/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectorRef, Component, computed, effect, ElementRef, inject, input, linkedSignal, Signal} from '@angular/core';
import {NgTemplateOutlet} from '@angular/common';
import {animate, AnimationMetadata, style, transition, trigger} from '@angular/animations';
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
  animations: [
    trigger('sash-animation', provideAnimation()),
  ],
  host: {
    '[@sash-animation]': 'animationState()',
    '(@sash-animation.done)': 'onAnimationEnd();',
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

  protected readonly animationState = linkedSignal<'enter' | 'leave' | null>(() => this.sash().animate() && this._sashBoxAccessor.afterFirstRender() ? 'enter' : null);

  constructor() {
    // Associate sash with this component.
    effect(() => this.sash().setComponent(this));
  }

  /**
   * Starts the leave animation, returning a signal to track animation completion.
   */
  public startLeaveAnimation(): Signal<void> {
    // Detach change detector to prevent updates to the component during the animation.
    this._cd.detach();
    // Trigger 'leave' animation.
    this.animationState.set('leave');
    // Return signal to track animation completion.
    return computed(() => void this.animationState(), {equal: () => false});
  }

  /**
   * Notifies when ending the animation.
   */
  protected onAnimationEnd(): void {
    this.animationState.set(null);
  }

  /**
   * Gets the size of this sash in pixel.
   */
  public get size(): number {
    const {width, height} = this._host.getBoundingClientRect();
    return this._sashBoxAccessor.direction() === 'row' ? width : height;
  }
}

/**
 * Returns animation metadata to slide-in and slide-out a sash.
 */
function provideAnimation(): AnimationMetadata[] {
  return [
    transition('void => enter', [
      style({'flex-basis': 0}),
      animate(`125ms ease-out`, style({'flex-basis': '*'})),
    ]),
    transition('* => leave', [
      style({'flex-basis': '*'}),
      animate(`125ms ease-out`, style({'flex-basis': 0})),
    ]),
  ];
}
