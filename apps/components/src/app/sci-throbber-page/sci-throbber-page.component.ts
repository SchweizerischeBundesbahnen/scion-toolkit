/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {SciThrobberComponent} from '@scion/components/throbber';

export const TYPE = 'type';
export const COLOR = 'color';
export const SIZE = 'size';
export const DURATION = 'duration';

@Component({
  selector: 'sci-throbber-page',
  templateUrl: './sci-throbber-page.component.html',
  styleUrls: ['./sci-throbber-page.component.scss'],
})
export class SciThrobberPageComponent implements OnInit {

  public TYPE = TYPE;
  public COLOR = COLOR;
  public SIZE = SIZE;
  public DURATION = DURATION;

  public types = ['ellipsis', 'ripple', 'roller', 'spinner'];
  public form: FormGroup;

  @ViewChild(SciThrobberComponent, {static: true, read: ElementRef})
  public throbberComponent!: ElementRef<HTMLElement>;

  constructor(formBuilder: FormBuilder) {
    this.form = formBuilder.group({
      [TYPE]: formBuilder.control(undefined),
      [COLOR]: formBuilder.control(undefined),
      [SIZE]: formBuilder.control(undefined),
      [DURATION]: formBuilder.control(undefined),
    });
  }

  public ngOnInit(): void {
    this.form.get(COLOR)!.setValue(this.readCssVariableDefault('--sci-throbber-color'));
    this.form.get(SIZE)!.setValue(this.readCssVariableDefault('--sci-throbber-size'));
    this.form.get(DURATION)!.setValue(this.readCssVariableDefault('--sci-throbber-duration'));
  }

  private readCssVariableDefault(cssVariable: string): string {
    return getComputedStyle(this.throbberComponent.nativeElement).getPropertyValue(cssVariable);
  }
}
