/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, effect, ElementRef, inject, input} from '@angular/core';
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
  host: {
    '[class.animate]': 'shouldAnimate()',
    '[animate.leave]': '"leave"',
    '[animate.enter]': '"enter"',
  },
})
export class SashComponent {

  /**
   * Specifies the sash representing this component.
   */
  public readonly sash = input.required<SciSashDirective>();

  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly _sashBoxAccessor = inject(SciSashBoxAccessor);

  protected readonly shouldAnimate = computed(() => this.sash().animate() && this.sash().isFixedSize() && this._sashBoxAccessor.afterFirstRender());

  constructor() {
    // Associate sash with this component.
    effect(() => this.sash().setComponent(this));
  }

  /**
   * Gets the size of this sash in pixel.
   */
  public get size(): number {
    const {width, height} = this._host.getBoundingClientRect();
    return this._sashBoxAccessor.direction() === 'row' ? width : height;
  }
}
