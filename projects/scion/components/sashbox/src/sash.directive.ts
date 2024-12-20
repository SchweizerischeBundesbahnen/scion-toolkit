/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, Input, OnChanges, OnInit, SimpleChanges, TemplateRef} from '@angular/core';
import {SciSashBoxAccessor} from './sashbox-accessor';
import {BehaviorSubject, merge, Observable} from 'rxjs';
import {map, switchMap} from 'rxjs/operators';

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
export class SciSashDirective implements OnInit, OnChanges {

  private _size: string | number = '1';
  private _flexGrow$ = new BehaviorSubject<number>(0);

  /**
   * Specifies the sash size, either as fixed size with an explicit unit,
   * or as a unitless proportion to distibute remaining space. A proportional
   * sash has the ability to grow or shrink if necessary, and must be >= 1.
   *
   * If not set, remaining space is distributed equally.
   */
  @Input()
  public set size(size: string | number | null | undefined) {
    this._size = size ?? '1';
  }

  public get size(): string | number {
    return this._size;
  }

  /**
   * Specifies the minimal sash size in pixel or percent.
   * The min-size prevents the user from shrinking the sash below this minimal size.
   *
   * If the unit is omitted, the value is interpreted as a pixel value.
   */
  @Input()
  public minSize?: string | number | undefined;

  /**
   * @internal
   */
  public element!: HTMLElement;

  /**
   * @internal
   */
  public set flexGrow(flexGrow: number) {
    this._flexGrow$.next(flexGrow);
  }

  /**
   * @internal
   */
  public get flexGrow(): number {
    return this._flexGrow$.value;
  }

  /**
   * @internal
   */
  public flexShrink!: number;

  /**
   * @internal
   */
  public flexBasis!: string;

  /**
   * Normalized flex-grow proportion of this sash, which is a value >= 1.
   *
   * @internal
   */
  public flexGrowNormalized$: Observable<number>;

  constructor(public readonly sashTemplate: TemplateRef<void>, private _sashBoxAccessor: SciSashBoxAccessor) {
    this.flexGrowNormalized$ = this._sashBoxAccessor.sashes$
      .pipe(
        switchMap(sashes => merge(...sashes.map(sash => sash._flexGrow$))),
        map(() => this.normalizeFlexGrow(this.flexGrow)),
      );
  }

  public ngOnInit(): void {
    this.setFlexItemProperties();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.setFlexItemProperties();
  }

  /**
   * Returns if this sash has a fixed size, meaning that it has not the ability to grow or shrink if necessary.
   *
   * @internal
   */
  public get isFixedSize(): boolean {
    return Number.isNaN(+this.size);
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
    if (this.isFixedSize) {
      // fixed-sized sash
      this.flexGrow = 0;
      this.flexShrink = 0;
      this.flexBasis = `${this.size}`;
    }
    else {
      // remaining space is distributed according to given proportion
      const proportion = +this.size;
      if (proportion < 1) {
        throw Error(`[IllegalSashSizeError] The proportion for flexible sized sashes must be >=1 [size=${this.size}]`);
      }

      this.flexGrow = proportion;
      this.flexShrink = 1;
      this.flexBasis = '0';
    }
  }

  /**
   * Computes the normalized flex-grow proportion of the given sash, which is a value >= 1.
   *
   * If the sum of all flex-grow proportions would be less than 1, then, the sashes would not fill the entire sash-box space.
   * Without normalization in place, e.g., this could happen when removing a sash.
   */
  private normalizeFlexGrow(flexGrow: number): number {
    if (flexGrow === 0) {
      return 0;
    }

    const sashes = this._sashBoxAccessor.sashes;
    const flexGrowSum = sashes.reduce((sum, sash) => sum + sash.flexGrow, 0);
    if (flexGrowSum === 0) {
      return 0;
    }
    return flexGrow / flexGrowSum;
  }
}
