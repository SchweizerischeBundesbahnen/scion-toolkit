/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {ChangeDetectionStrategy, Component, DoCheck, effect, ElementRef, inject, NgZone, OnInit, signal, viewChild} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {boundingClientRect} from '@scion/components/dimension';

@Component({
  selector: 'app-dimension-page',
  templateUrl: './dimension-page.component.html',
  styleUrl: './dimension-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class DimensionPageComponent implements OnInit, DoCheck {

  private _testee = viewChild.required<ElementRef<HTMLElement>>('testee');
  private _boundingBox = boundingClientRect(this._testee);
  private applyButton = viewChild('apply_button', {read: ElementRef});

  protected properties = {
    x: signal<string>('0px'),
    y: signal<string>('0px'),
    width: signal<string>('100px'),
    height: signal<string>('100px'),
  };

  protected testeeBoundingBox = {
    x: signal<number | undefined>(undefined),
    y: signal<number | undefined>(undefined),
    width: signal<number | undefined>(undefined),
    height: signal<number | undefined>(undefined),
  };
  private zone = inject(NgZone);

  constructor() {
    effect(() => {
      const boundingBox = this._boundingBox();
      this.testeeBoundingBox.x.set(boundingBox.x);
      this.testeeBoundingBox.y.set(boundingBox.y);
      this.testeeBoundingBox.width.set(boundingBox.width);
      this.testeeBoundingBox.height.set(boundingBox.height);
    });
  }

  public ngOnInit(): void {
    this.applyProperties();
    this.zone.runOutsideAngular(() => {
      this.applyButton()!.nativeElement.addEventListener('click', () => this.applyProperties());
    });
  }

  public ngDoCheck(): void {
    console.log('[BoundingClientRectPageComponent] Angular change detection cycle');
  }

  public applyProperties(): void {
    this._testee().nativeElement.style.left = this.properties.x();
    this._testee().nativeElement.style.top = this.properties.y();
    this._testee().nativeElement.style.width = this.properties.width();
    this._testee().nativeElement.style.height = this.properties.height();
  }
}
