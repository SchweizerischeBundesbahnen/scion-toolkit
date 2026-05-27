/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectorRef, Component, computed, DestroyRef, DOCUMENT, effect, ElementRef, inject, input, NgZone, output, signal, untracked, viewChild} from '@angular/core';
import {audit, fromEvent, merge, Observable, Subscription} from 'rxjs';
import {tapFirst} from '@scion/toolkit/operators';
import {first, takeUntil} from 'rxjs/operators';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

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
  host: {
    '[class.moving]': 'moving()',
    '[class.horizontal]': 'isHorizontal()',
    '[class.vertical]': 'isVertical()',
    '[style.cursor]': 'splitterCursor()',
  },
})
export class SciSplitterComponent {

  /**
   * Controls whether to render a vertical or horizontal splitter. By default, if not specified, renders a vertical splitter.
   */
  public readonly orientation = input<'vertical' | 'horizontal'>('vertical');

  /**
   * Notifies when start moving the splitter.
   */
  public readonly start = output<void>(); // eslint-disable-line @angular-eslint/no-output-native

  /**
   * Notifies when moving the splitter. The event is emitted outside the Angular zone.
   */
  public readonly move = output<SplitterMoveEvent>();

  /**
   * Notifies when end moving the splitter.
   */
  public readonly end = output<void>();

  /**
   * Notifies when resetting the splitter position.
   */
  public readonly reset = output<void>(); // eslint-disable-line @angular-eslint/no-output-native

  private readonly _zone = inject(NgZone);
  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _document = inject(DOCUMENT);
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _touchTarget = viewChild.required<ElementRef<HTMLElement>>('touch_target');

  protected readonly moving = signal(false);
  protected readonly isHorizontal = computed(() => this.orientation() === 'horizontal');
  protected readonly isVertical = computed(() => !this.isHorizontal());
  protected readonly splitterCursor = computed(() => this.isVertical() ? 'ew-resize' : 'ns-resize');

  constructor() {
    effect(onCleanup => {
      const touchTargetElement = this._touchTarget().nativeElement;
      const subscription = new Subscription();

      untracked(() => {
        subscription.add(fromEvent(touchTargetElement, 'dblclick').subscribe(() => this.onReset()));
        subscription.add(fromEvent<TouchEvent>(touchTargetElement, 'touchstart').subscribe((event: TouchEvent) => this.onTouchStart(event)));
        subscription.add(fromEvent<MouseEvent>(touchTargetElement, 'mousedown').subscribe((event: MouseEvent) => this.onMouseDown(event)));
      });

      onCleanup(() => subscription.unsubscribe());
    });
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
        const touch: Touch = touchEvent.touches[0]!;
        if (this.isVertical()) {
          return {screenPos: touch.screenX, clientPos: touch.clientX, pagePos: touch.pageX};
        }
        else {
          return {screenPos: touch.screenY, clientPos: touch.clientY, pagePos: touch.pageY};
        }
      },
    });
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
        if (this.isVertical()) {
          return {screenPos: mouseEvent.screenX, clientPos: mouseEvent.clientX, pagePos: mouseEvent.pageX};
        }
        else {
          return {screenPos: mouseEvent.screenY, clientPos: mouseEvent.clientY, pagePos: mouseEvent.pageY};
        }
      },
    });
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
      this._document.body.style.cursor = this.splitterCursor();

      // Listen for 'move' events until stop moving the splitter
      moveEvent$
        .pipe(
          tapFirst(() => this._zone.run(() => {
            this.moving.set(true);
            this.start.emit();
            this._cd.markForCheck();
          })),
          // Throttle emission to a single event per animation frame.
          audit(() => nextAnimationFrame$()),
          takeUntilDestroyed(this._destroyRef),
          takeUntil(endEvent$),
        )
        .subscribe((moveEvent: EVENT) => {
          NgZone.assertNotInAngularZone();

          const eventPos = config.eventPositionFn(moveEvent);
          const newClientPos = eventPos.clientPos;
          const distance = newClientPos - lastClientPos;
          lastClientPos = newClientPos;

          this.move.emit({distance, position: eventPos});
        });

      // Listen for 'end' events; call 'stop propagation' to not close overlays
      endEvent$
        .pipe(
          first(),
          takeUntilDestroyed(this._destroyRef),
        )
        .subscribe((endEvent: EVENT) => {
          endEvent.stopPropagation();
          this._document.body.style.cursor = oldDocumentCursor;
          this.moving() && this._zone.run(() => {
            this.end.emit();
            this.moving.set(false);
            this._cd.markForCheck();
          });
        });
    });
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

/**
 * Emits when the next animation frame is executed.
 *
 * Unlike using `timer(0, animationFrameScheduler)`, this observable emits within the zone where it is subscribed.
 *
 * Note that the RxJS `animationFrameScheduler` may not necessarily execute in the current execution context, such as inside or outside Angular.
 * The scheduler always executes tasks in the zone where it was first used in the application.
 */
function nextAnimationFrame$(): Observable<void> {
  return new Observable<void>(observer => {
    const animationFrame = requestAnimationFrame(() => observer.next());
    return () => cancelAnimationFrame(animationFrame);
  });
}
