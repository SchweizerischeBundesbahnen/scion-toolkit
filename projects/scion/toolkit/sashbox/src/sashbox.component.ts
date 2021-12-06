/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ContentChildren, ElementRef, EventEmitter, forwardRef, HostBinding, Input, NgZone, OnDestroy, Output, QueryList} from '@angular/core';
import {startWith, takeUntil} from 'rxjs/operators';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {SplitterMoveEvent} from '@scion/toolkit/splitter';
import {SciSashDirective} from './sash.directive';
import {SciSashBoxAccessor} from './sashbox-accessor';

/**
 * The <sci-sashbox> is like a CSS flexbox container that lays out its content children (sashes) in a row (which is by default)
 * or column arrangement (as specified by the direction property). A splitter is added between each child to allow the user to
 * shrink or stretch the individual sashes.
 *
 * Sashes are modelled as content children inside a <ng-template> decorated with the 'sciSash' directive.
 * A sash can have a fixed size with an explicit unit, or a unitless proportion to distibute remaining space.
 * A proportional sash has the ability to grow or shrink if necessary.
 *
 *
 * ### Usage:
 *
 * ```html
 * <sci-sashbox direction="row">
 *   <ng-template sciSash size="1">
 *     ...
 *   </ng-template>
 *
 *   <ng-template sciSash size="2">
 *     ...
 *   </ng-template>
 *
 *   <ng-template sciSash size="1">
 *     ...
 *   </ng-template>
 * </sci-sashbox>
 * ```
 *
 * ### Theme override:
 * The default style of the sashbox is made up of shades of gray.
 * You can control the appearance by overriding the following CSS variables:
 *
 * - --sci-sashbox-gap: Sets the gaps (gutters) between sashes.
 * - --sci-sashbox-splitter-bgcolor: Sets the background color of the splitter.
 * - --sci-sashbox-splitter-bgcolor_hover: Sets the background color of the splitter when hovering it.
 * - --sci-sashbox-splitter-size: Sets the size of the splitter along the main axis.
 * - --sci-sashbox-splitter-size_hover: Sets the size of the splitter along the main axis when hovering it.
 * - --sci-sashbox-splitter-touch-target-size: Sets the touch target size to move the splitter (accessibility).
 * - --sci-sashbox-splitter-cross-axis-size: Sets the splitter size along the cross axis.
 * - --sci-sashbox-splitter-border-radius: Sets the border radius of the splitter.
 * - --sci-sashbox-splitter-opacity_active: Sets the opacity of the splitter while the user moves the splitter.
 * - --sci-sashbox-splitter-opacity_hover: Sets the opacity of the splitter when hovering it.
 *
 * Example:
 *
 * ```scss
 * sci-sashbox {
 *   --sci-sashbox-splitter-bgcolor: black;
 *   --sci-sashbox-splitter-bgcolor_hover: black;
 * }
 * ```
 */
@Component({
  selector: 'sci-sashbox',
  templateUrl: './sashbox.component.html',
  styleUrls: ['./sashbox.component.scss'],
  providers: [{
    provide: SciSashBoxAccessor,
    useFactory: provideSashBoxAccessor,
    deps: [forwardRef(() => SciSashboxComponent)],
  }],
})
export class SciSashboxComponent implements OnDestroy {

  private _destroy$ = new Subject<void>();

  public sashes$ = new BehaviorSubject<SciSashDirective[]>([]);

  @HostBinding('class.sashing')
  public sashing = false;

  /**
   * Specifies if to lay out sashes in a row (which is by default) or column arrangement.
   */
  @Input()
  public direction: 'column' | 'row' = 'row';

  /**
   * Emits when start sashing.
   */
  @Output()
  public sashStart = new EventEmitter<void>();

  /**
   * Emits the absolute sash sizes (px) when finished sashing.
   */
  @Output()
  public sashEnd = new EventEmitter<number[]>();

  /** @internal */
  @ContentChildren(SciSashDirective)
  public set setSashes(queryList: QueryList<SciSashDirective>) {
    queryList.changes
      .pipe(
        startWith(queryList),
        takeUntil(this._destroy$),
      )
      .subscribe((sashes: QueryList<SciSashDirective>) => {
        this.sashes$.next(sashes.toArray());
      });
  }

  constructor(private _host: ElementRef<HTMLElement>, private _zone: NgZone) {
  }

  public onSashStart(): void {
    this.sashing = true;
    this.sashStart.emit();

    // set the effective sash size as the flex-basis for non-fixed sashes (as sashing operates on pixel deltas)
    this.sashes.forEach(sash => {
      if (!sash.isFixedSize) {
        sash.flexGrow = 0;
        sash.flexShrink = 0;
        sash.flexBasis = `${sash.computedSize}px`;
      }
    });
  }

  public onSashEnd(): void {
    this.sashing = false;

    // unset the flex-basis for non-fixed sashes and set the flex-grow accordingly
    const pixelToFlexGrowFactor = computePixelToFlexGrowFactor(this.sashes);
    const absoluteSashSizes = this.sashes.map(sash => sash.computedSize);

    this.sashes.forEach((sash, i) => {
      if (!sash.isFixedSize) {
        sash.flexGrow = pixelToFlexGrowFactor * absoluteSashSizes[i];
        sash.flexShrink = 1;
        sash.flexBasis = '0';
      }
    });
    this.sashEnd.emit(absoluteSashSizes);
  }

