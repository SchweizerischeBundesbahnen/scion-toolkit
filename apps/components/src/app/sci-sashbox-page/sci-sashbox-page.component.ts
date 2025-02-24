/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, ElementRef, HostListener, inject, OnInit, Signal, viewChild} from '@angular/core';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';

@Component({
  selector: 'sci-sashbox-page',
  templateUrl: './sci-sashbox-page.component.html',
  styleUrls: ['./sci-sashbox-page.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SciSashboxComponent,
    SciSashDirective,
    SciFormFieldComponent,
    SciCheckboxComponent,
    SciMaterialIconDirective,
    SciTabDirective,
    SciTabbarComponent,
  ],
})
export default class SciSashboxPageComponent implements OnInit {

  private readonly _formBuilder = inject(NonNullableFormBuilder);
  private readonly _sashBoxComponent: Signal<ElementRef<HTMLElement>> = viewChild.required(SciSashboxComponent, {read: ElementRef<HTMLElement>});

  protected readonly directionFormControl = this._formBuilder.control<'column' | 'row'>('row');
  protected readonly stylingFormGroup = this._formBuilder.group({
    '--sci-sashbox-gap': this._formBuilder.control(''),
    '--sci-sashbox-splitter-background-color': this._formBuilder.control(''),
    '--sci-sashbox-splitter-background-color-hover': this._formBuilder.control(''),
    '--sci-sashbox-splitter-size': this._formBuilder.control(''),
    '--sci-sashbox-splitter-size-hover': this._formBuilder.control(''),
    '--sci-sashbox-splitter-touch-target-size': this._formBuilder.control(''),
    '--sci-sashbox-splitter-cross-axis-size': this._formBuilder.control(''),
    '--sci-sashbox-splitter-border-radius': this._formBuilder.control(''),
    '--sci-sashbox-splitter-opacity-active': this._formBuilder.control(''),
    '--sci-sashbox-splitter-opacity-hover': this._formBuilder.control(''),
  });

  protected readonly sashes: Sash[] = [
    {visible: true, size: '250px', minSize: 75},
    {visible: true, size: '1', minSize: 50},
    {visible: true, size: '250px', minSize: 75},
  ];

  protected glasspaneVisible = false;

  public ngOnInit(): void {
    // Set CSS variable default values.
    Object.entries(this.stylingFormGroup.controls).forEach(([key, formControl]) => {
      const defaultValue = getComputedStyle(this._sashBoxComponent().nativeElement).getPropertyValue(key);
      formControl.setValue(defaultValue);
    });
  }

  @HostListener('keydown.escape')
  protected onGlasspaneToggle(): void {
    this.glasspaneVisible = !this.glasspaneVisible;
  }

  protected onSashEnd(sashSizes: number[]): void {
    console.log('[SciSashboxPageComponent:onSashEnd]', sashSizes);
  }

  protected onSashEnd2(sashSizes: {[sashKey: string]: number}): void {
    console.log('[SciSashboxPageComponent:onSashEnd2]', sashSizes);
  }
}

export interface Sash {
  visible: boolean;
  size?: string;
  minSize?: number;
  key?: string;
}
