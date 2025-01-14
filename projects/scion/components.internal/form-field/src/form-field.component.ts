/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ElementRef, HostBinding, inject, Input, OnDestroy} from '@angular/core';
import {ConfigurableFocusTrap, ConfigurableFocusTrapFactory} from '@angular/cdk/a11y';
import {UUID} from '@scion/toolkit/uuid';

@Component({
  selector: 'sci-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
})
export class SciFormFieldComponent implements OnDestroy {

  private _focusTrap: ConfigurableFocusTrap;

  public readonly id = UUID.randomUUID();

  @Input()
  public direction: 'row' | 'column' = 'row';

  @HostBinding('class.column-direction')
  public get isColumnDirection(): boolean {
    return this.direction === 'column';
  }

  @Input({required: true})
  public label!: string;

  constructor() {
    const host = inject(ElementRef).nativeElement as HTMLElement;
    const focusTrapFactory = inject(ConfigurableFocusTrapFactory);

    this._focusTrap = focusTrapFactory.create(host);
    this._focusTrap.enabled = false;
  }

  public onLabelClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    this._focusTrap.enabled = true;
    this._focusTrap.focusFirstTabbableElement();
    this._focusTrap.enabled = false;
  }

  public ngOnDestroy(): void {
    this._focusTrap.destroy();
  }
}
