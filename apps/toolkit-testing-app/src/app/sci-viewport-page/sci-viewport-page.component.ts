/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { SciViewportComponent } from '@scion/toolkit/viewport';

export const SCROLLBAR_STYLE = 'scrollbarStyle';
export const SCROLLBAR_COLOR = 'scrollbarColor';
export const CONTENT_GRID_TEMPLATE_COLUMNS = 'contentGridTemplateColumns';
export const CONTENT_GRID_TEMPLATE_ROWS = 'contentGridTemplateRows';
export const CONTENT_GRID_AUTO_ROWS = 'contentGridAutoRows';
export const CONTENT_GRID_AUTO_COLUMNS = 'contentGridAutoColumns';
export const CONTENT_GRID_GAP = 'contentGridGap';

@Component({
  selector: 'sci-viewport-page',
  templateUrl: './sci-viewport-page.component.html',
  styleUrls: ['./sci-viewport-page.component.scss'],
})
export class SciViewportPageComponent implements OnInit {

  public SCROLLBAR_STYLE = SCROLLBAR_STYLE;
  public SCROLLBAR_COLOR = SCROLLBAR_COLOR;
  public CONTENT_GRID_TEMPLATE_COLUMNS = CONTENT_GRID_TEMPLATE_COLUMNS;
  public CONTENT_GRID_TEMPLATE_ROWS = CONTENT_GRID_TEMPLATE_ROWS;
  public CONTENT_GRID_AUTO_ROWS = CONTENT_GRID_AUTO_ROWS;
  public CONTENT_GRID_AUTO_COLUMNS = CONTENT_GRID_AUTO_COLUMNS;
  public CONTENT_GRID_GAP = CONTENT_GRID_GAP;

  public scrollbarStyles = ['native', 'on-top', 'hidden'];
  public form: FormGroup;

  @ViewChild(SciViewportComponent, {static: true, read: ElementRef})
  public viewportComponent: ElementRef<HTMLElement>;

  constructor(formBuilder: FormBuilder) {
    this.form = formBuilder.group({
      [SCROLLBAR_STYLE]: formBuilder.control(undefined),
      [SCROLLBAR_COLOR]: formBuilder.control(undefined),
      [CONTENT_GRID_TEMPLATE_COLUMNS]: formBuilder.control(undefined),
      [CONTENT_GRID_TEMPLATE_ROWS]: formBuilder.control(undefined),
      [CONTENT_GRID_AUTO_ROWS]: formBuilder.control(undefined),
      [CONTENT_GRID_AUTO_COLUMNS]: formBuilder.control(undefined),
      [CONTENT_GRID_GAP]: formBuilder.control(undefined),
    });
  }

  public ngOnInit(): void {
    this.form.get(SCROLLBAR_COLOR).setValue(this.readCssVariableDefault('--sci-viewport-scrollbar-color'));
    this.form.get(CONTENT_GRID_TEMPLATE_COLUMNS).setValue(this.readCssVariableDefault('--sci-viewport-content-grid-template-columns'));
    this.form.get(CONTENT_GRID_TEMPLATE_ROWS).setValue(this.readCssVariableDefault('--sci-viewport-content-grid-template-rows'));
    this.form.get(CONTENT_GRID_AUTO_ROWS).setValue(this.readCssVariableDefault('--sci-viewport-content-grid-auto-rows'));
    this.form.get(CONTENT_GRID_AUTO_COLUMNS).setValue(this.readCssVariableDefault('--sci-viewport-content-grid-auto-columns'));
    this.form.get(CONTENT_GRID_GAP).setValue(this.readCssVariableDefault('--sci-viewport-content-grid-gap'));
  }

  private readCssVariableDefault(cssVariable: string): string {
    return getComputedStyle(this.viewportComponent.nativeElement).getPropertyValue(cssVariable);
  }
}
