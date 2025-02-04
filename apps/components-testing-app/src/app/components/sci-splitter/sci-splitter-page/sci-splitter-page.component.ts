/*
 * Copyright (c) 2018-2025 Swiss Federal Railways
 *
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 *
 *  SPDX-License-Identifier: EPL-2.0
 */
import {Component, computed, linkedSignal, signal} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {SciFormFieldComponent} from '@scion/components.internal/form-field';
import {SciSplitterComponent, SplitterMoveEvent} from '@scion/components/splitter';
import {animationFrameScheduler, interval} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {filter} from 'rxjs/operators';

@Component({
  selector: 'app-splitter-page',
  templateUrl: './sci-splitter-page.component.html',
  styleUrls: ['./sci-splitter-page.component.scss'],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SciFormFieldComponent,
    SciSplitterComponent,
  ],
})
export default class SciSplitterPageComponent {

  protected readonly orientation = signal<'vertical' | 'horizontal'>('vertical');
  protected readonly translate = computed(() => `translate(${this._translateX()}px, ${this._translateY()}px)`);

  private readonly _translateX = linkedSignal({source: this.orientation, computation: () => 0});
  private readonly _translateY = linkedSignal({source: this.orientation, computation: () => 0});

  private moveEventCount = 0;

  constructor() {
    this.installEventsPerAnimationFrameLogger();
  }

  protected onMove(event: SplitterMoveEvent): void {
    this.moveEventCount++;

    if (this.orientation() === 'vertical') {
      this._translateX.update(translateX => translateX + event.distance);
    }
    else {
      this._translateY.update(translateY => translateY + event.distance);
    }
  }

  private installEventsPerAnimationFrameLogger(): void {
    interval(0, animationFrameScheduler)
      .pipe(
        filter(() => this.moveEventCount > 0),
        takeUntilDestroyed(),
      )
      .subscribe(() => {
        console.log(`[SciSplitterPageComponent] eventsPerAnimationFrame="${this.moveEventCount}"`);
        this.moveEventCount = 0;
      });
  }
}
