/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Component, ContentChildren, HostBinding, Input, QueryList, TrackByFunction, ViewChild } from '@angular/core';
import { animate, AnimationMetadata, style, transition, trigger } from '@angular/animations';
import { SciAccordionItemDirective } from './accordion-item.directive';
import { SciViewportComponent } from '@scion/toolkit/viewport';
import { CdkAccordionItem } from '@angular/cdk/accordion';

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
 *   <ng-container *ngFor="let communication of communications$ | async; trackBy: trackByFn">
 *     <!-- item -->
 *     <ng-template sciAccordionItem [key]="communication.id" [panel]="panel">
 *       ...
 *     </ng-template>
 *
 *     <!-- item panel -->
 *     <ng-template #panel>
 *       ...
 *     </ng-template>
 *   </ng-container>
 * </sci-accordion>
 */
@Component({
  selector: 'sci-accordion',
  templateUrl: './accordion.component.html',
  styleUrls: ['./accordion.component.scss'],
  animations: [
    trigger('enter', SciAccordionComponent.provideEnterAnimation()),
  ],
})
export class SciAccordionComponent {

  @HostBinding('class.bubble')
  public get isBubbleVariant(): boolean {
    return this.variant === 'bubble';
  }

  @HostBinding('class.solid')
  public get isSolidVariant(): boolean {
    return this.variant === 'solid';
  }

  @ViewChild(SciViewportComponent, {static: true})
  private _viewport: SciViewportComponent;

  @ContentChildren(SciAccordionItemDirective)
  public items: QueryList<SciAccordionItemDirective>;

  /**
   * Whether the accordion should allow multiple expanded accordion items simultaneously.
   */
  @Input()
  public multi: boolean;

  /**
   * Specifies the style of the accordion.
   */
  @Input()
  public variant: 'solid' | 'bubble' = 'bubble';

  public trackByFn: TrackByFunction<SciAccordionItemDirective> = (index: number, item: SciAccordionItemDirective): any => {
    return item.key || item;
  };

  public onToggle(item: CdkAccordionItem, section: HTMLElement): void {
    item.toggle();
    item.expanded && setTimeout(() => this._viewport.scrollIntoView(section));
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

