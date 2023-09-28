/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, ElementRef, HostListener, OnInit, ViewChild} from '@angular/core';
import {FormsModule, NonNullableFormBuilder, ReactiveFormsModule} from '@angular/forms';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';
import {NgFor, NgIf} from '@angular/common';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';
import {SciTabbarComponent, SciTabDirective} from '@scion/components.internal/tabbar';

@Component({
  selector: 'sci-sashbox-page',
  templateUrl: './sci-sashbox-page.component.html',
  styleUrls: ['./sci-sashbox-page.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
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

  public directionFormControl = this._formBuilder.control<'column' | 'row'>('row');
  public stylingFormGroup = this._formBuilder.group({
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

  public sashes: Sash[] = [
    {visible: true, size: '250px', minSize: 75},
    {visible: true, size: '1', minSize: 50},
    {visible: true, size: '250px', minSize: 75},
  ];

  public glasspaneVisible = false;

  @ViewChild(SciSashboxComponent, {static: true, read: ElementRef})
  public sashBoxComponent!: ElementRef<HTMLElement>;

  constructor(private _formBuilder: NonNullableFormBuilder) {
  }

  public ngOnInit(): void {
    // Set CSS variable default values.
    Object.entries(this.stylingFormGroup.controls).forEach(([key, formControl]) => {
      const defaultValue = getComputedStyle(this.sashBoxComponent.nativeElement).getPropertyValue(key);
      formControl.setValue(defaultValue);
    });
  }

  @HostListener('keydown.escape')
  public onGlasspaneToggle(): void {
    this.glasspaneVisible = !this.glasspaneVisible;
  }
}

export interface Sash {
  visible: boolean;
  size?: string;
  minSize?: number;
}
