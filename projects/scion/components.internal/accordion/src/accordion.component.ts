/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectorRef, Component, contentChildren, DestroyRef, ElementRef, HostBinding, inject, input, OnInit, Signal, TrackByFunction, viewChild} from '@angular/core';
import {animate, AnimationMetadata, style, transition, trigger} from '@angular/animations';
import {SciAccordionItemDirective} from './accordion-item.directive';
import {CdkAccordion, CdkAccordionItem, CdkAccordionModule} from '@angular/cdk/accordion';
import {debounceTime} from 'rxjs/operators';
import {combineLatest} from 'rxjs';
import {NgClass, NgTemplateOutlet} from '@angular/common';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';
import {fromResize$} from '@scion/toolkit/observable';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

/**
 * Component that shows items in an accordion.
 *
 * An accordion item is contributed as content child in the form of a `<ng-template>` decorated with `sciAccordionItem` directive,
 * and its panel modelled in the form of a `<ng-template>` and given as input to its `sciAccordionItem` directive.
 *
 * Accordion panel content is added to a CSS grid container with a single column, filling remaining space vertically and horizontally.
 *
 * ---
 * Example of a simple accordion:
 *
 * <sci-accordion>
 *   @for (item of items$ | async; track item.id) {
 *     <!-- item -->
 *     <ng-template sciAccordionItem [key]="item.id" [panel]="panel">
 *       ...
 *     </ng-template>
 *
 *     <!-- item panel -->
 *     <ng-template #panel>
 *       ...
 *     </ng-template>
 *   }
 * </sci-accordion>
 */
@Component({
  selector: 'sci-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss'],
  imports: [
    NgClass,
    NgTemplateOutlet,
    CdkAccordionModule,
    SciMaterialIconDirective,
  ],
  animations: [
    trigger('enter', SciAccordionComponent.provideEnterAnimation()),
  ],
})
export class SciAccordionComponent implements OnInit {

  /**
   * Whether the accordion should allow multiple expanded accordion items simultaneously.
   */
  public readonly multi = input<boolean>(false);

  /**
   * Specifies the style of the accordion.
   */
  public readonly variant = input<'solid' | 'bubble'>('bubble');

  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;
  /** Workaround for setting the filled state on initialization: https://github.com/angular/angular/issues/22560#issuecomment-473958144 */
  private readonly _cd = inject(ChangeDetectorRef, {skipSelf: true});
  private readonly _destroyRef = inject(DestroyRef);
  private readonly _cdkAccordion: Signal<ElementRef<HTMLElement>> = viewChild.required(CdkAccordion, {read: ElementRef});

  protected readonly items = contentChildren(SciAccordionItemDirective);

  @HostBinding('class.bubble')
  protected get isBubbleVariant(): boolean {
    return this.variant() === 'bubble';
  }

  @HostBinding('class.solid')
  protected get isSolidVariant(): boolean {
    return this.variant() === 'solid';
  }

  @HostBinding('class.filled')
  protected filled = false;

  public ngOnInit(): void {
    this.computeFilledStateOnDimensionChange();
  }

  protected trackByFn: TrackByFunction<SciAccordionItemDirective> = (index: number, item: SciAccordionItemDirective): any => {
    return item.key() ?? item;
  };

  protected onToggle(item: CdkAccordionItem): void {
    item.toggle();
  }

  /**
   * Computes whether this accordion fills the boundaries of this component.
   * It does this on each dimension change and sets the CSS class 'filled'
   * accordingly.
   */
  private computeFilledStateOnDimensionChange(): void {
    combineLatest([
      fromResize$(this._host),
      fromResize$(this._cdkAccordion().nativeElement),
    ])
      .pipe(
        debounceTime(5), // debounce dimension changes because the animation for expanding/collapsing a panel continuously emits resize events.
        takeUntilDestroyed(this._destroyRef),
      )
      .subscribe(() => {
        this.filled = this._host.clientHeight <= this._cdkAccordion().nativeElement.offsetHeight;
        this._cd.detectChanges();
      });
  }

  /**
   * Returns animation metadata to expand accordion panel.
   */
  private static provideEnterAnimation(): AnimationMetadata[] {
    return [
      transition(':enter', [
        style({opacity: 0, height: 0, overflow: 'hidden'}),
        animate('125ms ease-out', style({opacity: 1, height: '*'})),
      ]),
    ];
  }
}
