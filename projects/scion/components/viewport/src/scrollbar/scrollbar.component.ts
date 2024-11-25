/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {DOCUMENT} from '@angular/common';
import {ChangeDetectionStrategy, Component, computed, DestroyRef, effect, ElementRef, HostBinding, inject, input, NgZone, untracked, viewChild} from '@angular/core';
import {fromEvent, merge, mergeWith, Observable, of, timer} from 'rxjs';
import {debounceTime, first, map, startWith, switchMap, takeUntil, takeWhile, withLatestFrom} from 'rxjs/operators';
import {fromMutation$, fromResize$} from '@scion/toolkit/observable';
import {filterArray, subscribeIn} from '@scion/toolkit/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

/**
 * Renders a vertical or horizontal scrollbar.
 *
 * The scrollbar features the following functionality:
 * - allows to move the thumb by mouse or touch
 * - enlarges the thumb if the mouse pointer is near the thumb
 * - allows paging on mousedown on the scroll track
 *
 * ### Styling:
 *
 * To customize the default look of SCION components or support different themes, configure the `@scion/components` SCSS module in `styles.scss`.
 * To style a specific `sci-scrollbar` component, the following CSS variables can be set directly on the component.
 *
 * - sci-scrollbar-color:    Sets the color of the scrollbar.
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
  styleUrl: './scrollbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SciScrollbarComponent {

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

  private _host = inject(ElementRef<HTMLElement>).nativeElement;
  private _document = inject(DOCUMENT);
  private _zone = inject(NgZone);
  private _destroyRef = inject(DestroyRef);

  private _lastDragPosition: number | null = null;
  private _overflow = false;
  private _thumbSizeFr = 0;
  private _thumbPositionFr = 0;

  private _thumbElement = viewChild.required<ElementRef<HTMLDivElement>>('thumb_handle');
  private _vertical = computed(() => this.direction() === 'vscroll');

  @HostBinding('class.vertical')
  public get vertical(): boolean {
    return this._vertical();
  }

  @HostBinding('class.horizontal')
  public get horizontal(): boolean {
    return !this._vertical();
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
  public direction = input<'vscroll' | 'hscroll'>('vscroll');

  /**
   * The viewport to provide scrollbars for.
   */
  public viewport = input.required<HTMLElement>();

  constructor() {
    this.installScrollPositionRenderer();
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
      overflow ? this._host.classList.add('overflow') : this._host.classList.remove('overflow');
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
    this._host.classList.remove('overflow');
  }

  protected onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this._lastDragPosition = this.vertical ? event.touches[0].screenY : event.touches[0].screenX;
  }

  protected onTouchMove(event: TouchEvent): void {
    event.preventDefault();

    const newDragPositionPx = this.vertical ? event.touches[0].screenY : event.touches[0].screenX;
    const scrollbarPanPx = newDragPositionPx - this._lastDragPosition!;
    const viewportPanPx = this.toViewportPanPx(scrollbarPanPx);
    this._lastDragPosition = newDragPositionPx;
    this.moveViewportClient(viewportPanPx);
  }

  protected onTouchEnd(event: TouchEvent): void {
    event.preventDefault();
    this._lastDragPosition = null;
  }

  protected onMouseDown(mousedownEvent: MouseEvent): void {
    if (mousedownEvent.button !== 0) {
      return;
    }

    mousedownEvent.preventDefault();
    this._lastDragPosition = this.vertical ? mousedownEvent.screenY : mousedownEvent.screenX;

    // Listen for 'mousemove' events
    const mousemoveListener = merge(fromEvent<MouseEvent>(this._document, 'mousemove'), fromEvent<MouseEvent>(this._document, 'sci-mousemove'))
      .pipe(
        subscribeIn(fn => this._zone.runOutsideAngular(fn)),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(mousemoveEvent => {
        NgZone.assertNotInAngularZone();
        mousemoveEvent.preventDefault();
        const newDragPositionPx = this.vertical ? mousemoveEvent.screenY : mousemoveEvent.screenX;
        const scrollbarPanPx = newDragPositionPx - this._lastDragPosition!;
        const viewportPanPx = this.toViewportPanPx(scrollbarPanPx);
        this._lastDragPosition = newDragPositionPx;
        this.moveViewportClient(viewportPanPx);
      });

    // Listen for 'mouseup' events; use 'capture phase' and 'stop propagation' to not close overlays
    merge(fromEvent<MouseEvent>(this._document, 'mouseup', {capture: true}), fromEvent<MouseEvent>(this._document, 'sci-mouseup'))
      .pipe(
        subscribeIn(fn => this._zone.runOutsideAngular(fn)),
        first(),
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(mouseupEvent => {
        NgZone.assertNotInAngularZone();
        mouseupEvent.stopPropagation();
        mousemoveListener.unsubscribe();
        this._lastDragPosition = null;
      });
  }

  protected onScrollTrackMouseDown(event: MouseEvent, direction: 'up' | 'down'): void {
    const signum = (direction === 'up' ? -1 : +1);
    this.scrollWhileMouseDown(this.toViewportPanPx(signum * this.thumbSize), event);
  }

  /**
   * Renders the current scroll position when the viewport is scrolled.
   */
  private installScrollPositionRenderer(): void {
    effect(onCleanup => {
      const viewport = this.viewport();

      untracked(() => {
        if (!viewport) {
          this.unsetScrollPosition();
          return;
        }

        const subscription = viewportScroll$(viewport)
          .pipe(
            mergeWith(viewportSize$(viewport, {debounceTime: SciScrollbarComponent.VIEWPORT_RESIZE_DEBOUNCE_TIME})),
            mergeWith(viewportClientSize$(viewport, {debounceTime: SciScrollbarComponent.VIEWPORT_RESIZE_DEBOUNCE_TIME})),
            subscribeIn(fn => this._zone.runOutsideAngular(fn)),
          )
          .subscribe(() => this.renderScrollPosition());
        onCleanup(() => subscription.unsubscribe());
      });
    });
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
      this.viewport().scrollTop += viewportPanPx;
    }
    else {
      this.viewport().scrollLeft += viewportPanPx;
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
        // stop scrolling if the thumb hits the mouse pointer position
        takeWhile((event: MouseEvent) => scrollTrackElement === this._document.elementFromPoint(event.clientX, event.clientY)),
        debounceTime(10),
        // stop scrolling on mouseout or mouseup
        takeUntil(merge(fromEvent(scrollTrackElement, 'mouseout'), fromEvent(scrollTrackElement, 'mouseup'))),
      )
      .subscribe(() => {
        this.moveViewportClient(viewportScrollPx);
      });
  }

  private setCssVariable(key: string, value: any): void {
    this._host.style.setProperty(key, value);
  }

  private get viewportSize(): number {
    return this.viewport() ? (this.vertical ? this.viewport().clientHeight : this.viewport().clientWidth) : 0;
  }

  private get viewportClientSize(): number {
    return this.viewport() ? (this.vertical ? this.viewport().scrollHeight : this.viewport().scrollWidth) : 0;
  }

  private get scrollPosition(): number {
    return this.viewport() ? (this.vertical ? this.viewport().scrollTop : this.viewport().scrollLeft) : 0;
  }

  private get thumbSize(): number {
    const thumbElement = this._thumbElement().nativeElement;
    return this.vertical ? thumbElement.clientHeight : thumbElement.clientWidth;
  }

  private get trackSize(): number {
    return this.vertical ? this._host.clientHeight : this._host.clientWidth;
  }
}

