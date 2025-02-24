/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, contentChildren, ElementRef, HostBinding, inject, input, NgZone, output} from '@angular/core';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {SciSashDirective} from './sash.directive';
import {SciSashBoxAccessor} from './sashbox-accessor';
import {NgTemplateOutlet} from '@angular/common';
import {SciSashInitializerDirective} from './sash-initializer.directive';
import {SciElementRefDirective} from './element-ref.directive';

/**
 * The <sci-sashbox> is like a CSS flexbox container that lays out its content children (sashes) in a row (which is by default)
 * or column arrangement (as specified by the direction property). A splitter is added between each child to allow the user to
 * shrink or stretch the individual sashes.
 *
 * Sashes are modelled as <ng-template> decorated with the 'sciSash' directive.
 * A sash can have a fixed size with an explicit unit, or a unitless proportion to distribute remaining space.
 * A proportional sash has the ability to grow or shrink if necessary.
 *
 * Sash content is added to a CSS grid container with a single column, stretching the content vertically and horizontally.
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
  imports: [
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
export class SciSashboxComponent {

  /**
   * Specifies if to lay out sashes in a row (which is by default) or column arrangement.
   */
  public readonly direction = input<'column' | 'row'>('row');

  /**
   * Notifies when start sashing.
   */
  public readonly sashStart = output<void>();

  /**
   * Notifies when end sashing, providing the effective sash sizes in pixel.
   */
  public readonly sashEnd = output<number[]>();

  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;

  /** @internal */
  public readonly sashes = contentChildren(SciSashDirective);

  @HostBinding('class.sashing')
  protected sashing = false;

  @HostBinding('style.--ɵsci-sashbox-max-height')
  protected maxHeight: number | undefined;

  @HostBinding('style.--ɵsci-sashbox-max-width')
  protected maxWidth: number | undefined;

  protected onSashStart(): void {
    this.sashing = true;

    // Avoid overflow when sashing.
    const hostBounds = this._host.getBoundingClientRect();
    this.maxHeight = hostBounds.height;
    this.maxWidth = hostBounds.width;
    this.sashStart.emit();

    // Set the effective sash size as the flex-basis for non-fixed sashes (as sashing operates on pixel deltas).
    this.sashes().forEach(sash => {
      if (!sash.isFixedSize()) {
        sash.updateFlexProperties({
          flexGrow: 0,
          flexShrink: 1,
          flexBasis: `${sash.elementSize}px`,
        });
      }
    });
  }

  protected onSashEnd(): void {
    this.sashing = false;
    this.maxHeight = undefined;
    this.maxWidth = undefined;

    // Unset the flex-basis for non-fixed sashes and set the flex-grow accordingly.
    const pixelToFlexGrowFactor = computePixelToFlexGrowFactor(this.sashes());
    const absoluteSashSizes = this.sashes().map(sash => sash.elementSize);

    this.sashes().forEach((sash, i) => {
      if (!sash.isFixedSize()) {
        sash.updateFlexProperties({
          flexGrow: pixelToFlexGrowFactor * absoluteSashSizes[i],
          flexShrink: 1,
          flexBasis: '0',
        });
      }
    });
    this.sashEnd.emit(absoluteSashSizes);
  }

  protected onSash(splitter: HTMLElement, sashIndex: number, moveEvent: SplitterMoveEvent): void {
    NgZone.assertNotInAngularZone();

    const distance = moveEvent.distance;
    if (distance === 0) {
      return;
    }

    // Compute the splitter position.
    const splitterRect = splitter.getBoundingClientRect();
    const splitterStart = (this.isRowDirection ? splitterRect.left : splitterRect.top);
    const splitterEnd = (this.isRowDirection ? splitterRect.left + splitterRect.width : splitterRect.top + splitterRect.height);

    // Ignore the event if outside the splitter's action scope.
    const eventPos = moveEvent.position.clientPos;
    // The sash should not grow after moved the mouse pointer beyond the left bounds of the sash and now moving the mouse pointer back toward the current sash.
    if (distance > 0 && eventPos < splitterStart) {
      return;
    }

    // The sash should not shrink after moved the mouse pointer beyond the right bounds of the sash and now moving the mouse pointer back toward the current sash.
    if (distance < 0 && eventPos > splitterEnd) {
      return;
    }

    // Compute the new sash sizes.
    const sash1 = this.sashes()[sashIndex]!;
    const sash2 = this.sashes()[sashIndex + 1]!;

    const sashSize1 = sash1.elementSize;
    const sashSize2 = sash2.elementSize;

    const sashMinSize1 = sash1.minSize() ? this.toPixel(sash1.minSize()!) : 0;
    const sashMinSize2 = sash2.minSize() ? this.toPixel(sash2.minSize()!) : 0;

    const newSashSize1 = between(Math.round(sashSize1 + distance), {min: sashMinSize1, max: sashSize1 + sashSize2 - sashMinSize2});
    const newSashSize2 = between(Math.round(sashSize2 - distance), {min: sashMinSize2, max: sashSize1 + sashSize2 - sashMinSize1});

    // Set the new computed sash sizes.
    sash1.updateFlexProperties({flexBasis: `${newSashSize1}px`});
    sash2.updateFlexProperties({flexBasis: `${newSashSize2}px`});
  }

  protected onSashReset(sashIndex: number): void {
    const sash1 = this.sashes()[sashIndex]!;
    const sash2 = this.sashes()[sashIndex + 1]!;
    const equalSashSize = (sash1.elementSize + sash2.elementSize) / 2;
    const pixelToFlexGrowFactor = computePixelToFlexGrowFactor(this.sashes());
    const absoluteSashSizesAfterReset = this.sashes().map((sash, index) => {
      if (index === sashIndex || index === sashIndex + 1) {
        return equalSashSize;
      }
      return sash.elementSize;
    });

    [sash1, sash2].forEach(sash => {
      if (sash.isFixedSize()) {
        sash.updateFlexProperties({flexBasis: `${equalSashSize}px`});
      }
      else {
        sash.updateFlexProperties({flexGrow: pixelToFlexGrowFactor * equalSashSize});
      }
    });

    this.sashStart.emit();
    this.sashEnd.emit(absoluteSashSizesAfterReset);
  }

  @HostBinding('class.column')
  protected get isColumnDirection(): boolean {
    return this.direction() === 'column';
  }

  @HostBinding('class.row')
  protected get isRowDirection(): boolean {
    return this.direction() === 'row';
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
function computePixelToFlexGrowFactor(sashes: readonly SciSashDirective[]): number {
  const flexibleSashes = sashes.filter(sash => !sash.isFixedSize());

  const proportionSum = flexibleSashes.reduce((sum, sash) => sum + Number(sash.size()), 0);
  const pixelSum = flexibleSashes.reduce((sum, sash) => sum + sash.elementSize, 0);

  return proportionSum / pixelSum;
}

function provideSashBoxAccessor(): SciSashBoxAccessor {
  const component = inject(SciSashboxComponent);

  return new class implements SciSashBoxAccessor {
    public readonly direction = component.direction;
    public readonly sashes = component.sashes;
  }();
}
