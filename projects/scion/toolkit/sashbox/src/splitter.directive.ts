/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, EventEmitter, HostBinding, HostListener, Inject, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges} from '@angular/core';
import {fromEvent, merge, Subject} from 'rxjs';
import {first, takeUntil} from 'rxjs/operators';
import {DOCUMENT} from '@angular/common';
import {tapFirst} from '@scion/toolkit/operators';

/**
 * Visual element to resize sashes.
 *
 * @dynamic ignore 'strictMetadataEmit' errors due to the usage of {@link Document} as ambient type for DI.
 */
@Directive({selector: '[sciSplitter]', exportAs: 'sciSplitter'})
export class SciSplitterDirective implements OnChanges, OnDestroy {

  private _destroy$ = new Subject<void>();

  @HostBinding('class.moving')
  public moving = false;

  @Input('sciSplitterVertical')
  public vertical!: boolean;

  /**
   * Emits when starting to move the splitter.
   */
  @Output('sciSplitterStart')
  public start = new EventEmitter<void>(); // eslint-disable-line @angular-eslint/no-output-native

  /**
   * Emits the delta in pixel when the splitter is moved.
   * The event is emitted outside of the Angular zone.
   */
  @Output('sciSplitterMove')
  public move = new EventEmitter<SplitterMoveEvent>();

  /**
   * Emits when ending to move the splitter.
   */
  @Output('sciSplitterEnd')
  public end = new EventEmitter<void>(); // eslint-disable-line @angular-eslint/no-output-native

  /**
   * Emits when to reset the splitter position.
   */
  @Output('sciSplitterReset')
  public reset = new EventEmitter<void>(); // eslint-disable-line @angular-eslint/no-output-native

  @HostBinding('style.cursor')
  public sashCursor!: string;

  constructor(private _zone: NgZone, @Inject(DOCUMENT) private _document: Document) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.sashCursor = this.vertical ? 'ew-resize' : 'ns-resize';
  }

  @HostListener('dblclick')
  public onDoubleClick(): void {
    this.reset.emit();
  }

  @HostListener('touchstart', ['$event'])
  public onTouchStart(startEvent: TouchEvent): void {
    this.installMoveListener({
        startEvent: startEvent,
        moveEventNames: ['touchmove'],
        endEventNames: ['touchend', 'touchcancel'],
        eventPositionFn: (touchEvent: TouchEvent): EventPosition => {
          const touch: Touch = touchEvent.touches[0];
          if (this.vertical) {
            return {screenPos: touch.screenX, clientPos: touch.clientX, pagePos: touch.pageX};
          }
          else {
            return {screenPos: touch.screenY, clientPos: touch.clientY, pagePos: touch.pageY};
          }
        },
      },
    );
  }

  @HostListener('mousedown', ['$event'])
  public onMouseDown(startEvent: MouseEvent): void {
    if (startEvent.button !== 0) {
      return;
    }

    this.installMoveListener({
        startEvent: startEvent,
        moveEventNames: ['mousemove', 'sci-mousemove'],
        endEventNames: ['mouseup', 'sci-mouseup'],
        eventPositionFn: (mouseEvent: MouseEvent): EventPosition => {
          if (this.vertical) {
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
      // install listeners on document level to allow dragging outside of the sash box.
      const moveEvent$ = merge(...config.moveEventNames.map(eventName => fromEvent<EVENT>(this._document, eventName)));
      const endEvent$ = merge(...config.endEventNames.map(eventName => fromEvent<EVENT>(this._document, eventName)));
      let lastClientPos = config.eventPositionFn(startEvent).clientPos;

      // Apply cursor on document level to prevent flickering while moving the splitter
      const oldDocumentCursor = this._document.body.style.cursor;
      this._document.body.style.cursor = this.sashCursor;

      // Listen for 'move' events until stop moving the splitter
      moveEvent$
        .pipe(
          tapFirst(() => this._zone.run(() => {
            this.moving = true;
            this.start.next();
          })),
          takeUntil(merge(endEvent$, this._destroy$)),
        )
        .subscribe((moveEvent: EVENT) => {
          const eventPos = config.eventPositionFn(moveEvent);
          const newClientPos = eventPos.clientPos;
          const delta = newClientPos - lastClientPos;
          lastClientPos = newClientPos;

          this.move.emit({delta: delta, position: eventPos});
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
          });
        });
    });
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}

export interface EventPosition {
  clientPos: number;
  pagePos: number;
  screenPos: number;
}

export interface SplitterMoveEvent {
  delta: number;
  position: EventPosition;
}
