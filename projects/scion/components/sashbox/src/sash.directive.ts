/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {computed, Directive, inject, input, linkedSignal, signal, Signal, TemplateRef, WritableSignal} from '@angular/core';
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
  public readonly minSize = input<string | number | undefined>();

  /**
   * Optional key to identify this sash.
   *
   * If set, this key is used as the property key in the object emitted by {@link SciSashboxComponent.sashEnd2} to associate the size of this sash.
   */
  public readonly key = input<string | undefined>();

  /**
   * Represents the template used as sash content.
   *
   * @internal
   */
  public readonly sashTemplate = inject<TemplateRef<void>>(TemplateRef);
  private readonly _sashBoxAccessor = inject(SciSashBoxAccessor);

  /**
   * Flex properties computed based on the configured {@link size}. Properties are updated when moving this sash.
   */
  private readonly _flexProperties = this.computeFlexProperties();

  /**
   * Flex properties with normalized 'flex-grow' to ensure the sashes fill the entire sash-box space.
   *
   * Use these properties to lay out this sash in the sashbox's flex layout.
   *
   * @internal
   */
  public readonly flexProperties = this.normalizeFlexGrow(this._flexProperties);

  /**
   * Returns if this sash has a fixed size, meaning that it has not the ability to grow or shrink.
   *
   * @internal
   */
  public readonly isFixedSize = computed(() => Number.isNaN(+this.size()));

  /**
   * Gets the DOM element that renders this sash.
   *
   * @internal
   */
  public readonly element = signal<HTMLElement | undefined>(undefined);

  /**
   * Gets the effective size of this sash in the DOM.
   *
   * @internal
   */
  public get elementSize(): number {
    const element = this.element();
    if (!element) {
      return 0;
    }
    if (this._sashBoxAccessor.direction() === 'row') {
      return element.getBoundingClientRect().width;
    }
    else {
      return element.getBoundingClientRect().height;
    }
  }

  /**
   * Returns the identity of this sash, or the passed index if not configured.
   *
   * @internal
   */
  public computeKey(index: number): string {
    return this.key() ?? `${index}`;
  }

  /**
   * Updates the flex properties of this sash for layout in the sashbox's flex layout.
   *
   * @internal
   */
  public updateFlexProperties(flexProperties: Partial<FlexProperties>): void {
    this._flexProperties.update(previousFlexProperties => ({...previousFlexProperties, ...flexProperties}));
  }

  /**
   * Computes the flex properties to lay out this sash in the sashbox's flex layout based on the configured {@link size}.
   */
  private computeFlexProperties(): WritableSignal<FlexProperties> {
    return linkedSignal(() => {
      const size = this.size();
      if (this.isFixedSize()) {
        // fixed-sized sash
        return {
          flexGrow: 0,
          flexShrink: 0,
          flexBasis: `${size}`,
        };
      }
      else {
        // remaining space is distributed according to given proportion
        const proportion = +size;
        if (proportion < 1) {
          throw Error(`[IllegalSashSizeError] The proportion for flexible sized sashes must be >=1 [size=${this.size()}]`);
        }
        return {
          flexGrow: proportion,
          flexShrink: 1,
          flexBasis: '0',
        };
      }
    });
  }

  /**
   * Normalizes the 'flex-grow' of the passed {@link FlexProperties} to ensure that the sum of the 'flex-grow' proportions of all sashes is 1.
   *
   * If the sum of all flex-grow proportions were less than 1, the sashes would not fill the entire sash-box space.
   * Without normalization, this could occur when a sash is removed.
   */
  private normalizeFlexGrow(flexProperties: Signal<FlexProperties>): Signal<FlexProperties> {
    return computed(() => {
      const sashes = this._sashBoxAccessor.sashes();
      const {flexGrow, flexShrink, flexBasis} = flexProperties();
      const flexGrowSum = sashes.reduce((sum, sash) => sum + sash._flexProperties().flexGrow, 0);

      return {
        flexGrow: flexGrow === 0 || flexGrowSum === 0 ? 0 : flexGrow / flexGrowSum, // Sum of normalized flex-grow proportions must be 1;
        flexShrink,
        flexBasis,
      };
    });
  }
}

/**
 * Flex properties to lay out the sash in the sashbox's flex layout.
 */
interface FlexProperties {
  flexGrow: number;
  flexShrink: number;
  flexBasis: string;
}
