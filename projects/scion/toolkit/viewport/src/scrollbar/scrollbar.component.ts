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
import { fromEvent, merge, of, Subject, timer } from 'rxjs';
import { debounceTime, first, startWith, takeUntil, takeWhile, withLatestFrom } from 'rxjs/operators';

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

  private _destroy$ = new Subject<void>();
  private _viewport: HTMLElement;
  private _lastDragPosition: number = null;

  private _overflow: boolean;
  private _thumbSizeFr: number;
  private _thumbPositionFr: number;

  /* @docs-private */
  @ViewChild('thumb_handle', {static: true})
  public thumbElement: ElementRef<HTMLDivElement>;

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

  @Input()
  public direction: 'vscroll' | 'hscroll';

  /**
   * The viewport to provide scrollbars for.
   */
  @Input('viewport') // tslint:disable-line:no-input-rename
  public set setViewport(viewport: HTMLElement) {
    this._viewport = viewport;
  }

  constructor(private _host: ElementRef<HTMLElement>,
              @Inject(DOCUMENT) private _document: any,
              private _zone: NgZone) {
    this._zone.onStable
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => {
        NgZone.assertNotInAngularZone();
        this.renderScrollPosition();
      });
  }

  /**
   * Computes the scroll position and updates CSS variables to render the scroll position in the UI.
   */
  private renderScrollPosition(): void {
    const viewportSize = this.viewportSize;
    const viewportClientSize = this.viewportClientSize;
    const thumbPositionFr = this.scrollTop / viewportClientSize;
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

  /* @docs-private */
  public onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    this._lastDragPosition = this.vertical ? event.touches[0].screenY : event.touches[0].screenX;
  }

  /* @docs-private */
  public onTouchMove(event: TouchEvent): void {
    event.preventDefault();

    const newDragPositionPx = this.vertical ? event.touches[0].screenY : event.touches[0].screenX;
    const scrollbarPanPx = newDragPositionPx - this._lastDragPosition;
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
  public onMouseDown(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }

    event.preventDefault();
    this._lastDragPosition = this.vertical ? event.screenY : event.screenX;

    // Listen for 'mousemove' events
    this._zone.runOutsideAngular(() => {
      const mousemoveListener = merge(fromEvent(this._document, 'mousemove'), fromEvent(this._document, 'sci-mousemove'))
        .pipe(takeUntil(this._destroy$))
        .subscribe((mousemoveEvent: MouseEvent) => {
          mousemoveEvent.preventDefault();

          const newDragPositionPx = this.vertical ? mousemoveEvent.screenY : mousemoveEvent.screenX;
          const scrollbarPanPx = newDragPositionPx - this._lastDragPosition;
          const viewportPanPx = this.toViewportPanPx(scrollbarPanPx);
          this._lastDragPosition = newDragPositionPx;
          this.moveViewportClient(viewportPanPx);
        });

      // Listen for 'mouseup' events; use 'capture phase' and 'stop propagation' to not close overlays
      merge(fromEvent(this._document, 'mouseup', {capture: true}), fromEvent(this._document, 'sci-mouseup'))
        .pipe(first(), takeUntil(this._destroy$))
        .subscribe((mouseupEvent: MouseEvent) => {
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
    const scrollTrackElement = mousedownEvent.target;

    // scroll continously every 50ms after an initial delay of 250ms
    timer(250, 50)
      .pipe(
        // continue chain with latest mouse event
        withLatestFrom(merge(of(mousedownEvent), fromEvent(scrollTrackElement, 'mousemove')), (tick, event) => event),
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

  private setCssVariable(key: string, value: any): void {
    this._host.nativeElement.style.setProperty(key, value);
  }

  private get viewportSize(): number {
    return this._viewport ? (this.vertical ? this._viewport.clientHeight : this._viewport.clientWidth) : 0;
  }

  private get viewportClientSize(): number {
    return this._viewport ? (this.vertical ? this._viewport.scrollHeight : this._viewport.scrollWidth) : 0;
  }

  private get scrollTop(): number {
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
