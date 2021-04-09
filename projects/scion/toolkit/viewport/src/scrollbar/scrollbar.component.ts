/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, HostBinding, Inject, Input, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { fromEvent, merge, Observable, of, Subject, timer } from 'rxjs';
import { debounceTime, first, map, mapTo, startWith, switchMap, takeUntil, takeWhile, withLatestFrom } from 'rxjs/operators';
import { FromDimension, fromDimension$, fromMutation$ } from '@scion/toolkit/observable';
import { filterArray, subscribeInside } from '@scion/toolkit/operators';

/**
 * Renders a vertical or horizontal scrollbar.
 *
 * The scrollbar features the following functionality:
 * - allows to move the thumb by mouse or touch
 * - enlarges the thumb if the mouse pointer is near the thumb
 * - allows paging on mousedown on the scroll track
 *
 * ### CSS styling:
 *
 * You can override the following CSS variables:
 *
 * - sci-scrollbar-color:    Sets the color of the scrollbar (by default, uses `rgb(78, 78, 78)`).
 *
 * Example:
 *
 * ```css
 *
 * sci-scrollbar {
 *   --sci-scrollbar-color: blue;
 * }
 * ```
 */
@Component({
  selector: 'sci-scrollbar',
  templateUrl: './scrollbar.component.html',
  styleUrls: ['./scrollbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SciScrollbarComponent implements OnDestroy {

  /**
   * Timeout for debouncing viewport resize events that trigger the scroll position computation.
   *
   * Debouncing is particularly important in the context of Angular animations, since they continuously
   * trigger resize events. Debouncing prevents the scrollbar from flickering, for example, when the user
   * expands a panel that contains a viewport.
   *
   * @internal
   */
  public static readonly VIEWPORT_RESIZE_DEBOUNCE_TIME = 50;

  private _destroy$ = new Subject<void>();
  private _viewport!: HTMLElement;
  private _viewportChange$ = new Subject<void>();
  private _lastDragPosition: number | null = null;

  private _overflow = false;
  private _thumbSizeFr = 0;
  private _thumbPositionFr = 0;

  /* @docs-private */
  @ViewChild('thumb_handle', {static: true})
  public thumbElement!: ElementRef<HTMLDivElement>;

  @HostBinding('class.vertical')
  public get vertical(): boolean {
    return this.direction === 'vscroll';
  }

  @HostBinding('class.horizontal')
  public get horizontal(): boolean {
    return this.direction === 'hscroll';
  }

  @HostBinding('class.scrolling')
  public get scrolling(): boolean {
    return this._lastDragPosition !== null;
  }

  /**
   * Specifies the direction of the scrollbar.
   *
   * By default, if not specified, renders a vertical scrollbar.
   */
  @Input()
  public direction: 'vscroll' | 'hscroll' = 'vscroll';

  /**
   * The viewport to provide scrollbars for.
   */
  @Input('viewport') // tslint:disable-line:no-input-rename
  public set setViewport(viewport: HTMLElement) {
    this._viewport = viewport;
    this._viewportChange$.next();
  }

  constructor(private _host: ElementRef<HTMLElement>,
              @Inject(DOCUMENT) private _document: any,
              private _zone: NgZone) {
    this._viewportChange$
      .pipe(
        switchMap(() => {
          if (!this._viewport) {
            return of(undefined);
          }
          return merge(
            this.viewportScrollChange$(),
            this.viewportDimensionChange$({debounceTime: SciScrollbarComponent.VIEWPORT_RESIZE_DEBOUNCE_TIME}),
            this.viewportClientDimensionChange$({debounceTime: SciScrollbarComponent.VIEWPORT_RESIZE_DEBOUNCE_TIME}),
          );
        }),
        subscribeInside(continueFn => this._zone.runOutsideAngular(continueFn)),
        takeUntil(this._destroy$),
      )
      .subscribe(() => {
        if (this._viewport) {
          this.renderScrollPosition();
        }
        else {
          this.unsetScrollPosition();
        }
      });
  }

  /**
   * Computes the scroll position and updates CSS variables to render the scroll position in the UI.
   */
  private renderScrollPosition(): void {
    NgZone.assertNotInAngularZone();
    const viewportSize = this.viewportSize;
    const viewportClientSize = this.viewportClientSize;
    const thumbPositionFr = this.scrollPosition / viewportClientSize;
    const thumbSizeFr = viewportSize / viewportClientSize;
    const overflow = viewportClientSize > viewportSize;

    if (thumbPositionFr !== this._thumbPositionFr || thumbSizeFr !== this._thumbSizeFr) {
      this._thumbPositionFr = thumbPositionFr;
      this._thumbSizeFr = thumbSizeFr;
      this.setCssVariable('--ɵsci-scrollbar-thumb-position-fr', thumbPositionFr);
      this.setCssVariable('--ɵsci-scrollbar-thumb-size-fr', thumbSizeFr);
    }

    if (overflow !== this._overflow) {
      this._overflow = overflow;
      overflow ? this._host.nativeElement.classList.add('overflow') : this._host.nativeElement.classList.remove('overflow');
    }
  }

  /**
   * Clears CSS variables used for rendering the scroll position in the UI.
   */
  private unsetScrollPosition(): void {
    NgZone.assertNotInAngularZone();
    this._thumbPositionFr = 0;
    this._thumbSizeFr = 0;
    this._overflow = false;
    this.setCssVariable('--ɵsci-scrollbar-thumb-position-fr', 0);
    this.setCssVariable('--ɵsci-scrollbar-thumb-size-fr', 0);
    this._host.nativeElement.classList.remove('overflow');
  }

  /* @docs-private */
  public onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this._lastDragPosition = this.vertical ? event.touches[0].screenY : event.touches[0].screenX;
  }

  /* @docs-private */
  public onTouchMove(event: TouchEvent): void {
    event.preventDefault();

    const newDragPositionPx = this.vertical ? event.touches[0].screenY : event.touches[0].screenX;
    const scrollbarPanPx = newDragPositionPx - this._lastDragPosition!;
    const viewportPanPx = this.toViewportPanPx(scrollbarPanPx);
    this._lastDragPosition = newDragPositionPx;
    this.moveViewportClient(viewportPanPx);
  }

  /* @docs-private */
  public onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this._lastDragPosition = null;
  }

  /* @docs-private */
  public onMouseDown(mousedownEvent: MouseEvent): void {
    if (mousedownEvent.button !== 0) {
      return;
    }

    mousedownEvent.preventDefault();
    this._lastDragPosition = this.vertical ? mousedownEvent.screenY : mousedownEvent.screenX;

    // Listen for 'mousemove' events
    this._zone.runOutsideAngular(() => {
      const mousemoveListener = merge(fromEvent(this._document, 'mousemove'), fromEvent<MouseEvent>(this._document, 'sci-mousemove'))
        .pipe(takeUntil(this._destroy$))
        .subscribe(mousemoveEvent => {
          mousemoveEvent.preventDefault();

          const newDragPositionPx = this.vertical ? mousemoveEvent.screenY : mousemoveEvent.screenX;
          const scrollbarPanPx = newDragPositionPx - this._lastDragPosition!;
          const viewportPanPx = this.toViewportPanPx(scrollbarPanPx);
          this._lastDragPosition = newDragPositionPx;
          this.moveViewportClient(viewportPanPx);
        });

      // Listen for 'mouseup' events; use 'capture phase' and 'stop propagation' to not close overlays
      merge(fromEvent(this._document, 'mouseup', {capture: true}), fromEvent<MouseEvent>(this._document, 'sci-mouseup'))
        .pipe(first(), takeUntil(this._destroy$))
        .subscribe(mouseupEvent => {
          mouseupEvent.stopPropagation();
          mousemoveListener.unsubscribe();
          this._lastDragPosition = null;
        });
    });
  }

  /* @docs-private */
  public onScrollTrackMouseDown(event: MouseEvent, direction: 'up' | 'down'): void {
    const signum = (direction === 'up' ? -1 : +1);
    this.scrollWhileMouseDown(this.toViewportPanPx(signum * this.thumbSize), event);
  }

  /**
   * Projects the given scrollbar scroll pixels into viewport scroll pixels.
   */
  private toViewportPanPx(scrollbarPanPx: number): number {
    const scrollRangePx = this.trackSize - this.thumbSize;
    const scrollRatio = scrollbarPanPx / scrollRangePx;
    return scrollRatio * (this.viewportClientSize - this.viewportSize);
  }

  /**
   * Moves the viewport client by the specified numbers of pixels.
   */
  private moveViewportClient(viewportPanPx: number): void {
    if (this.vertical) {
      this._viewport.scrollTop += viewportPanPx;
    }
    else {
      this._viewport.scrollLeft += viewportPanPx;
    }
  }

  /**
   * Indicates if the content overflows.
   */
  public get overflow(): boolean {
    return this._overflow;
  }

  /**
   * Scrolls continuously while holding the mouse pressed, or until the mouse leaves the scrolltrack.
   */
  private scrollWhileMouseDown(viewportScrollPx: number, mousedownEvent: MouseEvent): void {
    // The `EventTarget` type of `Event.target` is not yet compatible with `FromEventTarget` used in `fromEvent`.
    // This will be fixed in rxjs version 7.0.0. Refer to https://github.com/ReactiveX/rxjs/commit/5f022d784570684632e6fd5ae247fc259ee34c4b
    // for more details.
    const scrollTrackElement = mousedownEvent.target as Element;

    // scroll continuously every 50ms after an initial delay of 250ms
    timer(250, 50)
      .pipe(
        // continue chain with latest mouse event
        withLatestFrom(merge(of(mousedownEvent), fromEvent<MouseEvent>(scrollTrackElement, 'mousemove')), (tick, event) => event),
        // start immediately
        startWith(mousedownEvent),
        // stop scrolling on mouseout or mouseup
        takeUntil(merge(fromEvent(scrollTrackElement, 'mouseout'), fromEvent(scrollTrackElement, 'mouseup'))),
        // stop scrolling if the thumb hits the mouse pointer position
        takeWhile((event: MouseEvent) => scrollTrackElement === this._document.elementFromPoint(event.clientX, event.clientY)),
        debounceTime(10),
      )
      .subscribe(() => {
        this.moveViewportClient(viewportScrollPx);
      });
  }

  /**
   * Emits whenever the viewport scrolls.
   */
  private viewportScrollChange$(): Observable<void> {
    return fromEvent(this._viewport, 'scroll', {passive: true}).pipe(mapTo(undefined));
  }

  /**
   * Emits on subscription, and then each time the size of the viewport changes.
   */
  private viewportDimensionChange$(options: { debounceTime: number }): Observable<void> {
    return fromDimension$(this._viewport)
      .pipe(
        // Debouncing is particularly important in the context of Angular animations, since they continuously
        // trigger resize events. Debouncing prevents the scrollbar from flickering, for example, when the user
        // expands a panel that contains a viewport.
        debounceTime(options.debounceTime),
        mapTo(undefined),
      );
  }

  /**
   * Emits on subscription, and then each time the size or style property of the viewport client changes.
   */
  private viewportClientDimensionChange$(options: { debounceTime: number }): Observable<void> {
    return this.children$(this._viewport)
      .pipe(
        switchMap(children => merge(...children.map(child => merge(
          fromDimension$(child),
          // Observe style mutations since some transformations change the scroll position without necessarily triggering a dimension change,
          // e.g., `scale` or `translate` used by some virtual scroll implementations
          fromMutation$(child, {subtree: false, childList: false, attributeFilter: ['style']})),
        ))),
        // Debouncing is particularly important in the context of Angular animations, since they continuously
        // trigger resize events. Debouncing prevents the scrollbar from flickering, for example, when the user
        // expands a panel that contains a viewport.
        debounceTime(options.debounceTime),
        mapTo(undefined),
      );
  }

  /**
   * Emits the children of the passed element, and then each time child elements are added or removed.
   */
  private children$(element: HTMLElement): Observable<HTMLElement[]> {
    return fromMutation$(element, {subtree: false, childList: true})
      .pipe(
        map(() => Array.from(element.children)),
        startWith(Array.from(element.children)),
        filterArray((child: Element): child is HTMLElement => child instanceof HTMLElement),
        filterArray(child => !FromDimension.isSynthResizeObservableObject(child)),
      );
  }

  private setCssVariable(key: string, value: any): void {
    this._host.nativeElement.style.setProperty(key, value);
  }

  private get viewportSize(): number {
    return this._viewport ? (this.vertical ? this._viewport.clientHeight : this._viewport.clientWidth) : 0;
  }

  private get viewportClientSize(): number {
    return this._viewport ? (this.vertical ? this._viewport.scrollHeight : this._viewport.scrollWidth) : 0;
  }

  private get scrollPosition(): number {
    return this._viewport ? (this.vertical ? this._viewport.scrollTop : this._viewport.scrollLeft) : 0;
  }

  private get thumbSize(): number {
    const thumbElement = this.thumbElement.nativeElement;
    return this.vertical ? thumbElement.clientHeight : thumbElement.clientWidth;
  }

  private get trackSize(): number {
    const trackElement = this._host.nativeElement;
    return this.vertical ? trackElement.clientHeight : trackElement.clientWidth;
  }

  /* @docs-private */
  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}
