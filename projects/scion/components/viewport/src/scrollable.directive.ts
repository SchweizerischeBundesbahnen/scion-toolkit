/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, effect, ElementRef, inject, input, Renderer2, untracked} from '@angular/core';
import {NativeScrollbarTrackSize, SciNativeScrollbarTrackSizeProvider} from './native-scrollbar-track-size-provider.service';
import {Dictionary} from '@scion/toolkit/util';

/**
 * Makes the host element natively scrollable and hides native scrollbars by default, unless native scrollbars
 * already sit on top of the viewport (e.g. in OS X).
 *
 * Because there is no cross-browser API to hide scrollbars without losing native scroll support, we set 'overflow'
 * to 'scroll' but shift the native scrollbars out of the visible viewport area. The shift offset is computed upfront.
 *
 * This directive expects its host element to be the only child in document flow in its parent DOM element. It makes the host element
 * fill up the entire space (width and height set to 100%). The parent element must have its CSS `overflow` property set to `hidden`
 * to hide the pushed out native scrollbars.
 */
@Directive({
  selector: '[sciScrollable]',
  standalone: true,
})
export class SciScrollableDirective {

  private _host = inject(ElementRef<HTMLDivElement>).nativeElement;
  private _renderer = inject(Renderer2);
  private _nativeScrollbarTrackSizeProvider = inject(SciNativeScrollbarTrackSizeProvider);

  /**
   * Controls whether to display native scrollbars.
   * Has no effect if the native scrollbar sits on top of the content, e.g. in OS X.
   */
  public displayNativeScrollbar = input(false, {alias: 'sciScrollableDisplayNativeScrollbar'});

  constructor() {
    this.controlDisplayOfNativeScrollbar();
  }

  /**
   * Controls the display of the native scrollbar based on this directive's configuration.
   */
  private controlDisplayOfNativeScrollbar(): void {
    effect(() => {
      const displayNativeScrollbar = this.displayNativeScrollbar();
      if (displayNativeScrollbar) {
        untracked(() => this.useNativeScrollbars());
        return;
      }

      const nativeScrollbarTrackSize = this._nativeScrollbarTrackSizeProvider.trackSize();
      if (nativeScrollbarTrackSize) {
        untracked(() => this.shiftNativeScrollbars(nativeScrollbarTrackSize));
      }
      else {
        untracked(() => this.useNativeScrollbars());
      }
    });
  }

  /**
   * Uses the native scrollbars when content overflows.
   */
  private useNativeScrollbars(): void {
    this.setStyle(this._host, {
      overflow: 'auto',
      width: '100%',
      height: '100%',
      marginRight: 0,
      marginBottom: 0,
    });
  }

  /**
   * Shifts the native scrollbars out of the visible viewport area.
   */
  private shiftNativeScrollbars(nativeScrollbarTrackSize: NativeScrollbarTrackSize): void {
    this.setStyle(this._host, {
      overflow: 'scroll',
      width: `calc(100% + ${nativeScrollbarTrackSize.vScrollbarTrackWidth}px`,
      height: `calc(100% + ${nativeScrollbarTrackSize.hScrollbarTrackHeight}px`,
      marginRight: `-${nativeScrollbarTrackSize.vScrollbarTrackWidth}px`,
      marginBottom: `-${nativeScrollbarTrackSize.hScrollbarTrackHeight}px`,
    });
  }

  private setStyle(element: Element, style: Dictionary): void {
    Object.keys(style).forEach(key => this._renderer.setStyle(element, key, style[key]));
  }
}
