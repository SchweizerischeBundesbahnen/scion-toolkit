/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, HostBinding} from '@angular/core';

/**
 * Enables the host to render a Material ligature.
 *
 * Ligatures from following fonts are supported:
 * - https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded
 * - https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined
 * - https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp
 * - https://fonts.googleapis.com/css?family=Material+Icons|Material+Icons+Outlined|Material+Icons+Round|Material+Icons+Sharp
 */
@Directive({selector: '[sciMaterialIcon]', standalone: true})
export class SciMaterialIconDirective {

  @HostBinding('class.material-icons')
  @HostBinding('class.material-icons-outlined')
  @HostBinding('class.material-icons-round')
  @HostBinding('class.material-icons-sharp')
  @HostBinding('class.material-symbols-sharp')
  @HostBinding('class.material-symbols-outlined')
  @HostBinding('class.material-symbols-rounded')
  public materialIcons = true;
}
