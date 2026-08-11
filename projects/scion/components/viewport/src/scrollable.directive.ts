/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, Directive, effect, ElementRef, inject, input, Renderer2, untracked} from '@angular/core';
import {SciNativeScrollbarTrackSize, SciNativeScrollbarTrackSizeProvider} from './scrolltrack/native-scrollbar-track-size-provider.service';
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
 *
 * This directive provides the `isNativeScrollbarCropped` signal, which indicates whether native scrollbars are pushed out of the viewport element.
 * In templates, access it via the exported template reference variable `sciScrollable`.
 *
 * ```html
 * <div sciScrollable #sciScrollable="sciScrollable" #viewport>
 *   content
 * </div>
 *
 * <!-- Render scrollbars only if native scrollbars are pushed out of the viewport element. -->
 * @if (sciScrollable.isNativeScrollbarCropped()) {
 *   <sci-scrollbar [viewport]="viewport" direction="vscroll"/>
 *   <sci-scrollbar [viewport]="viewport" direction="hscroll"/>
 * }
 * ```
 */
@Directive({
  selector: '[sciScrollable]',
  exportAs: 'sciScrollable',
})
export class SciScrollableDirective {

  /**
   * Controls whether to display native scrollbars.
   *
   * Has no effect if the native scrollbar sits on top of the content, e.g. in OS X.
   */
  public readonly displayNativeScrollbar = input(false, {alias: 'sciScrollableDisplayNativeScrollbar'});

  private readonly _host = inject(ElementRef<HTMLDivElement>).nativeElement as HTMLElement;
  private readonly _renderer = inject(Renderer2);
  private readonly _nativeScrollbarTrackSizeProvider = inject(SciNativeScrollbarTrackSizeProvider);

  /**
   * Indicates whether native scrollbars are pushed out of the viewport element.
   */
  public readonly isNativeScrollbarCropped = computed(() => !this.displayNativeScrollbar() && this._nativeScrollbarTrackSizeProvider.trackSize() !== null);

  constructor() {
    this.controlDisplayOfNativeScrollbar();
  }

  /**
   * Controls the display of the native scrollbar based on this directive's configuration.
   */
  private controlDisplayOfNativeScrollbar(): void {
    effect(() => {
      if (this.isNativeScrollbarCropped()) {
        const trackSize = this._nativeScrollbarTrackSizeProvider.trackSize()!;
        untracked(() => this.shiftNativeScrollbars(trackSize));
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
  private shiftNativeScrollbars(trackSize: SciNativeScrollbarTrackSize): void {
    this.setStyle(this._host, {
      overflow: 'scroll',
      width: `calc(100% + ${trackSize.vScrollbarTrackWidth}px`,
      height: `calc(100% + ${trackSize.hScrollbarTrackHeight}px`,
      marginRight: `-${trackSize.vScrollbarTrackWidth}px`,
      marginBottom: `-${trackSize.hScrollbarTrackHeight}px`,
    });
  }

  private setStyle(element: Element, style: Dictionary): void {
    Object.keys(style).forEach(key => this._renderer.setStyle(element, key, style[key]));
  }
}
