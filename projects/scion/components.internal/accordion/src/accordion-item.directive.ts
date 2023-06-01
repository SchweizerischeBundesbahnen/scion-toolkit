/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, Input, TemplateRef} from '@angular/core';

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
export class SciAccordionItemDirective {

  /**
   * Optional key to identify this item and is used as key for the {TrackBy} function.
   */
  @Input()
  public key?: string | undefined;

  /**
   * Provide template(s) to be rendered as actions of this list item.
   */
  @Input({required: true})
  public panel!: TemplateRef<void>;

  /**
   * Indicates whether to expand this item.
   */
  @Input()
  public expanded?: boolean | undefined;

  /**
   * Specifies CSS class(es) added to the <section> and <wb-view> elements, e.g. used for e2e testing.
   */
  @Input()
  public cssClass?: string | string[] | undefined | null;

  constructor(public readonly template: TemplateRef<void>) {
  }
}
