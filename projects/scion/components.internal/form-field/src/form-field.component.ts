/*
 * Copyright (c) 2018-2019 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */

import {Component, ElementRef, HostBinding, Input, OnChanges, OnDestroy, OnInit, SimpleChanges} from '@angular/core';
import {ConfigurableFocusTrap, ConfigurableFocusTrapFactory} from '@angular/cdk/a11y';
import {Defined} from '@scion/toolkit/util';
import {UUID} from '@scion/toolkit/uuid';

@Component({
  selector: 'sci-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
  standalone: true,
})
export class SciFormFieldComponent implements OnDestroy, OnInit, OnChanges {

  private _focusTrap: ConfigurableFocusTrap;

  public readonly id = UUID.randomUUID();

  @Input()
  public direction: 'row' | 'column' = 'row';

  @HostBinding('class.column-direction')
  public get isColumnDirection(): boolean {
    return this.direction === 'column';
  }

  @Input()
  public label!: string;

  constructor(host: ElementRef<HTMLElement>, focusTrapFactory: ConfigurableFocusTrapFactory) {
    this._focusTrap = focusTrapFactory.create(host.nativeElement);
    this._focusTrap.enabled = false;
  }

  public ngOnInit(): void {
    this.assertInputProperties();
  }

  public ngOnChanges(changes: SimpleChanges): void {
    this.assertInputProperties();
  }

  public onLabelClick(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    this._focusTrap.enabled = true;
    this._focusTrap.focusFirstTabbableElement();
    this._focusTrap.enabled = false;
  }

  private assertInputProperties(): void {
    Defined.orElseThrow(this.label, () => Error('[NullInputError] Missing required input: `label`.'));
  }

  public ngOnDestroy(): void {
    this._focusTrap.destroy();
  }
}
