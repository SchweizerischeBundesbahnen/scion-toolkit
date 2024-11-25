/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, Inject, Input, NgZone, OnDestroy, OnInit, Output, ViewChild} from '@angular/core';
import {fromEvent, merge, Subject} from 'rxjs';
import {DOCUMENT} from '@angular/common';
import {tapFirst} from '@scion/toolkit/operators';
import {first, takeUntil} from 'rxjs/operators';

/**
 * Represents a splitter, a visual element that allows the user to control the size of elements next to it.
 *
 * The splitter has a handle that the user can move depending on the orientation of the splitter.
 *
 * Note that this control neither does change the size of adjacent elements nor does it (re-)position itself, but emits the distance by
 * which the user has theoretically moved the splitter. You must subscribe to these events and change your layout accordingly.
 *
 * In the toolkit, {@link SciSashboxComponent} uses this splitter to divide a layout into several resizable sections.
 * Another use case would be a resizable sidebar panel.
 *
 * ### Usage
 *
 * ```html
 * <sci-splitter (move)="onSplitterMove($event.distance)"></sci-splitter>
 * ```
 *
 * ### Styling
 *
 * To customize the default look of SCION components or support different themes, configure the `@scion/components` SCSS module in `styles.scss`.
 * To style a specific `sci-splitter` component, the following CSS variables can be set directly on the component.
 *
 * - --sci-splitter-background-color: Sets the background color of the splitter.
 * - --sci-splitter-background-color-hover: Sets the background color of the splitter when hovering it.
 * - --sci-splitter-size: Sets the size of the splitter along the main axis.
 * - --sci-splitter-size-hover: Sets the size of the splitter along the main axis when hovering it.
 * - --sci-splitter-touch-target-size: Sets the touch target size to move the splitter (accessibility).
 * - --sci-splitter-cross-axis-size: Sets the splitter size along the cross axis.
 * - --sci-splitter-border-radius: Sets the border radius of the splitter.
 * - --sci-splitter-opacity-active: Sets the opacity of the splitter while the user moves the splitter.
 * - --sci-splitter-opacity-hover: Sets the opacity of the splitter when hovering it.
 *
 * Example:
 *
 * ```scss
 * sci-splitter {
 *   --sci-splitter-background-color: black;
 *   --sci-splitter-background-color-hover: black;
 * }
 * ```
 */
