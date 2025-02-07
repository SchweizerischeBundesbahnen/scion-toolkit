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
import {Arrays} from '@scion/toolkit/util';

/**
 * Use this directive to model a list item for {SciListComponent}.
 * The host element of this modelling directive must be a <ng-template>.
 *
 * ---
 * Example usage:
 *
 * <sci-list (filter)="onFilter($event)">
 *   @for (item of items$ | async; track item.id) {
 *     <ng-template sciListItem>
 *       <app-list-item [item]="item"></app-list-item>
 *     </ng-template>
 *   }
 * </sci-list>
 */
@Directive({selector: 'ng-template[sciListItem]'})
export class SciListItemDirective {

  /**
   * Optional key to identify this item and is used to emit selection and internally as key for the {TrackBy} function.
   */
  public readonly key = input<string>();

  /**
   * Provide template(s) to be rendered as actions of this list item.
   */
  public readonly actions = input([], {transform: (actions: TemplateRef<void> | TemplateRef<void>[]) => Arrays.coerce(actions)});

  public readonly template = inject<TemplateRef<void>>(TemplateRef);
}
