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
import {FormControl, FormGroup, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SciSashboxComponent, SciSashDirective} from '@scion/components/sashbox';
import {NgFor, NgIf} from '@angular/common';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciCheckboxComponent} from '@scion/components.internal/checkbox';

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
  ],
})
export default class SciSashboxPageComponent implements OnInit {

  public directionFormControl = new FormControl<'column' | 'row'>('row', {nonNullable: true});
  public stylingFormGroup = new FormGroup({
    '--sci-sashbox-gap': new FormControl(''),
    '--sci-sashbox-splitter-bgcolor': new FormControl(''),
    '--sci-sashbox-splitter-bgcolor_hover': new FormControl(''),
    '--sci-sashbox-splitter-size': new FormControl(''),
    '--sci-sashbox-splitter-size_hover': new FormControl(''),
    '--sci-sashbox-splitter-touch-target-size': new FormControl(''),
    '--sci-sashbox-splitter-cross-axis-size': new FormControl(''),
    '--sci-sashbox-splitter-border-radius': new FormControl(''),
    '--sci-sashbox-splitter-opacity_active': new FormControl(''),
    '--sci-sashbox-splitter-opacity_hover': new FormControl(''),
  });

  public sashes: Sash[] = [
    {visible: true, size: '250px', minSize: 75},
    {visible: true, size: '1', minSize: 50},
    {visible: true, size: '250px', minSize: 75},
  ];

  public glasspaneVisible = false;

  @ViewChild(SciSashboxComponent, {static: true, read: ElementRef})
  public sashBoxComponent!: ElementRef<HTMLElement>;

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
