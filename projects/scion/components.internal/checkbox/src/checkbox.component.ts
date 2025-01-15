/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {booleanAttribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, forwardRef, inject, input, linkedSignal, untracked} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule} from '@angular/forms';
import {noop} from 'rxjs';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {UUID} from '@scion/toolkit/uuid';

@Component({
  selector: 'sci-checkbox',
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SciMaterialIconDirective,
  ],
  providers: [
    {provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => SciCheckboxComponent)},
  ],
})
export class SciCheckboxComponent implements ControlValueAccessor {

  public readonly disabled = input(false, {transform: booleanAttribute});

  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _disabled = linkedSignal(() => this.disabled());

  protected readonly formControl = new FormControl<boolean>(false, {nonNullable: true});
  protected readonly id = UUID.randomUUID();

  private _cvaChangeFn: (value: unknown) => void = noop;
  private _cvaTouchedFn: () => void = noop;

  constructor() {
    this.formControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(checked => {
        this._cvaChangeFn(checked);
        this._cvaTouchedFn();
      });

    effect(() => {
      const disabled = this._disabled();
      // Prevent value emission when changing form control enabled state.
      untracked(() => disabled ? this.formControl.disable({emitEvent: false}) : this.formControl.enable({emitEvent: false}));
    });
  }

  public get isChecked(): boolean {
    return this.formControl.value;
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   */
  public registerOnChange(fn: (value: unknown) => void): void {
    this._cvaChangeFn = fn;
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   */
  public registerOnTouched(fn: () => void): void {
    this._cvaTouchedFn = fn;
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   */
  public setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   */
  public writeValue(value: boolean | null | undefined): void {
    this.formControl.setValue(coerceBooleanProperty(value), {emitEvent: false});
    this._cd.markForCheck();
  }
}
