/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Directive, effect, ElementRef, inject, input} from '@angular/core';
import {SciSashDirective} from './sash.directive';

/**
 * Initializes {SashDirective} with the target {HTMLDivElement}.
 */
@Directive({
  selector: 'div[sciSashInitializer].sash',
})
export class SciSashInitializerDirective {

  public readonly sash = input.required<SciSashDirective>({alias: 'sciSashInitializer'});

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLDivElement;
    effect(() => this.sash().element.set(host));
  }
}
