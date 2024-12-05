/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, DoCheck, effect, ElementRef, inject, NgZone, OnInit, signal, viewChild} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {boundingClientRect} from '@scion/components/dimension';
import {fromEvent} from 'rxjs';
import {observeIn, subscribeIn} from '@scion/toolkit/operators';

@Component({
  selector: 'app-bounding-client-rect-page',
  templateUrl: './dimension-page.component.html',
  styleUrl: './bounding-client-rect-page.component.scss',
  imports: [
    FormsModule,
    ReactiveFormsModule,
  ],
})
export class BoundingClientRectPageComponent implements OnInit, DoCheck {

  private _testee = viewChild.required<ElementRef<HTMLElement>>('testee');
  private _boundingBox = boundingClientRect(this._testee);
  private applyButton = viewChild<ElementRef<HTMLElement>>('apply_button');
  private zone = inject(NgZone);

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
    fromEvent(this.applyButton()!.nativeElement, 'click')
      .pipe(
        subscribeIn(fn => this.zone.runOutsideAngular(fn)),
        observeIn(fn => this.zone.runOutsideAngular(fn)),
      )
      .subscribe(() => {
        this.applyProperties();
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
