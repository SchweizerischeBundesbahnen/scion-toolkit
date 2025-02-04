/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ElementRef, HostBinding, inject, input} from '@angular/core';
import {FormArray, FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {Dictionary, Maps} from '@scion/toolkit/util';
import {UUID} from '@scion/toolkit/uuid';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

/**
 * Allows entering key-value pairs.
 */
@Component({
  selector: 'sci-key-value-field',
  templateUrl: './key-value-field.component.html',
  styleUrls: ['./key-value-field.component.scss'],
  imports: [
    ReactiveFormsModule,
    SciMaterialIconDirective,
  ],
})
export class SciKeyValueFieldComponent {

  public readonly keyValueFormArray = input.required<FormArray<FormGroup<KeyValueEntry>>>();
  public readonly title = input<string>();
  public readonly removable = input(false);
  public readonly addable = input(false);

  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;

  protected readonly id = UUID.randomUUID();

  @HostBinding('attr.tabindex')
  protected tabindex = -1;

  @HostBinding('class.removable')
  protected get isRemovable(): boolean {
    return this.removable();
  }

  @HostBinding('class.addable')
  protected get isAddable(): boolean {
    return this.addable();
  }

  protected onRemove(index: number): void {
    this.keyValueFormArray().removeAt(index);

    // Focus the component to not lose the focus when the remove button is removed from the DOM.
    // Otherwise, if used in a popup, the popup would be closed because no element is focused anymore.
    this._host.focus({preventScroll: true});
  }

  protected onAdd(): void {
    this.keyValueFormArray().push(this._formBuilder.group({
      key: this._formBuilder.control(''),
      value: this._formBuilder.control(''),
    }));
  }

  protected onClear(): void {
    this.keyValueFormArray().clear();
  }

  /**
   * Creates a dictionary from the form controls in the given `FormArray`.
   *
   * By default, if empty, `null` is returned.
   */
  public static toDictionary(formArray: FormArray<FormGroup<KeyValueEntry>>, returnNullIfEmpty?: true): Dictionary<string> | null;
  public static toDictionary(formArray: FormArray<FormGroup<KeyValueEntry>>, returnNullIfEmpty: false): Dictionary<string>;
  public static toDictionary(formArray: FormArray<FormGroup<KeyValueEntry>>, returnNullIfEmpty: boolean): Dictionary<string> | null;
  public static toDictionary(formArray: FormArray<FormGroup<KeyValueEntry>>, returnNullIfEmpty: boolean = true): Dictionary<string> | null {
    const dictionary: Dictionary<string> = {};
    formArray.controls.forEach(formGroup => {
      const key = formGroup.controls.key.value;
      dictionary[key] = formGroup.controls.value.value;
    });

    if (!Object.keys(dictionary).length && returnNullIfEmpty) {
      return null;
    }

    return dictionary;
  }

  /**
   * Creates a {@link Map} from the form controls in the given `FormArray`.
   *
   * By default, if empty, `null` is returned.
   */
  public static toMap(formArray: FormArray<FormGroup<KeyValueEntry>>, returnNullIfEmpty?: true): Map<string, any> | null;
  public static toMap(formArray: FormArray<FormGroup<KeyValueEntry>>, returnNullIfEmpty: false): Map<string, any>;
  public static toMap(formArray: FormArray<FormGroup<KeyValueEntry>>, returnNullIfEmpty: boolean): Map<string, any> | null;
  public static toMap(formArray: FormArray<FormGroup<KeyValueEntry>>, returnNullIfEmpty: boolean = true): Map<string, any> | null {
    return Maps.coerce(SciKeyValueFieldComponent.toDictionary(formArray, returnNullIfEmpty), {coerceNullOrUndefined: false}) ?? null;
  }
}

/**
 * Represents the entry of the form array.
 */
export interface KeyValueEntry {
  key: FormControl<string>;
  value: FormControl<string>;
}
