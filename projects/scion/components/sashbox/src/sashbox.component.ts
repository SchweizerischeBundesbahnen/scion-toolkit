/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ContentChildren, ElementRef, EventEmitter, HostBinding, inject, Input, NgZone, OnDestroy, Output, QueryList} from '@angular/core';
import {startWith, takeUntil} from 'rxjs/operators';
import {BehaviorSubject, Observable, Subject} from 'rxjs';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {SciSashDirective} from './sash.directive';
import {SciSashBoxAccessor} from './sashbox-accessor';
import {AsyncPipe, NgTemplateOutlet} from '@angular/common';
import {SciSashInitializerDirective} from './sash-initializer.directive';
import {SciElementRefDirective} from './element-ref.directive';

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
 * ### Usage
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
 * ### Styling
 *
 * To customize the default look of SCION components or support different themes, configure the `@scion/components` SCSS module in `styles.scss`.
 * To style a specific `sci-sashbox` component, the following CSS variables can be set directly on the component.
 *
 * - --sci-sashbox-gap: Sets the gaps (gutters) between sashes.
 * - --sci-sashbox-splitter-background-color: Sets the background color of the splitter.
 * - --sci-sashbox-splitter-background-color-hover: Sets the background color of the splitter when hovering it.
 * - --sci-sashbox-splitter-size: Sets the size of the splitter along the main axis.
 * - --sci-sashbox-splitter-size-hover: Sets the size of the splitter along the main axis when hovering it.
 * - --sci-sashbox-splitter-touch-target-size: Sets the touch target size to move the splitter (accessibility).
 * - --sci-sashbox-splitter-cross-axis-size: Sets the splitter size along the cross axis.
 * - --sci-sashbox-splitter-border-radius: Sets the border radius of the splitter.
 * - --sci-sashbox-splitter-opacity-active: Sets the opacity of the splitter while the user moves the splitter.
 * - --sci-sashbox-splitter-opacity-hover: Sets the opacity of the splitter when hovering it.
 *
 * Example:
 *
 * ```scss
 * sci-sashbox {
 *   --sci-sashbox-splitter-background-color: black;
 *   --sci-sashbox-splitter-background-color-hover: black;
 * }
 * ```
 */
@Component({
  selector: 'sci-sashbox',
  templateUrl: './sashbox.component.html',
  styleUrls: ['./sashbox.component.scss'],
  standalone: true,
  imports: [
    AsyncPipe,
    NgTemplateOutlet,
    SciSashInitializerDirective,
    SciSplitterComponent,
    SciElementRefDirective,
  ],
  providers: [{
    provide: SciSashBoxAccessor,
    useFactory: provideSashBoxAccessor,
  }],
})
export class SciSashboxComponent implements OnDestroy {

  private _destroy$ = new Subject<void>();
  private _host = inject(ElementRef<HTMLElement>).nativeElement;
  private _zone = inject(NgZone);

  public sashes$ = new BehaviorSubject<SciSashDirective[]>([]);

  @HostBinding('class.sashing')
  public sashing = false;

  @HostBinding('style.--ɵsci-sashbox-max-height')
  public maxHeight: number | undefined;

  @HostBinding('style.--ɵsci-sashbox-max-width')
  public maxWidth: number | undefined;

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

  public onSashStart(): void {
    this.sashing = true;

    // Avoid overflow when sashing.
    const hostBounds = this._host.getBoundingClientRect();
    this.maxHeight = hostBounds.height;
    this.maxWidth = hostBounds.width;
    this.sashStart.emit();

    // set the effective sash size as the flex-basis for non-fixed sashes (as sashing operates on pixel deltas)
    this.sashes.forEach(sash => {
      if (!sash.isFixedSize) {
        sash.flexGrow = 0;
        sash.flexShrink = 1;
        sash.flexBasis = `${sash.computedSize}px`;
      }
    });
  }

  public onSashEnd(): void {
    this.sashing = false;
    this.maxHeight = undefined;
    this.maxWidth = undefined;

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

    const sashMinSize1 = sash1.minSize ? this.toPixel(sash1.minSize) : 0;
    const sashMinSize2 = sash2.minSize ? this.toPixel(sash2.minSize) : 0;

    const newSashSize1 = between(Math.round(sashSize1 + distance), {min: sashMinSize1, max: sashSize1 + sashSize2 - sashMinSize2});
    const newSashSize2 = between(Math.round(sashSize2 - distance), {min: sashMinSize2, max: sashSize1 + sashSize2 - sashMinSize1});

    // set the new computed sash sizes
    this._zone.run(() => {
      sash1.flexBasis = `${newSashSize1}px`;
      sash2.flexBasis = `${newSashSize2}px`;
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
      const hostBounds = this._host.getBoundingClientRect();
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

function provideSashBoxAccessor(): SciSashBoxAccessor {
  const component = inject(SciSashboxComponent);

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
