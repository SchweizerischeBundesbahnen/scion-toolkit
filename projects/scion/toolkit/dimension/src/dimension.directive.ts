/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, ElementRef, EventEmitter, Input, NgZone, OnDestroy, OnInit, Output} from '@angular/core';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {captureElementDimension, Dimension, fromDimension$} from '@scion/toolkit/observable';

/**
 * Allows observing changes to host element's size.
 *
 * See {@link fromDimension$} Observable for more information.
 *
 * ---
 * Usage:
 *
 * <div sciDimension (sciDimensionChange)="onDimensionChange($event)"></div>
 */
@Directive({
  selector: '[sciDimension]',
  exportAs: 'sciDimension',
})
export class SciDimensionDirective implements OnInit, OnDestroy {

  private readonly _host: HTMLElement;
  private _destroy$ = new Subject<void>();

  /**
   * Upon subscription, it emits the host element's dimension, and then continuously emits when the dimension of the host element changes.
   */
  @Output('sciDimensionChange') // eslint-disable-line @angular-eslint/no-output-rename
  public dimensionChange = new EventEmitter<SciDimension>();

  /**
   * Controls if to emit a dimension change inside or outside of the Angular zone.
   * If emitted outside of the Angular zone no change detection cycle is triggered.
   *
   * By default, if not specified, emits inside the Angular zone.
   */
  @Input()
  public emitOutsideAngular = false;

  constructor(host: ElementRef<HTMLElement>, private _ngZone: NgZone) {
    this._host = host.nativeElement;
  }

  public ngOnInit(): void {
    this.installDimensionListener();
  }

  private installDimensionListener(): void {
    this._ngZone.runOutsideAngular(() => {
      fromDimension$(this._host)
        .pipe(takeUntil(this._destroy$))
        .subscribe((dimension: SciDimension) => {
          if (this.emitOutsideAngular) {
            this.dimensionChange.emit(dimension);
          }
          else {
            this._ngZone.run(() => this.dimensionChange.emit(dimension));
          }
        });
    });
  }

  /**
   * Returns the current dimension of its host element.
   */
  public get dimension(): SciDimension {
    return captureElementDimension(this._host);
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }
}

/**
 * Represents the dimension of an element.
 */
export type SciDimension = Dimension;
