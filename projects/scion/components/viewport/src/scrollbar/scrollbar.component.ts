/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, computed, DestroyRef, DOCUMENT, effect, ElementRef, inject, input, NgZone, signal, untracked, viewChild} from '@angular/core';
import {concatWith, exhaustMap, finalize, fromEvent, merge, mergeWith, Observable, of, race, tap, timer} from 'rxjs';
import {debounceTime, map, startWith, switchMap, takeUntil, withLatestFrom} from 'rxjs/operators';
import {fromMutation$, fromResize$} from '@scion/toolkit/observable';
import {subscribeIn} from '@scion/toolkit/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {clamp, isBetween} from '@scion/toolkit/util';

/**
 * Renders a vertical or horizontal scrollbar.
 *
 * The scrollbar features the following functionality:
 * - allows to move the thumb by mouse
 * - enlarges the thumb if the mouse pointer is near the thumb
 * - allows paging on mousedown on the scroll track
 *
 * ### Styling:
 *
 * To customize the default look of SCION components or support different themes, configure the `@scion/components` SCSS module in `styles.scss`.
 * To style a specific `sci-scrollbar` component, the following CSS variables can be set directly on the component.
 *
 * - --sci-scrollbar-color:    Sets the color of the scrollbar.
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
  host: {
    '[class.vertical]': 'vertical()',
    '[class.horizontal]': 'horizontal()',
    '[class.scrolling]': 'scrolling()',
    '[class.overflow]': 'overflow()',
    '[style.--ɵsci-scrollbar-thumb-position-fr]': 'thumbPositionFr()',
    '[style.--ɵsci-scrollbar-thumb-size-fr]': 'thumbSizeFr()',
  },
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

  /**
   * Specifies the direction of the scrollbar. Defaults to a vertical scrollbar.
   */
  public readonly direction = input<'vscroll' | 'hscroll'>('vscroll');

  /**
   * Specifies the viewport associated with the scrollbar.
   */
  public readonly viewport = input.required<HTMLElement>();

  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly _document = inject(DOCUMENT);
  private readonly _zone = inject(NgZone);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _thumbElement = viewChild.required<ElementRef<HTMLDivElement>>('thumb_handle');

  protected readonly vertical = computed(() => this.direction() === 'vscroll');
  protected readonly horizontal = computed(() => !this.vertical());
  protected readonly scrolling = signal(false);
  protected readonly overflow = signal(false);
  protected readonly thumbSizeFr = signal(0);
  protected readonly thumbPositionFr = signal(0);

  constructor() {
    this.installScrollPositionRenderer();
  }

  /**
   * Computes the scroll position and updates CSS variables to render the scroll position.
   */
  private renderScrollPosition(): void {
    NgZone.assertNotInAngularZone();
    const viewportSize = this.viewportSize();
    const viewportClientSize = this.viewportClientSize();

    this.thumbPositionFr.set(this.viewportScrollPosition() / viewportClientSize);
    this.thumbSizeFr.set(viewportSize / viewportClientSize);
    this.overflow.set(viewportClientSize > viewportSize);
  }

  /**
   * Method invoked when clicking on the scrollbar thumb.
   */
  protected onThumbMouseDown(mousedownEvent: MouseEvent): void {
    if (mousedownEvent.button !== 0) {
      return;
    }

    this.scrolling.set(true);

    // Prevent text selection during drag.
    mousedownEvent.preventDefault();

    // Calculate screen offset to convert screen coordinates into client coordinates, required for `sci-mousemove` events which originate from other documents (iframes).
    const {screenOffsetX, screenOffsetY} = calculateScreenOffset(mousedownEvent);

    // Memoize offset where thumb was clicked.
    const thumbStartOffset = this.vertical() ? mousedownEvent.offsetY : mousedownEvent.offsetX;

    // Stop scrolling when releasing the mouse. Handle the event in the capture phase and stop propagation to not close a potential overlay when releasing the mouse outside the overlay.
    const mouseUp$ = race(fromEvent<MouseEvent>(this._document, 'mouseup', {capture: true, once: true}), fromEvent<MouseEvent>(this._document, 'sci-mouseup', {once: true}))
      .pipe(tap(mouseupEvent => mouseupEvent.stopPropagation()));

    // Track pointer until mouse release.
    merge(fromEvent<MouseEvent>(this._document, 'mousemove'), fromEvent<MouseEvent>(this._document, 'sci-mousemove'))
      .pipe(
        subscribeIn(fn => this._zone.runOutsideAngular(fn)),
        takeUntilDestroyed(this._destroyRef),
        takeUntil(mouseUp$),
        finalize(() => this.scrolling.set(false)),
      )
      .subscribe(mousemoveEvent => {
        NgZone.assertNotInAngularZone();

        // Prevent user agent scrolling while during drag.
        mousemoveEvent.preventDefault();

        // Calculate new thumb position.
        const pointerPosition = this.vertical() ? mousemoveEvent.screenY - screenOffsetY : mousemoveEvent.screenX - screenOffsetX;
        this.scrollViewport(pointerPosition - thumbStartOffset);
      });
  }

  /**
   * Method invoked when clicking on the scrollbar track.
   *
   * Scrolls in discrete steps to the pointer, then switches to regular scrolling until releasing the mouse.
   */
  protected onScrollTrackMouseDown(event: MouseEvent): void {
    this.scrolling.set(true);

    // Prevent text selection during drag.
    event.preventDefault();

    const mouseMove$ = merge(fromEvent<MouseEvent>(this._document, 'mousemove'), fromEvent<MouseEvent>(this._document, 'sci-mousemove'));

    // Handle the event in the capture phase and stop propagation to not close a potential overlay when releasing the mouse outside the overlay.
    const mouseUp$ = race(fromEvent<MouseEvent>(this._document, 'mouseup', {capture: true, once: true}), fromEvent<MouseEvent>(this._document, 'sci-mouseup', {once: true}))
      .pipe(tap(mouseupEvent => mouseupEvent.stopPropagation()));

    // Calculate screen offset to convert screen coordinates into client coordinates, required for `sci-mousemove` events which originate from other documents (iframes).
    const {screenOffsetX, screenOffsetY} = calculateScreenOffset(event);

    // Scroll in discrete steps to the pointer position, then switch to regular scrolling.
    timer(250, 50)
      .pipe(
        // Track current pointer position.
        withLatestFrom(mouseMove$.pipe(startWith(event)), (_tick, event) => event),
        // Scroll immediately on initial click.
        startWith(event),
        subscribeIn(fn => this._zone.runOutsideAngular(fn)),
        exhaustMap(event => {
          const pointerPosition = this.vertical() ? event.screenY - screenOffsetY : event.screenX - screenOffsetX;
          const [thumbStartPosition, thumbEndPosition] = this.thumbPosition();
          const thumbSize = thumbEndPosition - thumbStartPosition;

          // Step scroll until the pointer hits the thumb.
          if (!isBetween(pointerPosition, {from: thumbStartPosition - thumbSize, to: thumbEndPosition + thumbSize})) {
            const scrollingDown = pointerPosition > thumbEndPosition;
            return of(scrollingDown ? thumbStartPosition + thumbSize : thumbStartPosition - thumbSize);
          }

          // Switch to "smooth scrolling" following the pointer.
          return of(event)
            .pipe(
              concatWith(mouseMove$),
              map(event => (this.vertical() ? event.screenY - screenOffsetY : event.screenX - screenOffsetX) - (thumbSize / 2)),
            );
        }),
        // Stop on mouse release.
        takeUntil(mouseUp$),
        finalize(() => this.scrolling.set(false)),
      )
      .subscribe((thumbPosition: number) => {
        NgZone.assertNotInAngularZone();
        this.scrollViewport(thumbPosition);
      });
  }

  /**
   * Renders the current scroll position when the viewport is scrolled.
   */
  private installScrollPositionRenderer(): void {
    effect(onCleanup => {
      const viewport = this.viewport();

      untracked(() => {
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
   * Moves the scrollbar thumb to the specified position, scrolling the viewport accordingly.
   *
   * The thumb position must be given in client coordinates (relative to the top-left corner of the page viewport).
   */
  private scrollViewport(thumbPosition: number): void {
    const [scrollbarComponentStartPosition] = this.scrollbarComponentPosition();
    const scrollbarBorderWidth = this.vertical() ? this._host.clientTop : this._host.clientLeft;
    const scrollRatio = clamp((thumbPosition - scrollbarComponentStartPosition - scrollbarBorderWidth) / (this.trackSize() - this.thumbSize()), {min: 0, max: 1});
    const viewportScrollPosition = scrollRatio * (this.viewportClientSize() - this.viewportSize());

    if (this.vertical()) {
      this.viewport().scrollTop = viewportScrollPosition;
    }
    else {
      this.viewport().scrollLeft = viewportScrollPosition;
    }
  }

  /**
   * Returns the position of this component in client coordinates.
   *
   * Returned coordinates are relative to the top-left corner of the page viewport.
   * Depending on the scrollbar orientation, returned coordinates are `[top, bottom]` or `[left, right]`.
   */
  private scrollbarComponentPosition(): [number, number] {
    const boundingBox = this._host.getBoundingClientRect();
    return this.vertical() ? [boundingBox.top, boundingBox.bottom] : [boundingBox.left, boundingBox.right];
  }

  /**
   * Returns the size of the viewport in pixels.
   *
   * The viewport is the container for scrollable content (viewport client), displaying scrollbars if it overflows.
   * Depending on the scrollbar orientation, the returned size is `viewport.clientHeight` or `viewport.clientWidth`.
   */
  private viewportSize(): number {
    return this.vertical() ? this.viewport().clientHeight : this.viewport().clientWidth;
  }

  /**
   * Returns the size of the viewport client in pixels.
   *
   * The viewport client represents scrollable content displayed in the viewport.
   * Depending on the scrollbar orientation, the returned size is `viewport.scrollHeight` or `viewport.scrollWidth`.
   */
  private viewportClientSize(): number {
    return this.vertical() ? this.viewport().scrollHeight : this.viewport().scrollWidth;
  }

  /**
   * Returns the viewport's scroll position in pixels.
   *
   * Depending on the scrollbar orientation, the returned position is `viewport.scrollTop` or `viewport.scrollLeft`.
   */
  private viewportScrollPosition(): number {
    return this.vertical() ? this.viewport().scrollTop : this.viewport().scrollLeft;
  }

  /**
   * Returns the size of the scrollbar thumb in pixels.
   *
   * The thumb is the handle used to scroll the scrollbar.
   */
  private thumbSize(): number {
    const thumbElement = this._thumbElement().nativeElement;
    return this.vertical() ? thumbElement.offsetHeight : thumbElement.offsetWidth;
  }

  /**
   * Returns the current thumb position in client coordinates.
   *
   * Returned coordinates are relative to the top-left corner of the page viewport.
   * Depending on the scrollbar orientation, returned coordinates are `[top, bottom]` or `[left, right]`.
   */
  private thumbPosition(): [number, number] {
    const boundingBox = this._thumbElement().nativeElement.getBoundingClientRect();
    return this.vertical() ? [boundingBox.top, boundingBox.bottom] : [boundingBox.left, boundingBox.right];
  }

  /**
   * Returns the size of the scrollbar track in pixels.
   *
   * The scrollbar track is the track along which the scrollbar thumb moves.
   */
  private trackSize(): number {
    return this.vertical() ? this._host.clientHeight : this._host.clientWidth;
  }
}

/**
 * Emits whenever the viewport is scrolled.
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
      map(() => Array.from(element.children)
        // Map to slotted content if a slot (Shadow DOM).
        .flatMap(child => child instanceof HTMLSlotElement ? child.assignedElements() : child)
        // Filter HTML elements.
        .filter((child: Element): child is HTMLElement => child instanceof HTMLElement)),
    );
}

/**
 * Calculates the distance between the top-left corner of the screen (monitor) and the top-left corner of the page viewport of this document.
 *
 * Use to convert screen coordinates from `sci-mousemove` and `sci-mouseup` events into client coordinates relative to the page viewport of the current document.
 *
 * The `sci-mousemove` and `sci-mouseup` events originate from other documents (iframes) and do not include client coordinates. Even if they did, they would be
 * relative to the source document, not the current one.
 */
function calculateScreenOffset(mousedownEvent: MouseEvent): {screenOffsetX: number; screenOffsetY: number} {
  return {
    screenOffsetX: mousedownEvent.screenX - mousedownEvent.clientX,
    screenOffsetY: mousedownEvent.screenY - mousedownEvent.clientY,
  };
}
