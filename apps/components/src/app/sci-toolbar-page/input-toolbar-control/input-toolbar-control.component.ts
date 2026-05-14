/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, ElementRef, input, model, viewChild} from '@angular/core';
import {SciIconComponent} from '@scion/components/icon';
import {FormsModule} from '@angular/forms';
import {SciTextPipe} from '@scion/components/text';

@Component({
  selector: 'app-input-toolbar-controll',
  templateUrl: './input-toolbar-control.component.html',
  styleUrls: ['./input-toolbar-control.component.scss'],
  imports: [
    SciIconComponent,
    FormsModule,
    SciTextPipe,
  ],
  host: {
    '[attr.tabindex]': '-1', // enable delegation of programmatic focus requests
    '(focus)': 'onFocus()',
  },
})
export class InputToolbarControlComponent {

  public readonly placeholder = input.required<string>();
  public readonly text = model<string>('');

  private readonly _inputField = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected onClear(): void {
    this.text.set('');
    this._inputField().nativeElement.focus();
  }

  protected onFocus(): void {
    this._inputField().nativeElement.focus();
  }
}
