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
import {FormsModule} from '@angular/forms';
import {SciTextPipe} from '@scion/components/text';
import {SciIconComponent} from '@scion/components/icon';

@Component({
  selector: 'sci-menu-filter',
  templateUrl: './menu-filter.component.html',
  styleUrl: './menu-filter.component.scss',
  imports: [
    FormsModule,
    SciTextPipe,
    SciIconComponent,
  ],
  host: {
    '[attr.tabindex]': '-1', // enable delegation of programmatic focus requests
    '(focus)': 'focus()',
  },
})
export class SciMenuFilterComponent {

  public readonly placeholder = input.required<string>();
  public readonly text = model<string>('');

  private readonly _inputField = viewChild.required<ElementRef<HTMLInputElement>>('input');

  public focus(): void {
    this._inputField().nativeElement.focus();
  }

  protected onClear(): void {
    this.text.set('');
    this.focus();
  }
}