@Component({
  selector: 'sci-splitter',
  templateUrl: './splitter.component.html',
  styleUrls: ['./splitter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SciSplitterComponent implements OnInit, OnDestroy {

  private _destroy$ = new Subject<void>();

  /* @docs-private */
  @HostBinding('class.moving')
  public moving = false;

  @HostBinding('class.vertical')
  public get isVertical(): boolean {
    return !this.isHorizontal;
  }

  @HostBinding('class.horizontal')
  public get isHorizontal(): boolean {
    return this.orientation === 'horizontal';
  }

  /**
   * Controls whether to render a vertical or horizontal splitter.
   * By default, if not specified, renders a vertical splitter.
   */
  @Input()
  public orientation: 'vertical' | 'horizontal' = 'vertical';

  /**
   * Emits when starting to move the splitter.
   */
  @Output()
  public start = new EventEmitter<void>(); // eslint-disable-line @angular-eslint/no-output-native

  /**
   * Emits the distance in pixels when the splitter is moved.
   * The event is emitted outside of the Angular zone.
   */
  @Output()
  public move = new EventEmitter<SplitterMoveEvent>();

  /**
   * Emits when ending to move the splitter.
   */
  @Output()
  public end = new EventEmitter<void>(); // eslint-disable-line @angular-eslint/no-output-native

  /**
   * Emits when to reset the splitter position.
   */
  @Output()
  public reset = new EventEmitter<void>(); // eslint-disable-line @angular-eslint/no-output-native

  /* @docs-private */
  @HostBinding('style.cursor')
  public get splitterCursor(): string {
    return this.isVertical ? 'ew-resize' : 'ns-resize';
  }

  /* @docs-private */
  @ViewChild('touch_target', {static: true})
  public touchTargetElementRef!: ElementRef<HTMLElement>;

  constructor(private _zone: NgZone,
              private _cd: ChangeDetectorRef,
              @Inject(DOCUMENT) private _document: Document) {
  }

  /* @docs-private */
  public ngOnInit(): void {
    fromEvent(this.touchTargetElementRef.nativeElement, 'dblclick')
      .pipe(takeUntil(this._destroy$))
      .subscribe(() => this.onReset());

    fromEvent<TouchEvent>(this.touchTargetElementRef.nativeElement, 'touchstart')
      .pipe(takeUntil(this._destroy$))
      .subscribe((event: TouchEvent) => this.onTouchStart(event));

    fromEvent<MouseEvent>(this.touchTargetElementRef.nativeElement, 'mousedown')
      .pipe(takeUntil(this._destroy$))
      .subscribe((event: MouseEvent) => this.onMouseDown(event));
  }

  private onReset(): void {
    this.reset.emit();
  }

  private onTouchStart(startEvent: TouchEvent): void {
    this.installMoveListener({
        startEvent: startEvent,
        moveEventNames: ['touchmove'],
        endEventNames: ['touchend', 'touchcancel'],
        eventPositionFn: (touchEvent: TouchEvent): EventPosition => {
          const touch: Touch = touchEvent.touches[0];
          if (this.isVertical) {
            return {screenPos: touch.screenX, clientPos: touch.clientX, pagePos: touch.pageX};
          }
          else {
            return {screenPos: touch.screenY, clientPos: touch.clientY, pagePos: touch.pageY};
          }
        },
      },
    );
  }

  private onMouseDown(startEvent: MouseEvent): void {
    if (startEvent.button !== 0) {
      return;
    }

    this.installMoveListener({
        startEvent: startEvent,
        moveEventNames: ['mousemove', 'sci-mousemove'],
        endEventNames: ['mouseup', 'sci-mouseup'],
        eventPositionFn: (mouseEvent: MouseEvent): EventPosition => {
          if (this.isVertical) {
            return {screenPos: mouseEvent.screenX, clientPos: mouseEvent.clientX, pagePos: mouseEvent.pageX};
          }
          else {
            return {screenPos: mouseEvent.screenY, clientPos: mouseEvent.clientY, pagePos: mouseEvent.pageY};
          }
        },
      },
    );
  }

  private installMoveListener<EVENT extends Event>(config: {startEvent: EVENT; moveEventNames: string[]; endEventNames: string[]; eventPositionFn: (event: EVENT) => EventPosition}): void {
    const startEvent = config.startEvent;

    startEvent.preventDefault();

    this._zone.runOutsideAngular(() => {
      // install listeners on document level to allow fast dragging the splitter.
      const moveEvent$ = merge(...config.moveEventNames.map(eventName => fromEvent<EVENT>(this._document, eventName)));
      const endEvent$ = merge(...config.endEventNames.map(eventName => fromEvent<EVENT>(this._document, eventName)));
      let lastClientPos = config.eventPositionFn(startEvent).clientPos;

      // Apply cursor on document level to prevent flickering while moving the splitter
      const oldDocumentCursor = this._document.body.style.cursor;
      this._document.body.style.cursor = this.splitterCursor;

      // Listen for 'move' events until stop moving the splitter
      moveEvent$
        .pipe(
          tapFirst(() => this._zone.run(() => {
            this.moving = true;
            this.start.next();
            this._cd.markForCheck();
          })),
          takeUntil(merge(endEvent$, this._destroy$)),
        )
        .subscribe((moveEvent: EVENT) => {
          const eventPos = config.eventPositionFn(moveEvent);
          const newClientPos = eventPos.clientPos;
          const distance = newClientPos - lastClientPos;
          lastClientPos = newClientPos;

          NgZone.assertNotInAngularZone();
          this.move.emit({distance, position: eventPos});
        });

      // Listen for 'end' events; call 'stop propagation' to not close overlays
      endEvent$
        .pipe(first(), takeUntil(this._destroy$))
        .subscribe((endEvent: EVENT) => {
          endEvent.stopPropagation();
          this._document.body.style.cursor = oldDocumentCursor;
          this.moving && this._zone.run(() => {
            this.end.next();
            this.moving = false;
            this._cd.markForCheck();
          });
        });
    });
  }

  /* @docs-private */
  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}

export interface EventPosition {
  clientPos: number;
  pagePos: number;
  screenPos: number;
}

/**
 * Event that is emitted when moving the splitter.
 */
export interface SplitterMoveEvent {
  /**
   * The distance in pixels by which the user has moved the splitter since the last emission.
   */
  distance: number;
  /**
   * The position where the mouse or touch event has occurred.
   */
  position: EventPosition;
}
