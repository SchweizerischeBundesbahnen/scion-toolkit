/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, Directive, effect, inject, input, signal, TemplateRef} from '@angular/core';
import {SciSashBoxAccessor} from './sashbox-accessor';

/**
 * Use this directive to model a sash for {@link SciSashboxComponent}.
 * The host element of this modelling directive must be a <ng-template> which is used as sash template.
 *
 *
 * ### Usage:
 *
 * <sci-sashbox direction="row">
 *   <!-- fixed size sash -->
 *   <ng-template sciSash size="200px">
 *     ...
 *   </ng-template>
 *
 *   <!-- sash which takes the remaining space -->
 *   <ng-template sciSash>
 *     ...
 *   </ng-template>
 * </sci-sashbox>
 */
@Directive({
  selector: 'ng-template[sciSash]',
  exportAs: 'sciSash',
})
export class SciSashDirective {

  private readonly _sashBoxAccessor = inject(SciSashBoxAccessor);

  public readonly sashTemplate = inject<TemplateRef<void>>(TemplateRef);

  /**
   * Specifies the sash size, either as fixed size with an explicit unit,
   * or as a unitless proportion to distribute remaining space. A proportional
   * sash has the ability to grow or shrink if necessary, and must be >= 1.
   *
   * If not set, remaining space is distributed equally.
   */
  public readonly size = input('1', {transform: (size: string | number | null | undefined): string | number => size ?? '1'});

  /**
   * Specifies the minimal sash size in pixel or percent.
   * The min-size prevents the user from shrinking the sash below this minimal size.
   *
   * If the unit is omitted, the value is interpreted as a pixel value.
   */
  public readonly minSize = input<string | number>();

  public readonly isFixedSize = computed(() => Number.isNaN(+this.size()));

  /**
   * @internal
   */
  public readonly flexGrow = signal<number>(0);

  /**
   * Normalized flex-grow proportion of this sash, which is a value >= 1.
   *
   * @internal
   */
  public readonly flexGrowNormalized = computed(() => this.normalizeFlexGrow());

  /**
   * @internal
   */
  public element!: HTMLElement;

  /**
   * @internal
   */
  public flexShrink!: number;

  /**
   * @internal
   */
  public flexBasis!: string;

  constructor() {
    this.setFlexItemProperties();
  }

  /**
   * Returns the effective sash size as rendered in the DOM.
   *
   * @internal
   */
  public get computedSize(): number {
    // Note: Use `boundingClientRect` to get the fractional size.
    // see https://developer.mozilla.org/en-US/docs/Web/API/Element/clientWidth
    return this._sashBoxAccessor.direction === 'row' ? this.element.getBoundingClientRect().width : this.element.getBoundingClientRect().height;
  }

  /**
   * Computes and sets the flex item properties based on the modelled size.
   */
  private setFlexItemProperties(): void {
    effect(() => {
      const size = this.size();
      if (this.isFixedSize()) {
        // fixed-sized sash
        this.flexGrow.set(0);
        this.flexShrink = 0;
        this.flexBasis = `${size}`;
      }
      else {
        // remaining space is distributed according to given proportion
        const proportion = +size;
        if (proportion < 1) {
          throw Error(`[IllegalSashSizeError] The proportion for flexible sized sashes must be >=1 [size=${this.size()}]`);
        }

        this.flexGrow.set(proportion);
        this.flexShrink = 1;
        this.flexBasis = '0';
      }
    });
  }

  /**
   * Computes the normalized flex-grow proportion of the given sash, which is a value >= 1.
   *
   * If the sum of all flex-grow proportions would be less than 1, then, the sashes would not fill the entire sash-box space.
   * Without normalization in place, e.g., this could happen when removing a sash.
   */
  private normalizeFlexGrow(): number {
    const flexGrow = this.flexGrow();
    const sashes = this._sashBoxAccessor.sashes();
    const flexGrowSum = sashes.reduce((sum, sash) => sum + sash.flexGrow(), 0);

    return flexGrow === 0 || flexGrowSum === 0 ? 0 : flexGrow / flexGrowSum;
  }
}