  public onSash(splitter: HTMLElement, sashIndex: number, moveEvent: SplitterMoveEvent): void {
    const distance = moveEvent.distance;
    if (distance === 0) {
      return;
    }

    NgZone.assertNotInAngularZone();

    // compute the splitter position
    const splitterRect = splitter.getBoundingClientRect();
    const splitterStart = (this.isRowDirection ? splitterRect.left : splitterRect.top);
    const splitterEnd = (this.isRowDirection ? splitterRect.left + splitterRect.width : splitterRect.top + splitterRect.height);

    // ignore the event if outside of the splitter's action scope
    const eventPos = moveEvent.position.clientPos;
    // i.e. the sash should not grow if moved the mouse pointer beyond the left bounds of the sash, and if now moving the mouse pointer back toward the current sash.
    if (distance > 0 && eventPos < splitterStart) {
      return;
    }

    // i.e. the sash should not shrink if moved the mouse pointer beyond the right bounds of the sash, and if now moving the mouse pointer back toward the current sash.
    if (distance < 0 && eventPos > splitterEnd) {
      return;
    }

    // compute the new sash sizes
    const sash1 = this.sashes[sashIndex];
    const sash2 = this.sashes[sashIndex + 1];

    const sashSize1 = sash1.computedSize;
    const sashSize2 = sash2.computedSize;
    const maxSashSize = sashSize1 + sashSize2;
    const computedNewSashSize1 = Math.round(sashSize1 + distance);
    const computedNewSashSize2 = Math.round(sashSize2 - distance);

    if (sash1.minSize !== undefined && distance < 0 && computedNewSashSize1 < this.toPixel(sash1.minSize)) {
      return;
    }
    if (sash2.minSize !== undefined && distance > 0 && computedNewSashSize2 < this.toPixel(sash2.minSize)) {
      return;
    }

    const validNewSashSize1 = between(computedNewSashSize1, {min: 0, max: maxSashSize});
    const validNewSashSize2 = between(computedNewSashSize2, {min: 0, max: maxSashSize});

    // continue only if both sashes adjacent to the splitter change their size (as the event would change other sashes otherwise)
    if (validNewSashSize1 !== computedNewSashSize1) {
      return;
    }
    if (validNewSashSize2 !== computedNewSashSize2) {
      return;
    }

    // set the new computed sash sizes
    this._zone.run(() => {
      sash1.flexBasis = `${computedNewSashSize1}px`;
      sash2.flexBasis = `${computedNewSashSize2}px`;
    });
  }

  public onSashReset(sashIndex: number): void {
    const sash1 = this.sashes[sashIndex];
    const sash2 = this.sashes[sashIndex + 1];
    const equalSashSize = (sash1.computedSize + sash2.computedSize) / 2;
    const pixelToFlexGrowFactor = computePixelToFlexGrowFactor(this.sashes);
    const absoluteSashSizesAfterReset = this.sashes.map((sash, index) => {
      if (index === sashIndex || index === sashIndex + 1) {
        return equalSashSize;
      }
      return sash.computedSize;
    });

    [sash1, sash2].forEach(sash => {
      if (sash.isFixedSize) {
        sash.flexBasis = `${equalSashSize}px`;
      }
      else {
        sash.flexGrow = pixelToFlexGrowFactor * equalSashSize;
      }
    });

    this.sashStart.emit();
    this.sashEnd.emit(absoluteSashSizesAfterReset);
  }

  @HostBinding('class.column')
  public get isColumnDirection(): boolean {
    return this.direction === 'column';
  }

  @HostBinding('class.row')
  public get isRowDirection(): boolean {
    return this.direction === 'row';
  }

  private get sashes(): SciSashDirective[] {
    return this.sashes$.value;
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
  }

  private toPixel(value: string | number): number {
    if (typeof value === 'number') {
      return value;
    }
    if (value.endsWith('%')) {
      const hostBounds = this._host.nativeElement.getBoundingClientRect();
      const hostSize = (this.isRowDirection ? hostBounds.width : hostBounds.height);
      return parseInt(value, 10) * hostSize / 100;
    }
    return parseInt(value, 10);
  }
}

function between(value: number, minmax: {min: number; max: number}): number {
  return Math.min(minmax.max, Math.max(minmax.min, value));
}

/**
 * Returns the factor to compute the flex-grow proportion from the pixel size of a sash.
 */
function computePixelToFlexGrowFactor(sashes: SciSashDirective[]): number {
  const flexibleSashes = sashes.filter(sash => !sash.isFixedSize);

  const proportionSum = flexibleSashes.reduce((sum, sash) => sum + Number(sash.size), 0);
  const pixelSum = flexibleSashes.reduce((sum, sash) => sum + sash.computedSize, 0);

  return proportionSum / pixelSum;
}

export function provideSashBoxAccessor(component: SciSashboxComponent): SciSashBoxAccessor {
  return new class implements SciSashBoxAccessor {

    public get direction(): 'column' | 'row' {
      return component.direction;
    }

    public get sashes$(): Observable<SciSashDirective[]> {
      return component.sashes$;
    }

    public get sashes(): SciSashDirective[] {
      return component.sashes$.value;
    }
  };
}
