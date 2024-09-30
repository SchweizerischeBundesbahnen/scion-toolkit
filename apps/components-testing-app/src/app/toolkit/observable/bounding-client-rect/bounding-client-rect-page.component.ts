/*
 * Copyright (c) 2018-2024 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 * SPDX-License-Identifier: EPL-2.0
 */

import {Component, DestroyRef, ElementRef, inject, OnInit, signal, viewChild} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {fromBoundingClientRect$} from '@scion/toolkit/observable';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Component({
  selector: 'e2e-bounding-client-rect-page',
  templateUrl: './bounding-client-rect-page.component.html',
  styleUrl: './bounding-client-rect-page.component.scss',
  standalone: true,
  imports: [
    FormsModule,
  ],
})
export class BoundingClientRectPageComponent implements OnInit {

  private _testee = viewChild.required<ElementRef<HTMLElement>>('testee');
  private _destroyRef = inject(DestroyRef);

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

  public ngOnInit(): void {
    this.applyProperties();

    fromBoundingClientRect$(this._testee().nativeElement)
      .pipe(takeUntilDestroyed(this._destroyRef))
      .subscribe(domRect => {
        this.testeeBoundingBox.x.set(domRect.x);
        this.testeeBoundingBox.y.set(domRect.y);
        this.testeeBoundingBox.width.set(domRect.width);
        this.testeeBoundingBox.height.set(domRect.height);
      });
  }

  public applyProperties(): void {
    this._testee().nativeElement.style.left = this.properties.x();
    this._testee().nativeElement.style.top = this.properties.y();
    this._testee().nativeElement.style.width = this.properties.width();
    this._testee().nativeElement.style.height = this.properties.height();
  }
}
