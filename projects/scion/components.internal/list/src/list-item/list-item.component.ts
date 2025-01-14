/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ElementRef, HostBinding, inject, Input} from '@angular/core';
import {FocusableOption, FocusOrigin} from '@angular/cdk/a11y';
import {SciListItemDirective} from '../list-item.directive';
import {SciListStyle} from '../metadata';
import {NgTemplateOutlet} from '@angular/common';
import {SciMaterialIconDirective} from '@scion/components.internal/material-icon';

@Component({
  selector: 'sci-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  imports: [
    NgTemplateOutlet,
    SciMaterialIconDirective,
  ],
})
export class SciListItemComponent implements FocusableOption {

  private readonly _host = inject(ElementRef).nativeElement as HTMLElement;

  @Input({required: true})
  public listItem!: SciListItemDirective;

  @HostBinding('class.active')
  @Input()
  public active = false;

  @Input({required: true})
  public style!: SciListStyle;

  @HostBinding('attr.tabindex')
  public tabindex = -1;

  /**
   * @implements FocusableOption
   */
  public focus(origin?: FocusOrigin): void {
    this._host.focus();
  }

  @HostBinding('class.option')
  public get optionStyle(): boolean {
    return this.style === 'option-item';
  }
}
