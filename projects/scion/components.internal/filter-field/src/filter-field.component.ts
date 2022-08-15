/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, forwardRef, HostBinding, HostListener, Input, OnDestroy, Output, ViewChild} from '@angular/core';
import {ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR} from '@angular/forms';
import {takeUntil} from 'rxjs/operators';
import {noop, Subject} from 'rxjs';
import {coerceBooleanProperty} from '@angular/cdk/coercion';
import {FocusMonitor, FocusOrigin} from '@angular/cdk/a11y';
import {UUID} from '@scion/toolkit/uuid';

/**
 * Provides a simple filter control.
 */
@Component({
  selector: 'sci-filter-field',
  templateUrl: './filter-field.component.html',
  styleUrls: ['./filter-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {provide: NG_VALUE_ACCESSOR, multi: true, useExisting: forwardRef(() => SciFilterFieldComponent)},
  ],
})
export class SciFilterFieldComponent implements ControlValueAccessor, OnDestroy {

  private _destroy$ = new Subject<void>();
  private _cvaChangeFn: (value: any) => void = noop;
  private _cvaTouchedFn: () => void = noop;
  public id = UUID.randomUUID();

  /**
   * Sets focus order in sequential keyboard navigation.
   * If not specified, the focus order is according to the position in the document (tabindex=0).
   */
  @Input()
  public tabindex?: number;

  /**
   * Specifies the hint displayed when this field is empty.
   */
  @Input()
  public placeholder?: string;

  @HostBinding('class.disabled')
  @Input()
  public set disabled(disabled: boolean | string | undefined | null) {
    coerceBooleanProperty(disabled) ? this.formControl.disable() : this.formControl.enable();
  }

  public get disabled(): boolean {
    return this.formControl.disabled;
  }

  /**
   * Emits on filter change.
   */
  @Output()
  public filter = new EventEmitter<string>();

  @ViewChild('input', {static: true})
  private _inputElement!: ElementRef<HTMLInputElement>;

  @HostBinding('attr.tabindex')
  public componentTabindex = -1; // component is not focusable in sequential keyboard navigation, but tabindex (if any) is installed on input field

  @HostBinding('class.empty')
  public get empty(): boolean {
    return !this.formControl.value;
  }

  /* @docs-private */
  public formControl: FormControl;

  constructor(private _host: ElementRef,
              private _focusManager: FocusMonitor,
              private _cd: ChangeDetectorRef) {
    this.formControl = new FormControl('', {updateOn: 'change', nonNullable: true});
    this.formControl.valueChanges
      .pipe(takeUntil(this._destroy$))
      .subscribe(value => {
        this._cvaChangeFn(value);
        this.filter.emit(value);
      });

    this._focusManager.monitor(this._host.nativeElement, true)
      .pipe(takeUntil(this._destroy$))
      .subscribe((focusOrigin: FocusOrigin) => {
        if (!focusOrigin) {
          this._cvaTouchedFn(); // triggers form field validation and signals a blur event
        }
      });
  }

  @HostListener('focus')
  public focus(): void {
    this._inputElement.nativeElement.focus();
  }

  /**
   * Invoke to propagate keyboard events to the filter field.
   *
   * If the keyboard event represents an alphanumeric character, filter text is cleared and the cursor set into the filter field.
   * This allows to start filtering without having to focus the filter field, e.g. if another element has the focus.
   */
  public focusAndApplyKeyboardEvent(event: KeyboardEvent): void {
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

  /**
   * @deprecated since version 11.0.0-beta.5. Use {@link focusAndApplyKeyboardEvent} instead.
   */
  public onKeydown(event: KeyboardEvent): void {
    this.focusAndApplyKeyboardEvent(event);
  }

  public onClear(event: MouseEvent): void {
    this.formControl.setValue('');
    event.stopPropagation();
    this.focus(); // restore the focus
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
    this.disabled = isDisabled;
    this._cd.markForCheck();
  }

  /**
   * Method implemented as part of `ControlValueAccessor` to work with Angular forms API
   * @docs-private
   */
  public writeValue(value: any): void {
    this.formControl.setValue(value, {emitEvent: false});
    this._cd.markForCheck();
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._focusManager.stopMonitoring(this._host.nativeElement);
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
  const escapedString = filterText.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
  return new RegExp(escapedString, 'i');
}
