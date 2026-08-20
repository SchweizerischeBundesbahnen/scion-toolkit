/*
 * Copyright (c) 2018-2026 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Directive, ElementRef, inject, input, numberAttribute} from '@angular/core';
import {fromEvent} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {clamp} from '@scion/toolkit/util';

/**
 * Prevents values outside the configured minimum and maximum.
 *
 * The browser enforces min and max for the stepper buttons, but not for typed or pasted values.
 *
 * Usage:
 * ```html
 * <input type="number" appMinMax min="0" max="10" />
 * ```
 */
@Directive({
  selector: 'input[type="number"][appMinMax]',
})
export class MinMaxDirective {

  public readonly min = input(undefined, {transform: numberAttribute});
  public readonly max = input(undefined, {transform: numberAttribute});

  constructor() {
    const inputElement = inject(ElementRef).nativeElement as HTMLInputElement;
    fromEvent<InputEvent>(inputElement, 'input')
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        const value = +inputElement.value;
        inputElement.value = `${clamp(value, {min: this.min() ?? value, max: this.max() ?? value})}`;
      });
  }
}
