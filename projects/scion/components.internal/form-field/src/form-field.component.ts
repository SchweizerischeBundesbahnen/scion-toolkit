/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, DestroyRef, ElementRef, inject, input} from '@angular/core';
import {ConfigurableFocusTrap, ConfigurableFocusTrapFactory} from '@angular/cdk/a11y';

@Component({
  selector: 'sci-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  host: {
    '[class.column-direction]': `this.direction() === 'column'`,
  },
})
export class SciFormFieldComponent {

  public readonly label = input.required<string>();
  public readonly direction = input<'row' | 'column'>('row');

  private _focusTrap: ConfigurableFocusTrap;

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    const focusTrapFactory = inject(ConfigurableFocusTrapFactory);

    this._focusTrap = focusTrapFactory.create(host);
    this._focusTrap.enabled = false;

    inject(DestroyRef).onDestroy(() => this._focusTrap.destroy());
  }

  public onLabelClick(): void {
    this._focusTrap.enabled = true;
    this._focusTrap.focusFirstTabbableElement();
    this._focusTrap.enabled = false;
  }
}
