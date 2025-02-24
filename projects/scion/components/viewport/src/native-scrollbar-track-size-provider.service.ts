/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {inject, Injectable, NgZone, Signal} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {fromEvent} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, startWith} from 'rxjs/operators';
import {toSignal} from '@angular/core/rxjs-interop';
import {subscribeIn} from '@scion/toolkit/operators';

/**
 * Provides the native scrollbar tracksize.
 */
@Injectable({providedIn: 'root'})
export class SciNativeScrollbarTrackSizeProvider {

  private readonly _document = inject(DOCUMENT);
  private readonly _zone = inject(NgZone);

  /** Provides the track size of the native scrollbar, or `null` if the native scrollbars sit on top of the content. */
  public trackSize: Signal<NativeScrollbarTrackSize | null>;

  constructor() {
    this.trackSize = this.createNativeScrollbarTrackSizeSignal();
  }

  /**
   * Computes the native scrollbar track size.
   *
   * @returns native track size, or `null` if the native scrollbars sit on top of the content.
   */
  private computeTrackSize(): NativeScrollbarTrackSize | null {
    // Create temporary viewport and viewport client with native scrollbars to compute the scrolltrack width.
    const viewportDiv = this._document.createElement('div');
    setStyle(viewportDiv, {
      position: 'absolute',
      overflow: 'scroll',
      height: '100px',
      width: '100px',
      border: '0',
      visibility: 'hidden',
    });

    const viewportClientDiv = this._document.createElement('div');
    setStyle(viewportClientDiv, {
      height: '100%',
      width: '100%',
      border: '0',
    });

    viewportDiv.appendChild(viewportClientDiv);
    this._document.body.appendChild(viewportDiv);

    // Do not use client and offset width/height to calculate the size of the scrollbar, as they are rounded, resulting in unwanted spacing when zooming the page.
    const viewportBounds = viewportDiv.getBoundingClientRect();
    const viewportClientBounds = viewportClientDiv.getBoundingClientRect();
    const trackSize: NativeScrollbarTrackSize = {
      hScrollbarTrackHeight: viewportBounds.height - viewportClientBounds.height,
      vScrollbarTrackWidth: viewportBounds.width - viewportClientBounds.width,
    };

    // Destroy temporary viewport.
    this._document.body.removeChild(viewportDiv);
    if (trackSize.hScrollbarTrackHeight === 0 && trackSize.vScrollbarTrackWidth === 0) {
      return null;
    }

    return trackSize;
  }

  private createNativeScrollbarTrackSizeSignal(): Signal<NativeScrollbarTrackSize | null> {
    // We compute the size of the native scrollbar track when the browser fires the onresize window event.
    // This event is also fired on page zoom or when displaying a hidden document. Hidden documents do not have
    // a scrollbar track size until being displayed, e.g., after showing hidden iframes.
    const trackSize$ = fromEvent(window, 'resize')
      .pipe(
        subscribeIn(fn => this._zone.runOutsideAngular(fn)),
        debounceTime(5),
        startWith(null), // trigger the initial computation
        map(() => this.computeTrackSize()),
        distinctUntilChanged((t1, t2) => t1?.hScrollbarTrackHeight === t2?.hScrollbarTrackHeight && t1?.vScrollbarTrackWidth === t2?.vScrollbarTrackWidth),
      );
    return toSignal(trackSize$, {initialValue: null});
  }
}

/**
 * Applies the given style(s) to the given element.
 *
 * Specify styles to be modified by passing a dictionary containing CSS property names (hyphen case).
 * To remove a style, set its value to `null`.
 *
 * @ignore
 */
function setStyle(element: HTMLElement, styles: {[style: string]: string}): void {
  Object.entries(styles).forEach(([name, value]) => element.style.setProperty(name, value));
}

/**
 * Represents the native scrollbar track size.
 */
export interface NativeScrollbarTrackSize {
  hScrollbarTrackHeight: number;
  vScrollbarTrackWidth: number;
}
