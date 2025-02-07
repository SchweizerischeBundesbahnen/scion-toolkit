/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, inject, input, TemplateRef} from '@angular/core';

/**
 * Use this directive to model an accordion item for {SciAccordionComponent}.
 * The host element of this modelling directive must be a <ng-template>.
 *
 * ---
 * Example usage:
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
@Directive({selector: 'ng-template[sciAccordionItem]'})
export class SciAccordionItemDirective {

  public readonly template = inject<TemplateRef<void>>(TemplateRef);

  /**
   * Provide template(s) to be rendered as actions of this list item.
   */
  public readonly panel = input.required<TemplateRef<void>>();

  /**
   * Optional key to identify this item and is used as key for the {TrackBy} function.
   */
  public readonly key = input<string>();

  /**
   * Indicates whether to expand this item.
   */
  public readonly expanded = input<boolean>();

  /**
   * Specifies CSS class(es) added to the <section> and <wb-view> elements, e.g. used for e2e testing.
   */
  public readonly cssClass = input<string | string[] | null | undefined>();
}
