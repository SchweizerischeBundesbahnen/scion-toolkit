/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {booleanAttribute, ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, ElementRef, forwardRef, HostBinding, HostListener, inject, input, linkedSignal, OnDestroy, output, untracked, viewChild} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR, NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {noop} from 'rxjs';
import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {UUID} from '@scion/toolkit/uuid';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

/**
 * Provides a simple filter control.
 */
@Component({
  selector: 'sci-filter-field',
  templateUrl: './filter-field.component.html',
  styleUrls: ['./filter-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SciMaterialIconDirective,
  ],
  providers: [
    {provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => SciFilterFieldComponent)},
  ],
})
export class SciFilterFieldComponent implements ControlValueAccessor, OnDestroy {

  /**
   * Sets focus order in sequential keyboard navigation. If not specified, the focus order is according to the position in the document (tabindex=0).
   */
  public readonly tabindex = input<number>();

  /**
   * Specifies the hint displayed when this field is empty.
   */
  public readonly placeholder = input<string>();
  public readonly disabled = input(false, {transform: booleanAttribute});

  /**
   * Emits on filter change.
   */
  public readonly filter = output<string>();

  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;
  private readonly _focusManager = inject(FocusMonitor);
  private readonly _cd = inject(ChangeDetectorRef);
  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _inputElement = viewChild.required<ElementRef<HTMLInputElement>>('input');
  private readonly _disabled = linkedSignal(() => this.disabled());

  protected readonly id = UUID.randomUUID();
  protected readonly formControl = this._formBuilder.control('', {updateOn: 'change'});

  private _cvaChangeFn: (value: any) => void = noop;
  private _cvaTouchedFn: () => void = noop;

  @HostBinding('attr.tabindex')
  protected componentTabindex = -1; // component is not focusable in sequential keyboard navigation, but tabindex (if any) is installed on input field

  @HostBinding('class.empty')
  protected get empty(): boolean {
    return !this.formControl.value;
  }

  constructor() {
    this.formControl.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(value => {
        this._cvaChangeFn(value);
        this.filter.emit(value);
      });

    this._focusManager.monitor(this._host, true)
      .pipe(takeUntilDestroyed())
      .subscribe((focusOrigin: FocusOrigin) => {
        if (!focusOrigin) {
          this._cvaTouchedFn(); // triggers form field validation and signals a blur event
        }
      });

    effect(() => {
      const disabled = this._disabled();
      // Prevent value emission when changing form control enabled state.
      untracked(() => disabled ? this.formControl.disable({emitEvent: false}) : this.formControl.enable({emitEvent: false}));
    });
  }

  @HostListener('focus')
  public focus(): void {
    this._inputElement().nativeElement.focus();
  }

  /**
   * Invoke to propagate keyboard events to the filter field.
   *
   * If the keyboard event represents an alphanumeric character, filter text is cleared and the cursor set into the filter field.
   * This allows to start filtering without having to focus the filter field, e.g. if another element has the focus.
   */
  public focusAndApplyKeyboardEvent(event: KeyboardEvent): void {
    if (event.target === this._inputElement().nativeElement) {
      return; // Ignore the keyboard event if its target is equal to the input element.
    }
    if (event.ctrlKey || event.altKey || event.shiftKey) {
      return;
    }
    if (!isAlphanumeric(event)) {
      return;
    }
    this.formControl.setValue('');
    this.focus();
    event.stopPropagation();
    this._cd.markForCheck();
  }

  protected onClear(): void {
    this.formControl.setValue('');
    this.focus(); // restore the focus
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   * @docs-private
   */
  public registerOnChange(fn: (value: unknown) => void): void {
    this._cvaChangeFn = fn;
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   * @docs-private
   */
  public registerOnTouched(fn: () => void): void {
    this._cvaTouchedFn = fn;
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   * @docs-private
   */
  public setDisabledState(isDisabled: boolean): void {
    this._disabled.set(isDisabled);
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   * @docs-private
   */
  public writeValue(value: string | undefined | null): void {
    this.formControl.setValue(value ?? '', {emitEvent: false});
    this._cd.markForCheck();
  }

  public ngOnDestroy(): void {
    this._focusManager.stopMonitoring(this._host);
  }
}

function isAlphanumeric(event: KeyboardEvent): boolean {
  return (/^[a-z0-9]$/i.test(event.key));
}

/**
 * Creates a regular expression of the given filter text.
 */
export function toFilterRegExp(filterText: string): RegExp | null {
  if (!filterText) {
    return null;
  }

  // Escape the user filter input and add wildcard support
  const escapedString = filterText.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
  return new RegExp(escapedString, 'i');
}
