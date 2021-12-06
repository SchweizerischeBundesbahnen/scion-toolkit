/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Inject, Injectable, NgZone, OnDestroy} from '@angular/core';
import {DOCUMENT} from '@angular/common';
import {BehaviorSubject, fromEvent, Observable, Subject} from 'rxjs';
import {debounceTime, distinctUntilChanged, map, startWith, takeUntil} from 'rxjs/operators';

/**
 * Provides the native scrollbar tracksize.
 *
 * @dynamic ignore 'strictMetadataEmit' errors due to the usage of {@link Document} as ambient type for DI.
 */
@Injectable({providedIn: 'root'})
export class SciNativeScrollbarTrackSizeProvider implements OnDestroy {

  private readonly _trackSize$ = new BehaviorSubject<NativeScrollbarTrackSize | null>(null);
  private readonly _destroy$ = new Subject<void>();

  constructor(@Inject(DOCUMENT) private _document: Document, private _zone: NgZone) {
    this.installNativeScrollbarTrackSizeListener();
  }

  /**
   * Returns an {Observable} which emits the native scrollbar track size, if any, or else `null`.
   *
   * Upon subscription, it emits the track size immediately, and then continuously emits when the track size changes.
   */
  public get trackSize$(): Observable<NativeScrollbarTrackSize | null> {
    return this._trackSize$;
  }

  /**
   * Returns the native scrollbar track size, if any, or else `null`.
   */
  public get trackSize(): NativeScrollbarTrackSize | null {
    return this._trackSize$.getValue();
  }

  /**
   * Computes the native scrollbar track size.
   *
   * @returns native track size, or `null` if the native scrollbars sit on top of the content.
   */
  private computeTrackSize(): NativeScrollbarTrackSize | null {
    // create temporary viewport and viewport client with native scrollbars to compute scrolltrack width
    const viewportDiv = this._document.createElement('div');
    setStyle(viewportDiv, {
      position: 'absolute',
      overflow: 'scroll',
      height: '100px',
      width: '100px',
      border: 0,
      visibility: 'hidden',
    });

    const viewportClientDiv = this._document.createElement('div');
    setStyle(viewportClientDiv, {
      height: '100%',
      width: '100%',
      border: 0,
    });

    viewportDiv.appendChild(viewportClientDiv);
    this._document.body.appendChild(viewportDiv);

    const trackSize: NativeScrollbarTrackSize = {
      hScrollbarTrackHeight: viewportDiv.offsetHeight - viewportClientDiv.offsetHeight,
      vScrollbarTrackWidth: viewportDiv.offsetWidth - viewportClientDiv.offsetWidth,
    };

    // destroy temporary viewport
    this._document.body.removeChild(viewportDiv);
    if (trackSize.hScrollbarTrackHeight === 0 && trackSize.vScrollbarTrackWidth === 0) {
      return null;
    }

    return trackSize;
  }

  private installNativeScrollbarTrackSizeListener(): void {
    // We compute the size of the native scrollbar track when the browser fires the onresize window event.
    // This event is also fired on page zoom or when displaying a hidden document. Hidden documents do not have
    // a scrollbar track size until being displayed, e.g., after showing hidden iframes.
    this._zone.runOutsideAngular(() => {
      fromEvent(window, 'resize')
        .pipe(
          debounceTime(5),
          startWith(null), // trigger the initial computation
          map(() => this.computeTrackSize()),
          distinctUntilChanged((t1, t2) => JSON.stringify(t1) === JSON.stringify(t2)),
          takeUntil(this._destroy$),
        )
        .subscribe(trackSize => {
          this._zone.run(() => this._trackSize$.next(trackSize));
        });
    });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
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
function setStyle(element: HTMLElement, style: {[style: string]: any | null}): void {
  Object.keys(style).forEach(key => element.style.setProperty(key, style[key]));
}

/**
 * Represents the native scrollbar track size.
 */
export interface NativeScrollbarTrackSize {
  hScrollbarTrackHeight: number;
  vScrollbarTrackWidth: number;
}
