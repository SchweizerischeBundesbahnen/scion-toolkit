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
import {Defined} from '@scion/toolkit/util';

/**
 * Use this directive to model an accordion item for {SciAccordionComponent}.
 * The host element of this modelling directive must be a <ng-template>.
 *
 * ---
 * Example usage:
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
@Directive({selector: 'ng-template[sciAccordionItem]', standalone: true})
export class SciAccordionItemDirective implements OnInit, OnChanges {

  /**
   * Optional key to identify this item and is used as key for the {TrackBy} function.
   */
  @Input()
  public key?: string;

  /**
   * Provide template(s) to be rendered as actions of this list item.
   */
  @Input()
  public panel!: TemplateRef<void>;

  /**
   * Indicates whether to expand this item.
   */
  @Input()
  public expanded?: boolean;

  /**
   * Specifies CSS class(es) added to the <section> and <wb-view> elements, e.g. used for e2e testing.
   */
  @Input()
  public cssClass?: string | string[];

  constructor(public readonly template: TemplateRef<void>) {
  }

  public ngOnInit(): void {
    this.assertInputProperties();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.assertInputProperties();
  }

  private assertInputProperties(): void {
    Defined.orElseThrow(this.panel, () => Error('[NullInputError] Missing required input: `panel`.'));
  }
}
