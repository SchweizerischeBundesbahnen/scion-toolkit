/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, ElementRef, inject} from '@angular/core';

/**
 * Provides access to the native {@link HTMLElement} of the host.
 */
@Directive({
  selector: '[sciElementRef]',
  exportAs: 'sciElementRef',
})
export class SciElementRefDirective {

  public readonly host = inject(ElementRef).nativeElement as HTMLElement;
}