/**
 * Emits whenever the viewport scrolls.
 */
function viewportScroll$(viewport: HTMLElement): Observable<void> {
  return fromEvent(viewport, 'scroll', {passive: true}).pipe(map(() => undefined));
}

/**
 * Emits on subscription, and then each time the size of the viewport changes.
 */
function viewportSize$(viewport: HTMLElement, options: {debounceTime: number}): Observable<void> {
  return fromResize$(viewport)
    .pipe(
      // Debouncing is particularly important in the context of Angular animations, since they continuously
      // trigger resize events. Debouncing prevents the scrollbar from flickering, for example, when the user
      // expands a panel that contains a viewport.
      debounceTime(options.debounceTime),
      map(() => undefined),
    );
}

/**
 * Emits on subscription, and then each time the size or style property of the viewport client changes.
 */
function viewportClientSize$(viewport: HTMLElement, options: {debounceTime: number}): Observable<void> {
  return children$(viewport)
    .pipe(
      switchMap(children => merge(...children.map(child => merge(
        fromResize$(child),
        // Observe style mutations since some transformations change the scroll position without necessarily triggering a dimension change,
        // e.g., `scale` or `translate` used by some virtual scroll implementations
        fromMutation$(child, {subtree: false, childList: false, attributeFilter: ['style']})),
      ))),
      // Debouncing is particularly important in the context of Angular animations, since they continuously
      // trigger resize events. Debouncing prevents the scrollbar from flickering, for example, when the user
      // expands a panel that contains a viewport.
      debounceTime(options.debounceTime),
      map(() => undefined),
    );
}

/**
 * Emits the children of the passed element, and then each time child elements are added or removed.
 */
function children$(element: HTMLElement): Observable<HTMLElement[]> {
  return fromMutation$(element, {subtree: false, childList: true})
    .pipe(
      startWith(undefined as void),
      map(() => Array.from(element.children)),
      filterArray((child: Element): child is HTMLElement => child instanceof HTMLElement),
    );
}
