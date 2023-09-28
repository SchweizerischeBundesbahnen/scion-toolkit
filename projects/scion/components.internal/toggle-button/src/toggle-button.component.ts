/*
 * Copyright (c) 2018-2023 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, forwardRef} from '@angular/core';
import {UUID} from '@scion/toolkit/uuid';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {noop} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'sci-toggle-button',
  templateUrl: './toggle-button.component.html',
  styleUrls: ['./toggle-button.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
  ],
  providers: [
    {provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => SciToggleButtonComponent)},
  ],
})
export class SciToggleButtonComponent implements ControlValueAccessor {

  private _cvaChangeFn: (value: any) => void = noop;
  private _cvaTouchedFn: () => void = noop;

  protected formControl = new FormControl<boolean>(false);
  protected id = UUID.randomUUID();

  constructor() {
    this.formControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => {
        this._cvaChangeFn(value);
        this._cvaTouchedFn();
      });
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   * @docs-private
   */
  public registerOnChange(fn: any): void {
    this._cvaChangeFn = fn;
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   * @docs-private
   */
  public registerOnTouched(fn: any): void {
    this._cvaTouchedFn = fn;
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   * @docs-private
   */
  public setDisabledState(isDisabled: boolean): void {
    if (isDisabled) {
      this.formControl.disable();
    }
    else {
      this.formControl.enable();
    }
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   * @docs-private
   */
  public writeValue(value: any): void {
    this.formControl.setValue(coerceBooleanProperty(value), {emitEvent: false});
  }
}
